use std::path::{Path, PathBuf};

/// Check if a file extension is a supported image format
pub fn is_image_file(path: &Path) -> bool {
    path.extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| {
            matches!(
                ext.to_lowercase().as_str(),
                "jpg" | "jpeg" | "png" | "webp" | "gif"
            )
        })
        .unwrap_or(false)
}

/// Natural sort comparison for strings containing numbers
pub fn natural_sort_key(s: &str) -> Vec<StringOrNumber> {
    let mut result = Vec::new();
    let mut current_num = String::new();
    let mut in_number = false;

    for ch in s.chars() {
        if ch.is_ascii_digit() {
            if !in_number && !current_num.is_empty() {
                result.push(StringOrNumber::String(current_num.clone()));
                current_num.clear();
            }
            in_number = true;
            current_num.push(ch);
        } else {
            if in_number && !current_num.is_empty() {
                let num: u64 = current_num.parse().unwrap_or(0);
                result.push(StringOrNumber::Number(num));
                current_num.clear();
            }
            in_number = false;
            current_num.push(ch.to_lowercase().next().unwrap_or(ch));
        }
    }

    if in_number && !current_num.is_empty() {
        let num: u64 = current_num.parse().unwrap_or(0);
        result.push(StringOrNumber::Number(num));
    } else if !current_num.is_empty() {
        result.push(StringOrNumber::String(current_num));
    }

    result
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub enum StringOrNumber {
    String(String),
    Number(u64),
}

#[derive(Debug)]
/// Represents a chapter found during scanning
pub struct ChapterScan {
    pub title: String,
    pub image_paths: Vec<std::path::PathBuf>, // for folder scan
    pub image_names: Vec<String>,             // for zip scan
}

/// Scan a folder for manga chapters.
/// If subfolders exist containing images, each becomes a chapter.
/// Otherwise all images in the root form a single default chapter.
pub fn scan_folder_chapters(folder_path: &Path) -> Result<Vec<ChapterScan>, String> {
    if !folder_path.exists() {
        return Err(format!("Folder does not exist: {}", folder_path.display()));
    }
    if !folder_path.is_dir() {
        return Err(format!("Path is not a directory: {}", folder_path.display()));
    }

    // Check for subdirectories containing images
    let mut subdirs: Vec<std::path::PathBuf> = std::fs::read_dir(folder_path)
        .map_err(|e| format!("Failed to read directory: {}", e))?
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().map(|t| t.is_dir()).unwrap_or(false))
        .map(|e| e.path())
        .filter(|p| {
            // Only include subdirs that contain at least one image
            std::fs::read_dir(p)
                .ok()
                .map(|mut dir| dir.any(|e| e.ok().map(|e| is_image_file(&e.path())).unwrap_or(false)))
                .unwrap_or(false)
        })
        .collect();

    subdirs.sort_by(|a, b| {
        let key_a = natural_sort_key(&a.file_name().unwrap_or_default().to_string_lossy());
        let key_b = natural_sort_key(&b.file_name().unwrap_or_default().to_string_lossy());
        key_a.cmp(&key_b)
    });

    if !subdirs.is_empty() {
        // Multi-chapter: each subdirectory is a chapter
        let mut chapters = Vec::new();
        for subdir in subdirs {
            let title = subdir
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("Unknown")
                .to_string();
            let images = scan_folder_for_images(&subdir)?;
            if !images.is_empty() {
                chapters.push(ChapterScan {
                    title,
                    image_paths: images,
                    image_names: Vec::new(),
                });
            }
        }
        if chapters.is_empty() {
            return Err("该文件夹不包含可识别的图片文件".to_string());
        }
        return Ok(chapters);
    }

    // Single chapter: all images in root
    let images = scan_folder_for_images(folder_path)?;
    if images.is_empty() {
        return Err("该文件夹不包含可识别的图片文件".to_string());
    }

    Ok(vec![ChapterScan {
        title: "默认章节".to_string(),
        image_paths: images,
        image_names: Vec::new(),
    }])
}

