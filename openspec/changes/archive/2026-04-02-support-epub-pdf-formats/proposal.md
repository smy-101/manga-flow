## Why

当前 manga-flow 仅支持文件夹、zip、cbz 三种导入格式。但用户收藏的漫画中有大量 epub 格式（固定布局、每页一图的漫画 epub），无法导入阅读。需要扩展导入链路以支持这种常见格式。

## What Changes

- 新增 epub 格式导入：解析 epub 容器结构（spine/manifest），按阅读顺序提取每页图片，归一化为现有 pages/ 目录结构
- 扩展 `detect_source_type` 支持识别 epub 文件类型
- 前端文件选择器新增 epub 格式过滤器
- 新增 Rust 依赖：`epub`（GPL-3.0）

## Capabilities

### New Capabilities

无。epub 导入是现有 book-import 能力的格式扩展，不引入新能力领域。

### Modified Capabilities

- `book-import`: 扩展导入链路，新增 epub 源格式的支持。导入后的存储结构（pages/ 目录）和阅读体验不变。

## Impact

- **Rust 后端**：`scanner.rs` 新增 epub 扫描逻辑，`commands.rs` 新增 `import_from_epub` 处理函数
- **依赖**：Cargo.toml 新增 `epub` v2.1.5（GPL-3.0）及其子依赖
- **前端**：`Library.tsx` 文件选择过滤器新增 epub 扩展名
- **阅读器**：无改动，导入后图片通过现有 `<img>` + asset:// 协议渲染
- **许可证**：项目需兼容 GPL-3.0（`epub` crate）

## 非目标

- 不支持 mobi 格式（Rust 生态库停更且不支持图片提取，格式已被 Amazon 弃用）
- 不支持流式排版 epub（仅支持固定布局、每页一图的漫画 epub）
- 不修改阅读器组件，导入后统一归一化为图片存储
- 不支持 PDF 格式（pdfium-render 跨平台兼容性问题，后续单独评估）

## 测试策略

- Rust 单元测试：epub 解析（spine 顺序、图片提取）在 `scanner.rs` 和 `commands.rs` 的 `#[cfg(test)]` 模块中
- 前端不新增测试（页面级测试策略不变，不 mock Tauri API）
