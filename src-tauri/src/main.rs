#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use serde::{Deserialize, Serialize};
use std::{fs, sync::Mutex};
use tauri::{menu::{Menu, MenuItem}, tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent}, Manager, State, WindowEvent};

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Preferences { language: String, theme: String, close_action: String }
impl Default for Preferences {
    fn default() -> Self { Self { language: "pt-BR".into(), theme: "system".into(), close_action: "exit".into() } }
}
struct AppState(Mutex<Preferences>);

fn config_path(app: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    app.path().app_config_dir().map(|p| p.join("preferences.json")).map_err(|e| e.to_string())
}
fn load_preferences(app: &tauri::AppHandle) -> Preferences {
    config_path(app).ok().and_then(|p| fs::read(p).ok()).and_then(|data| serde_json::from_slice(&data).ok()).unwrap_or_default()
}
fn reveal(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") { let _ = window.show(); let _ = window.unminimize(); let _ = window.set_focus(); }
}
#[tauri::command]
fn get_preferences(state: State<'_, AppState>) -> Result<Preferences, String> {
    state.0.lock().map(|p| p.clone()).map_err(|e| e.to_string())
}
#[tauri::command]
fn save_preferences(app: tauri::AppHandle, state: State<'_, AppState>, preferences: Preferences) -> Result<(), String> {
    if !["pt-BR", "en"].contains(&preferences.language.as_str()) || !["system", "light", "dark"].contains(&preferences.theme.as_str()) || !["tray", "exit"].contains(&preferences.close_action.as_str()) { return Err("Invalid preferences".into()); }
    let path = config_path(&app)?;
    fs::create_dir_all(path.parent().ok_or("Invalid path")?).map_err(|e| e.to_string())?;
    let data = serde_json::to_vec_pretty(&preferences).map_err(|e| e.to_string())?;
    fs::write(path, data).map_err(|e| e.to_string())?;
    *state.0.lock().map_err(|e| e.to_string())? = preferences.clone();
    if let Some(tray) = app.tray_by_id("main-tray") { let menu = tray_menu(&app, &preferences.language)?; tray.set_menu(Some(menu)).map_err(|e| e.to_string())?; }
    Ok(())
}
fn tray_menu(app: &tauri::AppHandle, language: &str) -> Result<Menu<tauri::Wry>, String> {
    let (open, quit) = if language == "en" { ("Open Studio", "Quit") } else { ("Abrir o Studio", "Encerrar") };
    let open = MenuItem::with_id(app, "open", open, true, None::<&str>).map_err(|e| e.to_string())?;
    let quit = MenuItem::with_id(app, "quit", quit, true, None::<&str>).map_err(|e| e.to_string())?;
    Menu::with_items(app, &[&open, &quit]).map_err(|e| e.to_string())
}
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, args, _| { if !args.iter().any(|a| a == "--minimized") { reveal(app); } }))
        .plugin(tauri_plugin_autostart::init(tauri_plugin_autostart::MacosLauncher::LaunchAgent, Some(vec!["--minimized"])))
        .setup(|app| {
            let handle = app.handle().clone();
            let prefs = load_preferences(&handle);
            let menu = tray_menu(&handle, &prefs.language).map_err(std::io::Error::other)?;
            app.manage(AppState(Mutex::new(prefs)));
            let icon = app.default_window_icon().cloned().ok_or_else(|| std::io::Error::other("Missing tray icon"))?;
            TrayIconBuilder::with_id("main-tray").icon(icon).tooltip("Attack Shark X3 Studio").menu(&menu).show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id().as_ref() { "open" => reveal(app), "quit" => app.exit(0), _ => {} })
                .on_tray_icon_event(|tray, event| { if let TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, .. } = event { reveal(tray.app_handle()); } })
                .build(app)?;
            if !std::env::args().any(|arg| arg == "--minimized") { reveal(&handle); }
            Ok(())
        })
        .on_window_event(|window, event| { if let WindowEvent::CloseRequested { api, .. } = event { let action = window.state::<AppState>().0.lock().map(|p| p.close_action.clone()).unwrap_or_else(|_| "exit".into()); if action == "tray" { api.prevent_close(); let _ = window.hide(); } else { window.app_handle().exit(0); } } })
        .invoke_handler(tauri::generate_handler![get_preferences, save_preferences])
        .run(tauri::generate_context!())
        .expect("Failed to run Attack Shark X3 Studio");
}
