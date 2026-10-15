use std::{sync::Mutex, time::Duration};
use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_updater::{Update, UpdaterExt};
use tauri_plugin_window_state::{AppHandleExt, StateFlags};

#[derive(Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateStatus {
    revision: u64,
    phase: String,
    current_version: String,
    version: Option<String>,
    notes: Option<String>,
    downloaded: u64,
    total: Option<u64>,
    error: Option<String>,
}

struct DownloadedUpdate { update: Update, bytes: Vec<u8> }

#[derive(Default)]
struct Inner {
    status: UpdateStatus,
    pending: Option<DownloadedUpdate>,
    busy: bool,
}

#[derive(Default)]
pub struct DesktopUpdater(Mutex<Inner>);

fn publish(app: &AppHandle, change: impl FnOnce(&mut UpdateStatus)) {
    let status = {
        let state = app.state::<DesktopUpdater>();
        let mut inner = state.0.lock().expect("update state lock");
        change(&mut inner.status);
        inner.status.revision += 1;
        inner.status.clone()
    };
    let _ = app.emit("taskflow:update", status);
}

#[tauri::command]
pub fn desktop_update_status(app: AppHandle) -> Result<UpdateStatus, String> {
    let state = app.state::<DesktopUpdater>();
    let inner = state.0.lock().map_err(|error| error.to_string())?;
    Ok(inner.status.clone())
}

async fn download_update(app: &AppHandle) -> Result<Option<DownloadedUpdate>, String> {
    let before_exit = app.clone();
    let updater = app.updater_builder()
        .timeout(Duration::from_secs(30))
        .on_before_exit(move || { let _ = before_exit.save_window_state(StateFlags::SIZE | StateFlags::POSITION); })
        .build().map_err(|error| error.to_string())?;
    let Some(mut update) = updater.check().await.map_err(|error| error.to_string())? else { return Ok(None); };
    // Keep update downloads on HTTPS, just like the manifest endpoint.
    if update.download_url.scheme() != "https" { return Err("The update download must use HTTPS.".into()); }
    update.timeout = Some(Duration::from_secs(300));
    publish(app, |status| {
        status.phase = "downloading".into();
        status.version = Some(update.version.clone());
        status.notes = update.body.clone();
    });
    let mut downloaded = 0_u64;
    let mut last_percent = None;
    let bytes = update.download(|chunk, total| {
        downloaded = downloaded.saturating_add(chunk as u64);
        let percent = total.filter(|total| *total > 0).map(|total| downloaded.saturating_mul(100) / total);
        if percent != last_percent || percent.is_none() {
            last_percent = percent;
            publish(app, |status| { status.downloaded = downloaded; status.total = total; });
        }
    }, || {}).await.map_err(|error| error.to_string())?;
    // download() verifies the signature before these bytes can be offered for installation.
    Ok(Some(DownloadedUpdate { update, bytes }))
}

#[tauri::command]
pub fn check_desktop_update(app: AppHandle) -> Result<(), String> {
    {
        let state = app.state::<DesktopUpdater>();
        let mut inner = state.0.lock().map_err(|error| error.to_string())?;
        if inner.busy || inner.pending.is_some() { return Ok(()); }
        inner.busy = true;
    }
    publish(&app, |status| {
        status.phase = "checking".into(); status.error = None;
        status.version = None; status.notes = None; status.downloaded = 0; status.total = None;
    });
    tauri::async_runtime::spawn(async move {
        let result = download_update(&app).await;
        let state = app.state::<DesktopUpdater>();
        let mut inner = state.0.lock().expect("update state lock");
        inner.busy = false;
        match result {
            Ok(Some(pending)) => {
                inner.status.phase = "ready".into();
                inner.status.downloaded = pending.bytes.len() as u64;
                inner.status.total = Some(pending.bytes.len() as u64);
                inner.pending = Some(pending);
            }
            Ok(None) => inner.status.phase = "latest".into(),
            Err(error) => { inner.status.phase = "error".into(); inner.status.error = Some(error); }
        }
        inner.status.revision += 1;
        let status = inner.status.clone();
        drop(inner);
        let _ = app.emit("taskflow:update", status);
    });
    Ok(())
}

#[tauri::command]
pub fn install_desktop_update(app: AppHandle) -> Result<(), String> {
    let pending = {
        let state = app.state::<DesktopUpdater>();
        let mut inner = state.0.lock().map_err(|error| error.to_string())?;
        if inner.busy { return Err("An update operation is already running.".into()); }
        let pending = inner.pending.take().ok_or("No downloaded update is ready.")?;
        inner.busy = true;
        pending
    };
    publish(&app, |status| { status.phase = "installing".into(); status.error = None; });
    tauri::async_runtime::spawn_blocking(move || {
        match pending.update.install(&pending.bytes) {
            Ok(()) => app.restart(),
            Err(error) => {
                let state = app.state::<DesktopUpdater>();
                let mut inner = state.0.lock().expect("update state lock");
                inner.pending = Some(pending); inner.busy = false;
                inner.status.phase = "ready".into(); inner.status.error = Some(error.to_string());
                inner.status.revision += 1;
                let status = inner.status.clone();
                drop(inner);
                let _ = app.emit("taskflow:update", status);
            }
        }
    });
    Ok(())
}

pub fn start(app: &AppHandle) {
    publish(app, |status| {
        status.current_version = app.package_info().version.to_string();
        status.phase = "idle".into();
    });
    if cfg!(debug_assertions) { return; }
    let app = app.clone();
    std::thread::spawn(move || {
        std::thread::sleep(Duration::from_secs(5));
        loop {
            let _ = check_desktop_update(app.clone());
            std::thread::sleep(Duration::from_secs(60 * 60));
        }
    });
}