/// Scan a folder for image files (flat, single level), returning paths sorted naturally
pub fn scan_folder_for_images(folder_path: &Path) -> Result<Vec<std::path::PathBuf>, String> {
    if !folder_path.exists() {
        return Err(format!("Folder does not exist: {}", folder_path.display()));
    }
    if !folder_path.is_dir() {
        return Err(format!("Path is not a directory: {}", folder_path.display()));
    }

    let mut images: Vec<std::path::PathBuf> = std::fs::read_dir(folder_path)
        .map_err(|e| format!("Failed to read directory: {}", e))?
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().map(|t| t.is_file()).unwrap_or(false))
        .filter(|e| is_image_file(&e.path()))
        .map(|e| e.path())
        .collect();

    images.sort_by(|a, b| {
        let key_a = natural_sort_key(&a.file_name().unwrap_or_default().to_string_lossy());
        let key_b = natural_sort_key(&b.file_name().unwrap_or_default().to_string_lossy());
        key_a.cmp(&key_b)
    });

    Ok(images)
}

/// Scan a zip/cbz for manga chapters using an already-open archive.
/// Groups images by their parent directory. If multiple directories exist, each is a chapter.
pub fn scan_zip_chapters_from_archive(archive: &mut zip::ZipArchive<std::fs::File>) -> Result<Vec<ChapterScan>, String> {
    // Collect all image entries with their parent directories
    let mut entries: Vec<(String, String)> = Vec::new(); // (parent_dir, entry_name)
    for i in 0..archive.len() {
        let zf = archive.by_index(i).map_err(|e| format!("Failed to read zip entry: {}", e))?;
        if zf.is_file() {
            let name = zf.name().to_string();
            let path = Path::new(&name);
            if is_image_file(path) {
                let parent = path
                    .parent()
                    .and_then(|p| p.to_str())
                    .unwrap_or("")
                    .to_string();
                entries.push((parent, name));
            }
        }
    }

    if entries.is_empty() {
        return Err("该文件不包含可识别的图片文件".to_string());
    }

    // Group by parent directory
    let mut dir_groups: std::collections::BTreeMap<String, Vec<String>> = std::collections::BTreeMap::new();
    for (dir, name) in &entries {
        dir_groups.entry(dir.clone()).or_default().push(name.clone());
    }

    // Sort images within each group naturally
    for images in dir_groups.values_mut() {
        images.sort_by(|a, b| {
            let key_a = natural_sort_key(&Path::new(a).file_name().unwrap_or_default().to_string_lossy());
            let key_b = natural_sort_key(&Path::new(b).file_name().unwrap_or_default().to_string_lossy());
            key_a.cmp(&key_b)
        });
    }

    if dir_groups.len() == 1 {
        // Single chapter
        let images = dir_groups.into_values().next().unwrap();
        return Ok(vec![ChapterScan {
            title: "默认章节".to_string(),
            image_paths: Vec::new(),
            image_names: images,
        }]);
    }

    // Multi-chapter: sort directories naturally
    let mut dir_names: Vec<String> = dir_groups.keys().cloned().collect();
    dir_names.sort_by(|a, b| natural_sort_key(a).cmp(&natural_sort_key(b)));

    let mut chapters = Vec::new();
    for dir_name in dir_names {
        let images = dir_groups.remove(&dir_name).unwrap();
        let title = if dir_name.is_empty() {
            "默认章节".to_string()
        } else {
            Path::new(&dir_name)
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or(&dir_name)
                .to_string()
        };
        chapters.push(ChapterScan {
            title,
            image_paths: Vec::new(),
            image_names: images,
        });
    }

    Ok(chapters)
}

