use serde::Serialize;
use std::fs;
use std::path::Path;
use tauri::Emitter;

use crate::scanner::{detect_source_type, find_first_image, scan_folder_chapters, scan_zip_chapters_from_archive, scan_epub_chapters_from_doc};

#[derive(Debug, Serialize)]
pub struct ImportResult {
    pub book_id: String,
    pub title: String,
    pub pages_dir: String,
    pub page_count: usize,
    pub cover_path: String,
    pub chapters: Vec<ChapterInfo>,
}

#[derive(Debug, Serialize, Clone)]
pub struct ChapterInfo {
    pub title: String,
    pub chapter_order: usize,
    pub page_files: Vec<String>,
}

/// Initialize a library directory structure
#[tauri::command]
pub fn init_library_dir(library_path: String) -> Result<String, String> {
    let path = Path::new(&library_path);
    let books_dir = path.join("books");

    fs::create_dir_all(&books_dir).map_err(|e| format!("Failed to create library directory: {}", e))?;

    let test_file = path.join(".manga-flow-write-test");
    fs::write(&test_file, "test").map_err(|e| format!("Directory is not writable: {}", e))?;
    fs::remove_file(&test_file).ok();

    Ok(library_path)
}

/// Core import logic, testable without AppHandle.
/// `on_progress` is called with (current, total) during import.
pub fn perform_import(
    source_path: &Path,
    library_dir: &Path,
    source_type: &str,
    on_progress: impl FnMut(usize, usize),
) -> Result<ImportResult, String> {
    let book_id = uuid::Uuid::new_v4().to_string();

    let title = source_path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("Unknown")
        .to_string();

    let book_dir = library_dir.join("books").join(&book_id);
    let pages_dir = book_dir.join("pages");

    fs::create_dir_all(&pages_dir)
        .map_err(|e| format!("Failed to create book directory: {}", e))?;

    let resolved_type = if source_type.is_empty() {
        detect_source_type(source_path)
            .ok_or_else(|| format!("不支持的文件格式: {}", source_path.display()))?
    } else {
        match source_type {
            "folder" | "zip" | "cbz" | "epub" => source_type,
            _ => detect_source_type(source_path)
                .ok_or_else(|| format!("不支持的文件格式: {}", source_path.display()))?,
        }
    };

    let mut on_progress = on_progress;

    let (page_count, chapters) = match resolved_type {
        "folder" => import_from_folder(source_path, &pages_dir, &mut on_progress)?,
        "zip" | "cbz" => import_from_zip(source_path, &pages_dir, &mut on_progress)?,
        "epub" => import_from_epub(source_path, &pages_dir, &mut on_progress)?,
        _ => return Err(format!("Unsupported source type: {}", source_type)),
    };

    if page_count == 0 {
        fs::remove_dir_all(&book_dir).ok();
        let msg = match resolved_type {
            "epub" => "该 epub 文件不包含可识别的图片页面",
            _ => "该文件夹不包含可识别的图片文件",
        };
        return Err(msg.to_string());
    }

    // Write meta.json
    let meta = serde_json::json!({
        "book_uuid": book_id,
        "title": title,
        "source_type": resolved_type,
        "imported_at": chrono::Utc::now().to_rfc3339(),
        "page_count": page_count,
        "chapters": chapters.iter().map(|ch| serde_json::json!({
            "title": ch.title,
            "chapter_order": ch.chapter_order,
            "page_count": ch.page_files.len(),
        })).collect::<Vec<_>>(),
    });
    fs::write(book_dir.join("meta.json"), serde_json::to_string_pretty(&meta).unwrap())
        .map_err(|e| format!("Failed to write meta.json: {}", e))?;

    // Use first page as cover directly — same serving mechanism as Reader pages
    let cover_path = find_first_image(&pages_dir)
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_default();

    Ok(ImportResult {
        book_id,
        title,
        pages_dir: pages_dir.to_string_lossy().to_string(),
        page_count,
        cover_path,
        chapters,
    })
}

/// Import manga: copy/extract files to library directory with chapter support
#[tauri::command]
pub fn import_manga(
    app: tauri::AppHandle,
    source_path: String,
    library_dir: String,
    source_type: String,
) -> Result<ImportResult, String> {
    let source = Path::new(&source_path);
    let library = Path::new(&library_dir);
    let app_ref = app.clone();
    perform_import(source, library, &source_type, move |current, total| {
        emit_import_progress(&app_ref, current, total);
    })
}

