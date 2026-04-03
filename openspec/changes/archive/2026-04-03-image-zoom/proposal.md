## Why

阅读器当前只能通过 FitMode 切换静态适配策略（适配宽度/高度/最佳适配/原始大小），用户无法自由放大查看漫画分镜细节或对话框文字。缩放是漫画阅读器的核心交互之一，缺少它严重影响阅读体验。

## What Changes

- 新增图片缩放能力，叠加在现有 FitMode 之上（方案 B）
- 支持 Ctrl + 滚轮连续缩放（步进 25%）、Ctrl + +/- 步进缩放、Ctrl + 0 重置
- 支持双击快速切换 2x 放大 / 恢复原大小
- 放大后支持拖拽平移查看图片不同区域
- ReaderToolbar 新增 Chrome 风格缩放控件：`[-] 125% [+]`，点击百分比可重置
- 缩放范围 25% ~ 500%
- 缩放状态为会话临时状态，不持久化
- 单页模式、双页展开模式、连续滚动模式均支持缩放

## Capabilities

### New Capabilities
- `image-zoom`: 图片缩放交互 — 滚轮/键盘/双击/拖拽平移/工具栏控件

### Modified Capabilities
- `reader`: Reader 页面需集成缩放状态管理与键盘/手势事件处理
- `reader-preferences`: 无变更（缩放不持久化，不涉及偏好）

## Impact

- **组件变更**: SinglePageViewer、DoublePageViewer、ContinuousScrollViewer 需支持缩放变换
- **组件新增**: ReaderToolbar 新增缩放控件（`[-] 比例 [+]`）
- **Store 变更**: readerStore 新增 zoomLevel 状态及相关 action
- **CSS 变更**: 三个 Viewer 的样式需支持缩放后的溢出滚动与拖拽平移
- **连续滚动**: 需调整虚拟滚动逻辑以适配缩放后的占位高度和 IntersectionObserver

## 非目标

- 缩放状态不持久化到数据库或 localStorage
- 不支持触控板捏合缩放手势（v1 仅桌面端键盘/鼠标交互）
- 不支持双页模式下两张图独立缩放（整体缩放）
- 不做缩放动画过渡效果

## 测试策略

- readerStore 新增 zoomLevel 相关 action 的单元测试
- 缩放工具栏组件测试（交互行为、边界值）
- 不写页面级 Reader 测试（遵循项目测试策略）
