use tauri::Manager;

mod commands;
mod scanner;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_sql::Builder::new().build())
        .setup(|app| {
            let data_dir = app
                .path()
                .app_data_dir()
                .expect("failed to resolve app data dir");
            std::fs::create_dir_all(&data_dir).ok();
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::init_library_dir,
            commands::import_manga,
            commands::delete_book_files,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
