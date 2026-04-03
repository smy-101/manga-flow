## Why

漫画阅读器目前只有单页和连续滚动两种模式。对于日漫而言，跨页大图（見開き）是叙事的重要部分——分镜、构图、情感冲击力都依赖两页并排呈现。缺少双页展开模式让 manga-flow 读起来更像"图片查看器"而非专业漫画阅读器。

## What Changes

- 新增**双页展开阅读模式**（`"spread"`），作为第三种阅读模式与现有的单页、连续滚动并列
- 双页展开时，同时显示两张页面图片并排排列，模拟实体漫画的翻页体验
- 封面页（第 1 页）单独显示，从第 2-3 页开始双页展开
- RTL 模式下左右页序翻转（右页在先、左页在后）
- 总页数为奇数时，最后一页单独显示
- 阅读器设置面板增加「双页展开」选项
- 设置页面和按书偏好支持双页展开作为默认模式
- 页码滑条和预加载逻辑适配双页模式下的索引计算

## Capabilities

### New Capabilities
- `double-page-spread`: 双页展开阅读模式——同时展示两张漫画页面，支持封面独立展示、RTL 页序翻转、奇偶页自适应

### Modified Capabilities
- `reader`: 阅读模式从二选一扩展为三选一（单页/连续滚动/双页展开），设置面板新增双页选项
- `reader-preferences`: 默认阅读模式和按书偏好支持 `"spread"` 值

## Impact

- **新增组件**: `DoublePageViewer` — 双页展开视图组件
- **修改组件**: `ReaderToolbar` / `ReaderSettingsPanel` — 设置面板增加双页选项
- **修改 Store**: `readerStore` 的 `ReadingMode` 类型扩展为 `"single" | "continuous" | "spread"`
- **修改 Store**: `settingsStore` 的 `defaultReadingMode` 支持新值
- **修改页面**: `Reader.tsx` — 条件渲染新增 `DoublePageViewer`
- **修改规格**: `reader/spec.md` 和 `reader-preferences/spec.md` 需补充双页展开相关场景
- **无后端改动**: 纯前端变更，不涉及 Rust 代码或数据库 schema

## 非目标

- 不做智能跨页检测（自动识别哪些页面是跨页大图并单独展示）—— 未来可作为增强
- 不做可调节的双页间距或边框样式
- 不做竖屏设备的自动回退单页模式（当前仅支持桌面）

## 测试策略

- `readerStore` 单元测试：验证 `ReadingMode` 类型扩展、双页索引计算逻辑
- `DoublePageViewer` 组件测试：验证封面独立展示、RTL 页序、奇数页处理
- 设置面板组件测试：验证三选一切换行为
- 不写 Reader 页面级测试（遵循项目测试策略）
