## Why

用户每次打开漫画都默认进入单页模式，无法预设偏好的阅读方式。工具栏和页码滑条常驻显示，占据屏幕空间，打断沉浸阅读体验。需要在设置页面提供阅读偏好的预配置能力，并为阅读器增加沉浸模式（UI 自动隐藏）。

## What Changes

- 在 `settingsStore` 中新增 `defaultReadingMode` 持久化字段，用户可在设置页面提前选择默认阅读模式（单页 / 连续滚动）
- 阅读器打开书籍时从 `settingsStore` 读取 `defaultReadingMode` 初始化 `readerStore.readingMode`，而非硬编码 `"single"`
- 阅读器工具栏（`ReaderToolbar`）和页码滑条（`PageSlider`）在无操作时自动隐藏，鼠标移至屏幕顶部/底部区域时浮现
- 设置页面新增「阅读设置」区块，包含默认阅读模式选择控件

## Capabilities

### New Capabilities
- `reader-preferences`: 阅读偏好设置——用户可在设置页面预配置默认阅读模式（单页/连续滚动），偏好持久化至 localStorage，阅读器启动时读取初始化

### Modified Capabilities
- `reader`: 新增沉浸模式需求——工具栏和页码滑条在无操作时自动隐藏，鼠标移至屏幕顶部/底部时浮现，点击内容区域不触发 UI 显示

## Impact

- **前端 Store**: `settingsStore` 新增 `defaultReadingMode` 字段及其 setter
- **Settings 页面**: 新增「阅读设置」区块，含阅读模式选择控件
- **Reader 页面**: 初始化逻辑改为从 settings 读取默认阅读模式
- **ReaderToolbar**: 支持自动隐藏/浮现动画
- **PageSlider**: 支持自动隐藏/浮现动画
- **Reader.css**: 新增沉浸模式相关样式（过渡动画、显隐控制）
- **无 Rust 后端改动，无数据库改动，无 breaking change**

## 非目标

- 阅读方向的预配置（RTL/LTR）——留待未来独立迭代
- 双页展开模式——留待未来独立迭代
- 系统级全屏 API（`requestFullscreen`）——仅做 UI 层面的自动隐藏
- 图片缩放、亮度调节等阅读增强功能
- 每本书独立的阅读模式记忆——统一使用全局默认值

## 测试策略

- **store 单元测试**: `settingsStore` 新增 `defaultReadingMode` 的读写测试
- **组件测试**: 无（ReaderToolbar、PageSlider、Settings 属于页面级组件，不写页面级测试）
- 测试重点在 store 层面的持久化和读取逻辑
