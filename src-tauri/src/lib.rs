use tauri::{
  menu::{Menu, MenuItem},
  tray::TrayIconBuilder,
  AppHandle, Emitter, Manager, WindowEvent,
};
use std::sync::Mutex;
use std::{io::{Read, Write}, net::TcpListener, time::{Duration, Instant}};
use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine as _};
use rand::RngCore;
use serde::Deserialize;
use sha2::{Digest, Sha256};
use tauri_plugin_window_state::{AppHandleExt, StateFlags};

struct PendingTask(Mutex<Option<String>>);
struct GoogleSignIn(Mutex<bool>);

#[derive(Deserialize)]
struct GoogleTokens { id_token: String }

fn random_url_safe() -> String {
  let mut bytes = [0u8; 32];
  rand::rngs::OsRng.fill_bytes(&mut bytes);
  URL_SAFE_NO_PAD.encode(bytes)
}

fn google_sign_in_flow(client_id: String) -> Result<String, String> {
  let listener = TcpListener::bind("127.0.0.1:0").map_err(|e| e.to_string())?;
  listener.set_nonblocking(true).map_err(|e| e.to_string())?;
  let port = listener.local_addr().map_err(|e| e.to_string())?.port();
  let redirect_uri = format!("http://127.0.0.1:{port}/callback");
  let verifier = random_url_safe();
  let challenge = URL_SAFE_NO_PAD.encode(Sha256::digest(verifier.as_bytes()));
  let state = random_url_safe();
  let mut authorize = url::Url::parse("https://accounts.google.com/o/oauth2/v2/auth").map_err(|e| e.to_string())?;
  authorize.query_pairs_mut()
    .append_pair("client_id", &client_id)
    .append_pair("redirect_uri", &redirect_uri)
    .append_pair("response_type", "code")
    .append_pair("scope", "openid email profile")
    .append_pair("state", &state)
    .append_pair("code_challenge", &challenge)
    .append_pair("code_challenge_method", "S256");
  #[cfg(target_os = "windows")]
  std::process::Command::new("rundll32.exe")
    .args(["url.dll,FileProtocolHandler", authorize.as_str()])
    .spawn().map_err(|e| format!("Could not open your browser: {e}"))?;
  #[cfg(not(target_os = "windows"))]
  return Err("System browser sign-in is currently supported on Windows only".into());

  let deadline = Instant::now() + Duration::from_secs(180);
  let code = loop {
    if Instant::now() >= deadline { return Err("Google sign-in timed out. Please try again.".into()); }
    match listener.accept() {
      Ok((mut stream, address)) => {
        if !address.ip().is_loopback() { continue; }
        stream.set_read_timeout(Some(Duration::from_secs(3))).map_err(|e| e.to_string())?;
        let mut buffer = [0u8; 8192];
        let count = stream.read(&mut buffer).map_err(|e| e.to_string())?;
        let request = String::from_utf8_lossy(&buffer[..count]);
        let target = request.lines().next().and_then(|line| line.split_whitespace().nth(1)).unwrap_or("");
        let parsed = url::Url::parse(&format!("http://127.0.0.1:{port}{target}"));
        let Ok(parsed) = parsed else { continue };
        if parsed.path() != "/callback" { continue; }
        let params: std::collections::HashMap<_, _> = parsed.query_pairs().into_owned().collect();
        if params.get("state") != Some(&state) {
          let _ = stream.write_all(b"HTTP/1.1 400 Bad Request\r\nContent-Length: 21\r\n\r\nInvalid sign-in state.");
          continue;
        }
        let result = if let Some(code) = params.get("code") { Ok(code.clone()) }
          else { Err(format!("Google sign-in failed: {}", params.get("error").map(String::as_str).unwrap_or("missing authorization code"))) };
        let body = if result.is_ok() { "Sign-in received. You can return to TaskFlow." } else { "Sign-in was not completed. You can return to TaskFlow." };
        let reply = format!("HTTP/1.1 200 OK\r\nContent-Type: text/plain; charset=utf-8\r\nCache-Control: no-store\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}", body.len());
        let _ = stream.write_all(reply.as_bytes());
        break result?;
      }
      Err(e) if e.kind() == std::io::ErrorKind::WouldBlock => std::thread::sleep(Duration::from_millis(100)),
      Err(e) => return Err(e.to_string()),
    }
  };
  let mut fields = vec![("client_id", client_id.as_str()), ("code", code.as_str()), ("code_verifier", verifier.as_str()), ("redirect_uri", redirect_uri.as_str()), ("grant_type", "authorization_code")];
  if let Some(secret) = option_env!("GOOGLE_DESKTOP_CLIENT_SECRET") {
    fields.push(("client_secret", secret));
  }
  let response = reqwest::blocking::Client::builder().timeout(Duration::from_secs(15)).build().map_err(|e| e.to_string())?
    .post("https://oauth2.googleapis.com/token")
    .form(&fields)
    .send().map_err(|e| format!("Google token exchange failed: {e}"))?;
  if !response.status().is_success() {
    let status = response.status();
    let details: serde_json::Value = response.json().unwrap_or_default();
    let reason = details.get("error_description").and_then(|value| value.as_str())
      .or_else(|| details.get("error").and_then(|value| value.as_str()))
      .unwrap_or("Check the Desktop OAuth client configuration.");
    return Err(format!("Google token exchange failed (HTTP {status}): {reason}"));
  }
  response.json::<GoogleTokens>().map(|tokens| tokens.id_token).map_err(|e| format!("Invalid Google token response: {e}"))
}

