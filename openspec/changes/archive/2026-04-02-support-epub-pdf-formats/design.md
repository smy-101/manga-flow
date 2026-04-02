## Context

manga-flow 当前导入链路支持三种源格式：文件夹、zip、cbz。导入流程统一归一化为 `library_dir/books/{uuid}/pages/` 目录下的图片文件，阅读器通过 Tauri asset:// 协议加载 `<img>` 渲染。

epub 是漫画收藏中常见的格式，需要扩展导入链路支持该格式。处理逻辑最终归一化为相同的图片存储结构，阅读器无需改动。

## Goals / Non-Goals

**Goals:**
- 支持导入固定布局漫画 epub（每页一图），按 spine 阅读顺序提取图片
- 导入后的存储结构、元数据格式、阅读体验与现有格式完全一致
- 复用现有的章节检测、封面提取、进度通知机制

**Non-Goals:**
- 不支持流式排版 epub（文字+图片混合排版）
- 不支持 mobi 格式
- 不支持 PDF 格式（pdfium-render 跨平台兼容性问题，后续单独评估）
- 不修改阅读器组件
- 不在导入时做 OCR 或文字提取

## Decisions

### Decision 1: 导入时提取图片（复用现有阅读器）

**选择**：导入时将 epub 内容提取为图片，存入现有 pages/ 目录结构。

**替代方案**：按需从原文件读取页面（阅读时实时解压）。

**理由**：与现有 zip/cbz/文件夹的导入模式一致，阅读器零改动，前端代码无感知。缺点是多占磁盘空间，但漫画场景下可接受。

### Decision 2: epub 解析使用 epub crate

**选择**：使用 `epub` v2.1.5 crate 解析 epub 结构。

**替代方案**：自行解析 ZIP + XML。

**理由**：epub crate 成熟（122K 下载），支持 epub 2/3，API 简洁。自行解析需要处理 container.xml → content.opf → spine → manifest 的完整链条，不值得重复造轮子。

**代价**：GPL-3.0 许可证，项目需兼容。

### Decision 3: epub 章节检测策略

**选择**：解析 epub TOC（toc.ncx / nav.xhtml）作为章节划分依据。如果没有 TOC，则将所有 spine 条目归为一个"默认章节"。

**理由**：漫画 epub 的 TOC 通常对应卷/话的划分，比按 XHTML 文件分章更合理。缺少 TOC 时降级为单章节，与 zip/文件夹的降级策略一致。

## Risks / Trade-offs

- **[epub crate GPL-3.0 许可证]** → 项目必须以 GPL 兼容方式分发。当前为个人/开源项目，可接受。
- **[非固定布局 epub 识别]** → 如果用户导入了流式排版 epub，提取的"图片"可能为空或异常。需要在导入时检测并提示错误。
- **[epub 图片格式多样性]** → epub 内部图片可能是 SVG 格式，无法直接用 `<img>` 显示。需要检测并跳过或转换（本版本先跳过，后续可扩展）。