/// Scan an already-opened epub doc for manga chapters.
/// Parses spine entries to find images, uses TOC for chapter grouping.
pub fn scan_epub_chapters_from_doc(doc: &mut epub::doc::EpubDoc<std::io::BufReader<std::fs::File>>) -> Result<Vec<ChapterScan>, String> {
    let num_pages = doc.get_num_chapters();

    // Collect images in spine order: (spine_index, image_archive_path)
    let mut spine_images: Vec<(usize, String)> = Vec::new();

    for spine_idx in 0..num_pages {
        doc.set_current_chapter(spine_idx);

        let current_path = match doc.get_current_path() {
            Some(p) => p,
            None => continue,
        };
        let base = current_path.parent().unwrap_or(Path::new(""));

        if let Some((xhtml, _mime)) = doc.get_current_str() {
            for img_src in parse_img_sources(&xhtml) {
                let resolved = base.join(&img_src);
                let full_path = normalize_archive_path(&resolved.to_string_lossy());
                // Only include actual image files (skip SVGs for now)
                if is_image_file(Path::new(&full_path)) {
                    spine_images.push((spine_idx, full_path));
                }
            }
        }
    }

    if spine_images.is_empty() {
        return Err("该 epub 文件不包含可识别的图片页面".to_string());
    }

    // Build chapters from TOC
    let toc = doc.toc.clone();
    if toc.is_empty() {
        let images: Vec<String> = spine_images.into_iter().map(|(_, p)| p).collect();
        return Ok(vec![ChapterScan {
            title: "默认章节".to_string(),
            image_paths: Vec::new(),
            image_names: images,
        }]);
    }

    // Map TOC entries to spine indices
    let mut chapter_boundaries: Vec<(String, usize)> = Vec::new();
    for nav in &toc {
        if let Some(ch_idx) = doc.resource_uri_to_chapter(&nav.content) {
            chapter_boundaries.push((nav.label.clone(), ch_idx));
        }
    }
    chapter_boundaries.sort_by_key(|(_, idx)| *idx);
    chapter_boundaries.dedup_by_key(|(_, idx)| *idx);

    if chapter_boundaries.is_empty() {
        let images: Vec<String> = spine_images.into_iter().map(|(_, p)| p).collect();
        return Ok(vec![ChapterScan {
            title: "默认章节".to_string(),
            image_paths: Vec::new(),
            image_names: images,
        }]);
    }

    // Group images by chapter
    let mut chapters = Vec::new();

    // Handle images before first TOC entry
    let first_idx = chapter_boundaries[0].1;
    let pre_images: Vec<String> = spine_images.iter()
        .filter(|(idx, _)| *idx < first_idx)
        .map(|(_, p)| p.clone())
        .collect();
    if !pre_images.is_empty() {
        chapters.push(ChapterScan {
            title: "默认章节".to_string(),
            image_paths: Vec::new(),
            image_names: pre_images,
        });
    }

    for (ch_i, (title, start_idx)) in chapter_boundaries.iter().map(|(t, i)| (t.clone(), *i)).enumerate() {
        let end_idx = if ch_i + 1 < chapter_boundaries.len() {
            chapter_boundaries[ch_i + 1].1
        } else {
            num_pages
        };

        let images: Vec<String> = spine_images.iter()
            .filter(|(spine_idx, _)| *spine_idx >= start_idx && *spine_idx < end_idx)
            .map(|(_, p)| p.clone())
            .collect();

        if !images.is_empty() {
            chapters.push(ChapterScan {
                title: title.clone(),
                image_paths: Vec::new(),
                image_names: images,
            });
        }
    }

    // Fallback: if no images matched any chapter, put all in default
    if chapters.is_empty() {
        let images: Vec<String> = spine_images.into_iter().map(|(_, p)| p).collect();
        chapters.push(ChapterScan {
            title: "默认章节".to_string(),
            image_paths: Vec::new(),
            image_names: images,
        });
    }

    Ok(chapters)
}

/// Test-only convenience: opens an epub file and delegates to `scan_epub_chapters_from_doc`.
/// Production code calls `scan_epub_chapters_from_doc` directly to reuse the opened EpubDoc.
#[cfg(test)]
pub fn scan_epub_chapters(epub_path: &Path) -> Result<Vec<ChapterScan>, String> {
    if !epub_path.exists() {
        return Err(format!("File does not exist: {}", epub_path.display()));
    }

    let mut doc = epub::doc::EpubDoc::new(epub_path)
        .map_err(|e| format!("该文件无法解析，可能已损坏: {}", e))?;

    scan_epub_chapters_from_doc(&mut doc)
}

