use tauri::{
  menu::{Menu, MenuItem},
  tray::TrayIconBuilder,
  AppHandle, Emitter, Manager, WindowEvent,
};
use std::sync::Mutex;
use tauri_plugin_window_state::{AppHandleExt, StateFlags};

struct PendingTask(Mutex<Option<String>>);

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
    .invoke_handler(tauri::generate_handler![open_main_window, take_pending_task, hide_widget])
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
