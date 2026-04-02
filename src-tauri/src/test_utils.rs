use std::fs;
use std::io::Write;
use std::path::Path;

pub fn create_test_zip(zip_path: &Path, files: &[(&str, &[u8])]) {
    let file = fs::File::create(zip_path).unwrap();
    let mut zip = zip::ZipWriter::new(file);
    let options = zip::write::SimpleFileOptions::default();
    for (name, data) in files {
        zip.start_file(name, options).unwrap();
        zip.write_all(data).unwrap();
    }
    zip.finish().unwrap();
}

/// Create a minimal epub (ZIP with epub structure).
/// pages: [(xhtml_filename, img_src_path), ...]
pub fn create_test_epub(epub_path: &Path, pages: &[(&str, &str)]) {
    let file = fs::File::create(epub_path).unwrap();
    let mut zip = zip::ZipWriter::new(file);
    let options = zip::write::SimpleFileOptions::default();

    // mimetype must be first, uncompressed
    zip.start_file("mimetype", options.clone().compression_method(zip::CompressionMethod::Stored)).unwrap();
    zip.write_all(b"application/epub+zip").unwrap();

    // container.xml
    zip.start_file("META-INF/container.xml", options.clone()).unwrap();
    zip.write_all(br#"<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>"#).unwrap();

    // Build manifest and spine
    let mut manifest = String::new();
    let mut spine_items = String::new();
    for (i, (xhtml_name, img_path)) in pages.iter().enumerate() {
        let img_id = format!("img{}", i);
        let xhtml_id = format!("page{}", i);
        let img_ext = Path::new(img_path).extension().and_then(|e| e.to_str()).unwrap_or("jpg");
        let mime = match img_ext {
            "png" => "image/png",
            "gif" => "image/gif",
            "webp" => "image/webp",
            _ => "image/jpeg",
        };
        manifest.push_str(&format!(
            r#"    <item id="{}" href="Text/{}" media-type="application/xhtml+xml"/>\n"#,
            xhtml_id, xhtml_name
        ));
        manifest.push_str(&format!(
            r#"    <item id="{}" href="Images/{}" media-type="{}"/>\n"#,
            img_id, img_path, mime
        ));
        spine_items.push_str(&format!(r#"    <itemref idref="{}"/>\n"#, xhtml_id));
    }

    // content.opf
    let opf = format!(r#"<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="uid" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="uid">test-epub</dc:identifier>
    <dc:title>Test Manga</dc:title>
    <meta property="rendition:layout">pre-paginated</meta>
  </metadata>
  <manifest>
{}
  </manifest>
  <spine>
{}
  </spine>
</package>"#, manifest, spine_items);
    zip.start_file("OEBPS/content.opf", options.clone()).unwrap();
    zip.write_all(opf.as_bytes()).unwrap();

    // Dummy image data
    let dummy_png = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];

    // XHTML pages and images
    for (i, (xhtml_name, img_path)) in pages.iter().enumerate() {
        let xhtml = format!(r#"<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>Page {}</title></head>
<body><img src="../Images/{}" alt="page"/></body>
</html>"#, i, img_path);
        zip.start_file(&format!("OEBPS/Text/{}", xhtml_name), options.clone()).unwrap();
        zip.write_all(xhtml.as_bytes()).unwrap();

        zip.start_file(&format!("OEBPS/Images/{}", img_path), options.clone()).unwrap();
        zip.write_all(&dummy_png).unwrap();
    }

    zip.finish().unwrap();
}

/// Create a test epub with NCX TOC for multi-chapter testing.
/// chapters: &[(title, page_count)]
pub fn create_test_epub_with_toc(epub_path: &Path, chapters: &[(&str, usize)]) {
    let file = fs::File::create(epub_path).unwrap();
    let mut zip = zip::ZipWriter::new(file);
    let options = zip::write::SimpleFileOptions::default();

    // mimetype
    zip.start_file("mimetype", options.clone().compression_method(zip::CompressionMethod::Stored)).unwrap();
    zip.write_all(b"application/epub+zip").unwrap();

    // container.xml
    zip.start_file("META-INF/container.xml", options.clone()).unwrap();
    zip.write_all(br#"<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>"#).unwrap();

    // Build all pages
    let mut all_pages: Vec<(String, String)> = Vec::new();
    let mut page_idx = 1;
    for &(_, count) in chapters {
        for _ in 0..count {
            all_pages.push((format!("page{}.xhtml", page_idx), format!("page{}.jpg", page_idx)));
            page_idx += 1;
        }
    }

    // Build manifest, spine
    let mut manifest = String::from(r#"    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>\n"#);
    let mut spine_items = String::new();
    for (i, (xhtml_name, img_name)) in all_pages.iter().enumerate() {
        let xhtml_id = format!("page{}", i);
        let img_id = format!("img{}", i);
        manifest.push_str(&format!(
            r#"    <item id="{}" href="Text/{}" media-type="application/xhtml+xml"/>\n"#,
            xhtml_id, xhtml_name
        ));
        manifest.push_str(&format!(
            r#"    <item id="{}" href="Images/{}" media-type="image/jpeg"/>\n"#,
            img_id, img_name
        ));
        spine_items.push_str(&format!(r#"    <itemref idref="{}"/>\n"#, xhtml_id));
    }

    // Build NCX navPoints
    let mut ncx_navpoints = String::new();
    let mut page_offset = 0;
    for (ch_idx, (ch_title, count)) in chapters.iter().enumerate() {
        let first_page = &all_pages[page_offset];
        ncx_navpoints.push_str(&format!(
            r#"    <navPoint id="navpoint-{}" playOrder="{}">
      <navLabel><text>{}</text></navLabel>
      <content src="Text/{}"/>
    </navPoint>\n"#,
            ch_idx + 1, page_offset + 1, ch_title, first_page.0
        ));
        page_offset += count;
    }

    // toc.ncx
    let ncx = format!(r#"<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//EN"
   "http://www.daisy.org/z3986/2005/ncx-2005-1.dtd">
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="test-epub"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>Test Manga</text></docTitle>
  <navMap>
{}
  </navMap>
</ncx>"#, ncx_navpoints);
    zip.start_file("OEBPS/toc.ncx", options.clone()).unwrap();
    zip.write_all(ncx.as_bytes()).unwrap();

    // content.opf — EPUB 2 with spine toc="ncx"
    let opf = format!(r#"<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="uid" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="uid">test-epub</dc:identifier>
    <dc:title>Test Manga</dc:title>
  </metadata>
  <manifest>
{}
  </manifest>
  <spine toc="ncx">
{}
  </spine>
</package>"#, manifest, spine_items);
    zip.start_file("OEBPS/content.opf", options.clone()).unwrap();
    zip.write_all(opf.as_bytes()).unwrap();

    // XHTML pages and images
    let dummy_png = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
    for (i, (xhtml_name, img_name)) in all_pages.iter().enumerate() {
        let xhtml = format!(r#"<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>Page {}</title></head>
<body><img src="../Images/{}" alt="page"/></body>
</html>"#, i, img_name);
        zip.start_file(&format!("OEBPS/Text/{}", xhtml_name), options.clone()).unwrap();
        zip.write_all(xhtml.as_bytes()).unwrap();

        zip.start_file(&format!("OEBPS/Images/{}", img_name), options.clone()).unwrap();
        zip.write_all(&dummy_png).unwrap();
    }

    zip.finish().unwrap();
}