/// Parse <img src="..."> attributes from XHTML content.
fn parse_img_sources(xhtml: &str) -> Vec<String> {
    let re = regex::Regex::new(r#"<img[^>]+src\s*=\s*["']([^"']+)["']"#).unwrap();
    re.captures_iter(xhtml)
        .filter_map(|cap| cap.get(1).map(|m| m.as_str().to_string()))
        .collect()
}

/// Normalize a ZIP/epub archive path by resolving `.` and `..` components.
fn normalize_archive_path(path: &str) -> String {
    let mut result: Vec<&str> = Vec::new();
    for part in path.split(&['/', '\\']) {
        match part {
            "" | "." => {}
            ".." => { result.pop(); }
            _ => result.push(part),
        }
    }
    result.join("/")
}

/// Convenience wrapper: open a zip file and scan for chapters.
#[cfg(test)]
pub fn scan_zip_chapters(zip_path: &Path) -> Result<Vec<ChapterScan>, String> {
    if !zip_path.exists() {
        return Err(format!("File does not exist: {}", zip_path.display()));
    }

    let file = std::fs::File::open(zip_path).map_err(|e| format!("Failed to open file: {}", e))?;
    let mut archive = zip::ZipArchive::new(file)
        .map_err(|e| format!("该文件无法解压，可能已损坏: {}", e))?;

    scan_zip_chapters_from_archive(&mut archive)
}

/// Detect source type from file path extension.
/// Returns None for unsupported file types (not folder/zip/cbz).
pub fn detect_source_type(path: &Path) -> Option<&'static str> {
    if path.is_dir() {
        return Some("folder");
    }
    match path.extension().and_then(|e| e.to_str()).map(|e| e.to_lowercase()) {
        Some(ext) if ext == "zip" => Some("zip"),
        Some(ext) if ext == "cbz" => Some("cbz"),
        Some(ext) if ext == "epub" => Some("epub"),
        _ => None,
    }
}