/// Delete all files for a book from disk
#[tauri::command]
pub fn delete_book_files(
    library_dir: String,
    book_uuid: String,
) -> Result<(), String> {
    delete_book_dir(Path::new(&library_dir), &book_uuid)
}

/// Core deletion logic, testable without AppHandle.
pub fn delete_book_dir(library_dir: &Path, book_uuid: &str) -> Result<(), String> {
    let book_dir = library_dir.join("books").join(book_uuid);
    if book_dir.exists() {
        fs::remove_dir_all(&book_dir)
            .map_err(|e| format!("Failed to delete book directory: {}", e))?;
    }
    Ok(())
}

fn emit_import_progress(app: &tauri::AppHandle, current: usize, total: usize) {
    let _ = app.emit("import-progress", serde_json::json!({
        "current": current,
        "total": total,
    }));
}

fn import_from_folder(source: &Path, pages_dir: &Path, on_progress: &mut impl FnMut(usize, usize)) -> Result<(usize, Vec<ChapterInfo>), String> {
    let chapter_scans = scan_folder_chapters(source)?;

    // Count total images for progress
    let total_images: usize = chapter_scans.iter().map(|s| s.image_paths.len()).sum();
    on_progress(0, total_images);

    let mut chapters = Vec::new();
    let mut total_count = 0;
    let mut global_index = 0usize;

    for (order, scan) in chapter_scans.iter().enumerate() {
        let mut page_files = Vec::new();
        for img_path in &scan.image_paths {
            global_index += 1;
            let ext = img_path
                .extension()
                .and_then(|e| e.to_str())
                .unwrap_or("jpg");
            let dest_name = format!("{:03}.{}", global_index, ext);
            fs::copy(img_path, pages_dir.join(&dest_name))
                .map_err(|e| format!("Failed to copy image: {}", e))?;
            page_files.push(dest_name);
            on_progress(global_index, total_images);
        }
        total_count += page_files.len();
        chapters.push(ChapterInfo {
            title: scan.title.clone(),
            chapter_order: order + 1,
            page_files,
        });
    }

    Ok((total_count, chapters))
}

fn import_from_zip(source: &Path, pages_dir: &Path, on_progress: &mut impl FnMut(usize, usize)) -> Result<(usize, Vec<ChapterInfo>), String> {
    let file = fs::File::open(source).map_err(|e| format!("Failed to open file: {}", e))?;
    let mut archive = zip::ZipArchive::new(file)
        .map_err(|e| format!("该文件无法解压，可能已损坏: {}", e))?;

    let chapter_scans = scan_zip_chapters_from_archive(&mut archive)?;

    let total_images: usize = chapter_scans.iter().map(|s| s.image_names.len()).sum();
    on_progress(0, total_images);

    let mut chapters = Vec::new();
    let mut total_count = 0;
    let mut global_index = 0usize;

    for (order, scan) in chapter_scans.iter().enumerate() {
        let mut page_files = Vec::new();
        for entry_name in &scan.image_names {
            global_index += 1;
            let ext = Path::new(entry_name)
                .extension()
                .and_then(|e| e.to_str())
                .unwrap_or("jpg");
            let dest_name = format!("{:03}.{}", global_index, ext);

            let mut zip_file = archive
                .by_name(entry_name)
                .map_err(|e| format!("Failed to read zip entry '{}': {}", entry_name, e))?;

            let mut dest_file = fs::File::create(pages_dir.join(&dest_name))
                .map_err(|e| format!("Failed to create file: {}", e))?;

            std::io::copy(&mut zip_file, &mut dest_file)
                .map_err(|e| format!("Failed to extract zip entry: {}", e))?;

            page_files.push(dest_name);
            on_progress(global_index, total_images);
        }
        total_count += page_files.len();
        chapters.push(ChapterInfo {
            title: scan.title.clone(),
            chapter_order: order + 1,
            page_files,
        });
    }

    Ok((total_count, chapters))
}

