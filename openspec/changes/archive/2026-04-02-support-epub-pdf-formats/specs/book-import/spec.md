## MODIFIED Requirements

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