/// Find the first image in a directory by natural sort order.
/// Used to determine the cover image for a book.
pub fn find_first_image(dir: &Path) -> Result<PathBuf, String> {
    let mut entries: Vec<PathBuf> = walkdir::WalkDir::new(dir)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file())
        .filter(|e| is_image_file(e.path()))
        .map(|e| e.path().to_path_buf())
        .collect();

    entries.sort_by(|a, b| {
        let key_a = natural_sort_key(&a.strip_prefix(dir).unwrap_or(a).to_string_lossy());
        let key_b = natural_sort_key(&b.strip_prefix(dir).unwrap_or(b).to_string_lossy());
        key_a.cmp(&key_b)
    });

    entries.into_iter().next().ok_or_else(|| "No images found for cover generation".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::{create_test_epub, create_test_epub_with_toc, create_test_zip};
    use std::fs;
    use std::io::Write;

    #[test]
    fn test_natural_sort() {
        let mut names = vec![
            "page10.jpg",
            "page2.jpg",
            "page1.jpg",
            "page20.jpg",
            "page3.jpg",
        ];
        names.sort_by_key(|n| natural_sort_key(n));
        assert_eq!(
            names,
            vec!["page1.jpg", "page2.jpg", "page3.jpg", "page10.jpg", "page20.jpg"]
        );
    }

    #[test]
    fn test_is_image_file() {
        assert!(is_image_file(Path::new("test.jpg")));
        assert!(is_image_file(Path::new("test.JPEG")));
        assert!(is_image_file(Path::new("test.png")));
        assert!(is_image_file(Path::new("test.webp")));
        assert!(!is_image_file(Path::new("test.txt")));
        assert!(!is_image_file(Path::new("test.pdf")));
    }

    #[test]
    fn test_scan_folder_for_images() {
        let dir = std::env::temp_dir().join("manga_flow_test_scan");
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();

        fs::File::create(dir.join("page2.jpg")).unwrap();
        fs::File::create(dir.join("page1.png")).unwrap();
        fs::File::create(dir.join("readme.txt")).unwrap();
        fs::File::create(dir.join("page10.jpg")).unwrap();

        let images = scan_folder_for_images(&dir).unwrap();
        let names: Vec<String> = images
            .iter()
            .map(|p| p.file_name().unwrap().to_string_lossy().to_string())
            .collect();
        assert_eq!(names, vec!["page1.png", "page2.jpg", "page10.jpg"]);

        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn test_scan_folder_chapters_multi() {
        let dir = std::env::temp_dir().join("manga_flow_test_chapters");
        let _ = fs::remove_dir_all(&dir);
        let ch1 = dir.join("ch01");
        let ch2 = dir.join("ch02");
        fs::create_dir_all(&ch1).unwrap();
        fs::create_dir_all(&ch2).unwrap();
        fs::File::create(ch1.join("001.jpg")).unwrap();
        fs::File::create(ch1.join("002.jpg")).unwrap();
        fs::File::create(ch2.join("001.jpg")).unwrap();

        let chapters = scan_folder_chapters(&dir).unwrap();
        assert_eq!(chapters.len(), 2);
        assert_eq!(chapters[0].title, "ch01");
        assert_eq!(chapters[0].image_paths.len(), 2);
        assert_eq!(chapters[1].title, "ch02");
        assert_eq!(chapters[1].image_paths.len(), 1);

        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn test_scan_folder_chapters_single() {
        let dir = std::env::temp_dir().join("manga_flow_test_flat");
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        fs::File::create(dir.join("001.jpg")).unwrap();
        fs::File::create(dir.join("002.jpg")).unwrap();

        let chapters = scan_folder_chapters(&dir).unwrap();
        assert_eq!(chapters.len(), 1);
        assert_eq!(chapters[0].title, "默认章节");
        assert_eq!(chapters[0].image_paths.len(), 2);

        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn test_scan_zip_chapters_single() {
        let dir = std::env::temp_dir().join("manga_flow_test_zip_single");
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();

        let zip_path = dir.join("test.zip");
        let dummy_png = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
        create_test_zip(&zip_path, &[
            ("page2.jpg", &dummy_png),
            ("page1.png", &dummy_png),
            ("readme.txt", b"not an image"),
            ("page10.jpg", &dummy_png),
        ]);

        let chapters = scan_zip_chapters(&zip_path).unwrap();
        assert_eq!(chapters.len(), 1);
        assert_eq!(chapters[0].title, "默认章节");
        assert_eq!(chapters[0].image_names.len(), 3);
        // Verify natural sort order
        assert_eq!(chapters[0].image_names[0], "page1.png");
        assert_eq!(chapters[0].image_names[1], "page2.jpg");
        assert_eq!(chapters[0].image_names[2], "page10.jpg");

        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn test_scan_zip_chapters_multi() {
        let dir = std::env::temp_dir().join("manga_flow_test_zip_multi");
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();

        let zip_path = dir.join("multi.zip");
        let dummy_png = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
        create_test_zip(&zip_path, &[
            ("ch02/001.jpg", &dummy_png),
            ("ch01/001.jpg", &dummy_png),
            ("ch01/002.jpg", &dummy_png),
        ]);

        let chapters = scan_zip_chapters(&zip_path).unwrap();
        assert_eq!(chapters.len(), 2);
        // Directories should be naturally sorted
        assert_eq!(chapters[0].title, "ch01");
        assert_eq!(chapters[0].image_names.len(), 2);
        assert_eq!(chapters[1].title, "ch02");
        assert_eq!(chapters[1].image_names.len(), 1);

        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn test_scan_zip_chapters_corrupted() {
        let dir = std::env::temp_dir().join("manga_flow_test_zip_corrupt");
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();

        let zip_path = dir.join("broken.zip");
        fs::write(&zip_path, b"this is not a valid zip file").unwrap();

        let result = scan_zip_chapters(&zip_path);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("该文件无法解压，可能已损坏"));

        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn test_detect_source_type_zip() {
        assert_eq!(detect_source_type(Path::new("manga.zip")), Some("zip"));
    }

    #[test]
    fn test_detect_source_type_cbz() {
        assert_eq!(detect_source_type(Path::new("manga.cbz")), Some("cbz"));
    }

    #[test]
    fn test_detect_source_type_folder() {
        let dir = std::env::temp_dir().join("manga_flow_test_detect_folder");
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        assert_eq!(detect_source_type(&dir), Some("folder"));
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn test_detect_source_type_unknown_file() {
        assert_eq!(detect_source_type(Path::new("manga.rar")), None);
    }

    #[test]
    fn test_detect_source_type_epub() {
        assert_eq!(detect_source_type(Path::new("manga.epub")), Some("epub"));
        assert_eq!(detect_source_type(Path::new("manga.EPUB")), Some("epub"));
    }

    #[test]
    fn test_find_first_image() {
        let dir = std::env::temp_dir().join("manga_flow_test_find_first");
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        let dummy_png = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
        for name in &["002.jpg", "010.jpg", "001.jpg"] {
            let mut f = fs::File::create(dir.join(name)).unwrap();
            f.write_all(&dummy_png).unwrap();
        }
        fs::File::create(dir.join("readme.txt")).unwrap();

        let result = find_first_image(&dir);
        assert!(result.is_ok());
        let name = result.unwrap().file_name().unwrap().to_string_lossy().to_string();
        assert_eq!(name, "001.jpg");

        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn test_find_first_image_empty_dir() {
        let dir = std::env::temp_dir().join("manga_flow_test_find_first_empty");
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        let result = find_first_image(&dir);
        assert!(result.is_err());
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn test_scan_epub_chapters_single() {
        let dir = std::env::temp_dir().join("manga_flow_test_epub_single");
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();

        let epub_path = dir.join("test.epub");
        create_test_epub(&epub_path, &[
            ("page1.xhtml", "page1.jpg"),
            ("page2.xhtml", "page2.png"),
        ]);

        let chapters = scan_epub_chapters(&epub_path).unwrap();
        assert_eq!(chapters.len(), 1);
        assert_eq!(chapters[0].title, "默认章节");
        assert_eq!(chapters[0].image_names.len(), 2);
        assert!(chapters[0].image_names[0].contains("page1.jpg"));
        assert!(chapters[0].image_names[1].contains("page2.png"));

        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn test_scan_epub_chapters_with_toc() {
        let dir = std::env::temp_dir().join("manga_flow_test_epub_toc");
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();

        let epub_path = dir.join("test_toc.epub");
        create_test_epub_with_toc(&epub_path, &[
            ("第一章", 2),  // 2 pages
            ("第二章", 1),  // 1 page
        ]);

        let chapters = scan_epub_chapters(&epub_path).unwrap();
        assert_eq!(chapters.len(), 2);
        assert_eq!(chapters[0].title, "第一章");
        assert_eq!(chapters[0].image_names.len(), 2);
        assert_eq!(chapters[1].title, "第二章");
        assert_eq!(chapters[1].image_names.len(), 1);

        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn test_scan_epub_chapters_corrupted() {
        let dir = std::env::temp_dir().join("manga_flow_test_epub_corrupt");
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();

        let epub_path = dir.join("broken.epub");
        fs::write(&epub_path, b"this is not a valid epub file").unwrap();

        let result = scan_epub_chapters(&epub_path);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("该文件无法解析，可能已损坏"));

        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn test_parse_img_sources() {
        let xhtml = r#"<html><body><img src="image1.jpg"/><p>text</p><img src="image2.png" alt="test"/></body></html>"#;
        let sources = parse_img_sources(xhtml);
        assert_eq!(sources, vec!["image1.jpg", "image2.png"]);
    }
}