fn import_from_epub(source: &Path, pages_dir: &Path, on_progress: &mut impl FnMut(usize, usize)) -> Result<(usize, Vec<ChapterInfo>), String> {
    let mut doc = epub::doc::EpubDoc::new(source)
        .map_err(|e| format!("该文件无法解析，可能已损坏: {}", e))?;
    let chapter_scans = scan_epub_chapters_from_doc(&mut doc)?;

    let total_images: usize = chapter_scans.iter().map(|s| s.image_names.len()).sum();
    on_progress(0, total_images);

    let mut chapters = Vec::new();
    let mut total_count = 0;
    let mut global_index = 0usize;

    for (order, scan) in chapter_scans.iter().enumerate() {
        let mut page_files = Vec::new();
        for entry_name in &scan.image_names {
            global_index += 1;

            let image_data = doc.get_resource_by_path(entry_name)
                .ok_or_else(|| format!("无法从 epub 中提取图片: {}", entry_name))?;

            let ext = Path::new(entry_name)
                .extension()
                .and_then(|e| e.to_str())
                .unwrap_or("png");
            let dest_name = format!("{:03}.{}", global_index, ext);

            fs::write(pages_dir.join(&dest_name), &image_data)
                .map_err(|e| format!("Failed to write image: {}", e))?;

            page_files.push(dest_name);
            on_progress(global_index, total_images);
        }
        total_count += page_files.len();
        chapters.push(ChapterInfo {
            title: scan.title.clone(),
            chapter_order: order + 1,
            page_files,
        });
    }

    Ok((total_count, chapters))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::{create_test_epub, create_test_epub_with_toc, create_test_zip};
    use std::io::Write;
    use std::path::PathBuf;

    fn temp_dir(name: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(name);
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    fn create_dummy_image(path: &Path) {
        // Create a minimal 1x1 PNG
        let png_header: [u8; 8] = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
        let mut f = fs::File::create(path).unwrap();
        f.write_all(&png_header).unwrap();
    }

    #[test]
    fn test_init_library_dir_creates_structure() {
        let dir = temp_dir("manga_flow_test_init_lib");
        let result = init_library_dir(dir.to_string_lossy().to_string());
        assert!(result.is_ok());
        assert!(dir.join("books").exists());
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn test_init_library_dir_idempotent() {
        let dir = temp_dir("manga_flow_test_init_lib_idem");
        fs::create_dir_all(dir.join("books")).unwrap();
        let result = init_library_dir(dir.to_string_lossy().to_string());
        assert!(result.is_ok());
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn test_import_from_folder_copies_images() {
        let src_dir = temp_dir("manga_flow_test_import_src");
        let lib_dir = temp_dir("manga_flow_test_import_lib");

        create_dummy_image(&src_dir.join("page1.jpg"));
        create_dummy_image(&src_dir.join("page2.jpg"));

        let result = perform_import(&src_dir, &lib_dir, "folder", |_, _| {});
        assert!(result.is_ok());
        let info = result.unwrap();
        assert_eq!(info.page_count, 2);
        assert_eq!(info.chapters.len(), 1);
        assert_eq!(info.chapters[0].page_files.len(), 2);
        assert!(lib_dir.join("books").join(&info.book_id).join("pages").join("001.jpg").exists());
        assert!(lib_dir.join("books").join(&info.book_id).join("pages").join("002.jpg").exists());
        assert!(lib_dir.join("books").join(&info.book_id).join("meta.json").exists());
        // Cover should point to first image
        assert!(info.cover_path.contains("001.jpg"));

        let _ = fs::remove_dir_all(&src_dir);
        let _ = fs::remove_dir_all(&lib_dir);
    }

    #[test]
    fn test_import_from_folder_empty_dir() {
        let dir = temp_dir("manga_flow_test_import_empty");
        let lib_dir = temp_dir("manga_flow_test_import_empty_lib");
        let result = perform_import(&dir, &lib_dir, "folder", |_, _| {});
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("不包含可识别的图片文件"));
        let _ = fs::remove_dir_all(&dir);
        let _ = fs::remove_dir_all(&lib_dir);
    }

    #[test]
    fn test_import_from_zip_extracts_images() {
        let lib_dir = temp_dir("manga_flow_test_import_zip");

        let zip_path = lib_dir.join("test.zip");
        let dummy_png = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
        create_test_zip(&zip_path, &[
            ("page1.jpg", &dummy_png),
            ("page2.jpg", &dummy_png),
            ("readme.txt", b"not an image"),
        ]);

        let result = perform_import(&zip_path, &lib_dir, "zip", |_, _| {});
        assert!(result.is_ok());
        let info = result.unwrap();
        assert_eq!(info.page_count, 2);
        assert_eq!(info.chapters.len(), 1);
        assert_eq!(info.chapters[0].page_files.len(), 2);
        assert!(info.pages_dir.contains("pages"));

        let _ = fs::remove_dir_all(&lib_dir);
    }

    #[test]
    fn test_import_from_zip_multi_chapter() {
        let lib_dir = temp_dir("manga_flow_test_import_zip_ch");
        let zip_path = lib_dir.join("multi.zip");
        let dummy_png = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
        create_test_zip(&zip_path, &[
            ("ch01/001.jpg", &dummy_png),
            ("ch01/002.jpg", &dummy_png),
            ("ch02/001.jpg", &dummy_png),
        ]);

        let result = perform_import(&zip_path, &lib_dir, "zip", |_, _| {});
        assert!(result.is_ok());
        let info = result.unwrap();
        assert_eq!(info.chapters.len(), 2);
        assert_eq!(info.chapters[0].page_files.len(), 2);
        assert_eq!(info.chapters[1].page_files.len(), 1);

        let _ = fs::remove_dir_all(&lib_dir);
    }

    #[test]
    fn test_delete_book_files_removes_directory() {
        let dir = temp_dir("manga_flow_test_delete");
        let book_uuid = "test-uuid-123";
        let book_dir = dir.join("books").join(book_uuid);
        fs::create_dir_all(book_dir.join("pages")).unwrap();
        create_dummy_image(&book_dir.join("pages").join("001.jpg"));
        create_dummy_image(&book_dir.join("meta.json"));

        assert!(book_dir.exists());

        delete_book_dir(&dir, book_uuid).unwrap();
        assert!(!book_dir.exists());

        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn test_import_corrupted_zip() {
        let dir = temp_dir("manga_flow_test_import_corrupt");
        let lib_dir = temp_dir("manga_flow_test_import_corrupt_lib");
        let zip_path = dir.join("broken.zip");
        fs::write(&zip_path, b"this is not a valid zip file at all").unwrap();

        let result = perform_import(&zip_path, &lib_dir, "zip", |_, _| {});
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("该文件无法解压，可能已损坏"));

        let _ = fs::remove_dir_all(&dir);
        let _ = fs::remove_dir_all(&lib_dir);
    }

    #[test]
    fn test_perform_import_creates_meta_json() {
        let src_dir = temp_dir("manga_flow_test_meta_src");
        let lib_dir = temp_dir("manga_flow_test_meta_lib");
        create_dummy_image(&src_dir.join("001.jpg"));

        let result = perform_import(&src_dir, &lib_dir, "folder", |_, _| {});
        assert!(result.is_ok());
        let info = result.unwrap();

        let meta_path = lib_dir.join("books").join(&info.book_id).join("meta.json");
        assert!(meta_path.exists());
        let meta_str = fs::read_to_string(&meta_path).unwrap();
        let meta: serde_json::Value = serde_json::from_str(&meta_str).unwrap();
        assert_eq!(meta["title"], "manga_flow_test_meta_src");
        assert_eq!(meta["source_type"], "folder");
        assert!(meta["imported_at"].is_string());
        assert_eq!(meta["page_count"], 1);
        let chapters = meta["chapters"].as_array().unwrap();
        assert_eq!(chapters.len(), 1);
        assert_eq!(chapters[0]["title"], "默认章节");
        assert_eq!(chapters[0]["page_count"], 1);

        let _ = fs::remove_dir_all(&src_dir);
        let _ = fs::remove_dir_all(&lib_dir);
    }

    #[test]
    fn test_perform_import_progress_callback() {
        let src_dir = temp_dir("manga_flow_test_progress_src");
        let lib_dir = temp_dir("manga_flow_test_progress_lib");
        create_dummy_image(&src_dir.join("001.jpg"));
        create_dummy_image(&src_dir.join("002.jpg"));
        create_dummy_image(&src_dir.join("003.jpg"));

        let mut progress_calls: Vec<(usize, usize)> = Vec::new();
        perform_import(&src_dir, &lib_dir, "folder", |current, total| {
            progress_calls.push((current, total));
        }).unwrap();

        // Should get: (0, 3) at start, then (1, 3), (2, 3), (3, 3)
        assert_eq!(progress_calls.len(), 4);
        assert_eq!(progress_calls[0], (0, 3));
        assert_eq!(progress_calls[3], (3, 3));

        let _ = fs::remove_dir_all(&src_dir);
        let _ = fs::remove_dir_all(&lib_dir);
    }

    #[test]
    fn test_delete_book_dir_nonexistent() {
        let dir = temp_dir("manga_flow_test_delete_nonexist");
        // Should succeed even if book doesn't exist
        let result = delete_book_dir(&dir, "nonexistent-uuid");
        assert!(result.is_ok());
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn test_import_from_cbz_extracts_images() {
        let lib_dir = temp_dir("manga_flow_test_import_cbz");

        let cbz_path = lib_dir.join("test.cbz");
        let dummy_png = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
        create_test_zip(&cbz_path, &[
            ("page1.jpg", &dummy_png),
            ("page2.jpg", &dummy_png),
        ]);

        let result = perform_import(&cbz_path, &lib_dir, "cbz", |_, _| {});
        assert!(result.is_ok());
        let info = result.unwrap();
        assert_eq!(info.page_count, 2);
        assert!(info.cover_path.contains("001.jpg"));

        // Verify meta.json records cbz source type
        let meta_path = lib_dir.join("books").join(&info.book_id).join("meta.json");
        let meta: serde_json::Value = serde_json::from_str(&fs::read_to_string(&meta_path).unwrap()).unwrap();
        assert_eq!(meta["source_type"], "cbz");

        let _ = fs::remove_dir_all(&lib_dir);
    }

    #[test]
    fn test_duplicate_import_creates_separate_books() {
        let src_dir = temp_dir("manga_flow_test_dup_src");
        let lib_dir = temp_dir("manga_flow_test_dup_lib");
        create_dummy_image(&src_dir.join("001.jpg"));

        let result1 = perform_import(&src_dir, &lib_dir, "folder", |_, _| {}).unwrap();
        let result2 = perform_import(&src_dir, &lib_dir, "folder", |_, _| {}).unwrap();

        // Each import gets a unique book ID
        assert_ne!(result1.book_id, result2.book_id);

        // Both books exist in library
        let book1_dir = lib_dir.join("books").join(&result1.book_id);
        let book2_dir = lib_dir.join("books").join(&result2.book_id);
        assert!(book1_dir.exists());
        assert!(book2_dir.exists());

        let _ = fs::remove_dir_all(&src_dir);
        let _ = fs::remove_dir_all(&lib_dir);
    }

    #[test]
    fn test_import_from_epub_extracts_images() {
        let lib_dir = temp_dir("manga_flow_test_import_epub");

        let epub_path = lib_dir.join("test.epub");
        create_test_epub(&epub_path, &[
            ("page1.xhtml", "page1.jpg"),
            ("page2.xhtml", "page2.png"),
        ]);

        let result = perform_import(&epub_path, &lib_dir, "epub", |_, _| {});
        assert!(result.is_ok(), "epub import failed: {:?}", result.err());
        let info = result.unwrap();
        assert_eq!(info.page_count, 2);
        assert_eq!(info.chapters.len(), 1);
        assert!(info.cover_path.contains("001"));

        // Verify meta.json records epub source type
        let meta_path = lib_dir.join("books").join(&info.book_id).join("meta.json");
        let meta: serde_json::Value = serde_json::from_str(&fs::read_to_string(&meta_path).unwrap()).unwrap();
        assert_eq!(meta["source_type"], "epub");

        let _ = fs::remove_dir_all(&lib_dir);
    }

    #[test]
    fn test_import_from_epub_with_toc() {
        let lib_dir = temp_dir("manga_flow_test_import_epub_toc");

        let epub_path = lib_dir.join("test_toc.epub");
        create_test_epub_with_toc(&epub_path, &[
            ("第一章", 2),
            ("第二章", 1),
        ]);

        let result = perform_import(&epub_path, &lib_dir, "epub", |_, _| {});
        assert!(result.is_ok(), "epub import with toc failed: {:?}", result.err());
        let info = result.unwrap();
        assert_eq!(info.page_count, 3);
        assert_eq!(info.chapters.len(), 2);
        assert_eq!(info.chapters[0].title, "第一章");
        assert_eq!(info.chapters[0].page_files.len(), 2);
        assert_eq!(info.chapters[1].title, "第二章");
        assert_eq!(info.chapters[1].page_files.len(), 1);

        let _ = fs::remove_dir_all(&lib_dir);
    }

}
