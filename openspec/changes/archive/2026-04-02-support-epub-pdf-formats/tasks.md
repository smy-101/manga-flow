## 1. 依赖配置

- [x] 1.1 在 `Cargo.toml` 中添加 `epub` 依赖
  - 红灯：确认现有 `cargo check` 通过
  - 绿灯：添加依赖，运行 `cargo check` 确认编译通过
  - 重构：确认依赖版本和 feature flags 合理

## 2. epub 扫描逻辑

- [x] 2.1 在 `scanner.rs` 中实现 `scan_epub_chapters` 函数
  - 红灯：编写测试验证 epub spine 解析和图片提取顺序（使用测试用 epub 文件或 mock）
  - 绿灯：使用 `epub` crate 打开文件，遍历 spine 条目，提取每页图片路径，按 TOC 划分章节
  - 重构：提取通用辅助函数

- [x] 2.2 在 `scanner.rs` 的 `detect_source_type` 中添加 epub 类型识别
  - 红灯：编写测试验证 `.epub` 扩展名返回 `"epub"`
  - 绿灯：在 match 分支中添加 `Some(ext) if ext == "epub" => Some("epub")`
  - 重构：无

## 3. epub 导入命令

- [x] 3.1 在 `commands.rs` 中实现 `import_from_epub` 函数
  - 红灯：编写测试验证 epub 导入流程（解析、提取图片、写入 pages 目录、生成 meta.json）
  - 绿灯：调用 `scan_epub_chapters` 获取章节和图片列表，从 epub ZIP 中提取图片文件，按顺序写入 pages/ 目录并重命名，报告进度
  - 重构：与 `import_from_zip` 提取共有逻辑为辅助函数

- [x] 3.2 在 `perform_import` 中添加 epub 分支分发
  - 红灯：确认 `detect_source_type("epub")` 返回正确值
  - 绿灯：在 `perform_import` 的 source type match 中添加 `"epub" => import_from_epub(...)` 分支
  - 重构：无

## 4. 前端适配

- [x] 4.1 在 `Library.tsx` 文件选择器中添加 epub 格式支持
  - 红灯：无（前端页面级不写测试）
  - 绿灯：修改 `handleImportFile` 中的 filters，扩展名为 `["zip", "cbz", "epub"]`，根据扩展名传递正确的 source type
  - 重构：无
