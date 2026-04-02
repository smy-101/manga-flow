# Book Import

## Purpose

漫画导入功能：支持从本地文件夹、zip、cbz 和 epub 文件导入漫画到库中，自动识别章节结构，提取封面，显示导入进度，统一归一化为文件夹存储结构。

## Requirements

### Requirement: 支持文件夹格式导入
系统 SHALL 支持导入包含图片文件的本地文件夹作为一本漫画书。系统 SHALL 扫描文件夹中的图片文件（jpg、jpeg、png、webp、gif），按自然排序组织为页面序列。

#### Scenario: 导入包含有序图片的文件夹
- **WHEN** 用户选择一个包含多张图片的文件夹进行导入
- **THEN** 系统扫描文件夹中的图片，按自然排序（如 1.jpg, 2.jpg, ..., 10.jpg）生成页面列表，复制图片到库目录

#### Scenario: 导入包含子文件夹的文件夹（含章节结构）
- **WHEN** 用户选择一个包含子文件夹的文件夹，每个子文件夹包含图片
- **THEN** 系统将每个子文件夹识别为一个章节，按子文件夹名自然排序组织章节结构

#### Scenario: 导入不包含图片的文件夹
- **WHEN** 用户选择一个不包含任何图片文件的文件夹
- **THEN** 系统显示错误提示"该文件夹不包含可识别的图片文件"

### Requirement: 支持 zip 格式导入
系统 SHALL 支持导入 .zip 压缩文件作为一本漫画书。系统 SHALL 解压 zip 文件，提取其中的图片并组织为页面序列。

#### Scenario: 导入包含有序图片的 zip 文件
- **WHEN** 用户选择一个 zip 文件进行导入
- **THEN** 系统解压 zip 文件，扫描其中的图片，按自然排序生成页面列表，复制到库目录

#### Scenario: 导入包含嵌套目录的 zip 文件
- **WHEN** 用户选择一个 zip 文件，其中图片分布在子目录中
- **THEN** 系统将子目录识别为章节，按目录名自然排序组织章节结构

#### Scenario: 导入损坏的 zip 文件
- **WHEN** 用户选择一个损坏或无法解压的 zip 文件
- **THEN** 系统显示错误提示"该文件无法解压，可能已损坏"

### Requirement: 支持 cbz 格式导入
系统 SHALL 支持导入 .cbz 文件。cbz 文件本质上是 zip 格式，SHALL 使用与 zip 相同的处理逻辑。

#### Scenario: 导入 cbz 文件
- **WHEN** 用户选择一个 .cbz 文件进行导入
- **THEN** 系统将其作为 zip 文件处理，解压并组织页面结构

### Requirement: 支持 epub 格式导入
系统 SHALL 支持导入 .epub 文件作为一本漫画书。系统 SHALL 使用 epub crate 解析 epub 容器结构，按 spine 阅读顺序提取每页图片，归一化为 pages/ 目录结构存储。

#### Scenario: 导入固定布局漫画 epub
- **WHEN** 用户选择一个 .epub 文件进行导入，该文件为固定布局漫画（每页一图）
- **THEN** 系统解析 epub 的 spine/manifest 结构，按阅读顺序提取图片，复制到 `pages/` 目录并按自然排序重命名

#### Scenario: 导入含有 TOC 的 epub
- **WHEN** 用户选择一个包含目录（toc.ncx 或 nav.xhtml）的 epub 文件
- **THEN** 系统根据 TOC 结构划分章节，每个 TOC 条目对应一个章节

#### Scenario: 导入不含 TOC 的 epub
- **WHEN** 用户选择一个不包含目录结构的 epub 文件
- **THEN** 系统将所有页面归入一个"默认章节"

#### Scenario: 导入流式排版 epub
- **WHEN** 用户选择一个流式排版（非固定布局）的 epub 文件进行导入
- **THEN** 系统检测到无有效图片可提取时，显示错误提示"该 epub 文件不包含可识别的图片页面"

#### Scenario: 导入损坏的 epub 文件
- **WHEN** 用户选择一个损坏或无法解析的 epub 文件
- **THEN** 系统显示错误提示"该文件无法解析，可能已损坏"

### Requirement: 文件选择器支持 epub
系统 SHALL 在导入文件对话框中支持 epub 扩展名过滤。

#### Scenario: 文件选择器显示支持的格式
- **WHEN** 用户点击"导入文件"按钮
- **THEN** 文件选择对话框的格式过滤器显示 epub 选项

### Requirement: 导入时提取封面图片
系统 SHALL 在导入漫画时，将第一张图片的文件路径记录为封面路径，供书库和阅读器通过 `convertFileSrc` 加载显示。

#### Scenario: 成功提取封面图片路径
- **WHEN** 漫画导入成功且包含至少一张图片
- **THEN** 系统将 `pages/` 目录下第一张图片的完整路径记录为 `cover_path`，前端通过 `convertFileSrc` 加载显示

#### Scenario: 漫画不包含任何图片
- **WHEN** 漫画文件中没有可识别的图片
- **THEN** 导入失败，系统显示错误提示

### Requirement: 导入时显示进度
系统 SHALL 在导入过程中显示进度信息，特别是处理大文件时。

#### Scenario: 导入大型 zip 文件
- **WHEN** 用户导入一个大型 zip 文件（如 > 50MB）
- **THEN** 系统显示导入进度条，包含已处理文件数和总文件数

### Requirement: 导入后统一归一化为文件夹结构
系统 SHALL 将所有格式的漫画统一归一化为 `{library_dir}/books/{book_id}/pages/` 文件夹结构存储。

#### Scenario: zip 文件导入后的存储结构
- **WHEN** 一个 zip 文件导入成功
- **THEN** 文件被解压到 `{library_dir}/books/{book_id}/pages/` 目录，图片按自然排序重命名（001.jpg, 002.jpg, ...）

#### Scenario: 文件夹导入后的存储结构
- **WHEN** 一个文件夹导入成功
- **THEN** 图片被复制到 `{library_dir}/books/{book_id}/pages/` 目录，图片按自然排序重命名