#[tauri::command]
async fn sign_in_with_google(client_id: String, app: AppHandle) -> Result<String, String> {
  if client_id.trim().is_empty() { return Err("Set VITE_GOOGLE_DESKTOP_CLIENT_ID to a Google Desktop OAuth client ID.".into()); }
  let state = app.state::<GoogleSignIn>();
  {
    let mut active = state.0.lock().map_err(|e| e.to_string())?;
    if *active { return Err("Google sign-in is already in progress.".into()); }
    *active = true;
  }
  let result = tauri::async_runtime::spawn_blocking(move || google_sign_in_flow(client_id)).await.map_err(|e| e.to_string());
  *state.0.lock().map_err(|e| e.to_string())? = false;
  result?
}

fn set_window_visible(app: &AppHandle, label: &str, visible: bool) -> Result<(), String> {
  let window = app.get_webview_window(label).ok_or(format!("{label} window is unavailable"))?;
  if visible {
    window.show().map_err(|error| error.to_string())?;
    window.set_focus().map_err(|error| error.to_string())?;
  } else {
    window.hide().map_err(|error| error.to_string())?;
  }
  let _ = app.emit_to(label, "taskflow:visibility", visible);
  Ok(())
}

fn show_main(app: &AppHandle, task_id: Option<String>) -> Result<(), String> {
  if let Some(task_id) = task_id {
    *app.state::<PendingTask>().0.lock().map_err(|error| error.to_string())? = Some(task_id);
  }
  set_window_visible(app, "main", true)?;
  let _ = app.emit_to("main", "taskflow:open-task", ());
  Ok(())
}

#[tauri::command]
fn open_main_window(app: AppHandle, task_id: Option<String>) -> Result<(), String> {
  show_main(&app, task_id)
}

#[tauri::command]
fn take_pending_task(app: AppHandle) -> Result<Option<String>, String> {
  Ok(app.state::<PendingTask>().0.lock().map_err(|error| error.to_string())?.take())
}

#[tauri::command]
fn hide_widget(app: AppHandle) -> Result<(), String> {
  set_window_visible(&app, "widget", false)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_window_state::Builder::default()
      .with_state_flags(StateFlags::SIZE | StateFlags::POSITION)
      .build())
    .manage(PendingTask(Mutex::new(None)))
    .manage(GoogleSignIn(Mutex::new(false)))
    .invoke_handler(tauri::generate_handler![open_main_window, take_pending_task, hide_widget, sign_in_with_google])
    .setup(|app| {
      let toggle = MenuItem::with_id(app, "toggle", "Show/Hide Widget", true, None::<&str>)?;
      let open = MenuItem::with_id(app, "open", "Open TaskFlow", true, None::<&str>)?;
      let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
      let menu = Menu::with_items(app, &[&toggle, &open, &quit])?;

      TrayIconBuilder::new()
        .icon(app.default_window_icon().expect("app icon").clone())
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
          "toggle" => {
            if let Some(window) = app.get_webview_window("widget") {
              let _ = set_window_visible(app, "widget", !window.is_visible().unwrap_or(false));
            }
          }
          "open" => { let _ = show_main(app, None); }
          "quit" => {
            let _ = app.save_window_state(StateFlags::SIZE | StateFlags::POSITION);
            app.exit(0);
          }
          _ => {}
        })
        .build(app)?;
      Ok(())
    })
    .on_window_event(|window, event| {
      if window.label() == "widget" || window.label() == "main" {
        if let WindowEvent::CloseRequested { api, .. } = event {
          api.prevent_close();
          if window.hide().is_ok() {
            let _ = window.app_handle().emit_to(window.label(), "taskflow:visibility", false);
          }
        }
      }
    })
    .run(tauri::generate_context!())
    .expect("error while running TaskFlow Widget");
}
