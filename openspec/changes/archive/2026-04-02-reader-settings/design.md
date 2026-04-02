## Context

当前阅读器的阅读模式（单页/连续滚动）硬编码为 `"single"`，每次打开书都重置。工具栏和页码滑条始终可见，占用屏幕空间。用户无法在设置中预配置阅读偏好。

技术现状：
- `settingsStore` 使用 Zustand + `persist` 中间件持久化到 localStorage，目前仅存储 `libraryPath`
- `readerStore` 为非持久化 Zustand store，`readingMode` 硬编码默认值 `"single"`
- `ReaderToolbar` 和 `PageSlider` 为固定定位的 UI 组件，无显隐逻辑

## Goals / Non-Goals

**Goals:**
- 用户可在设置页面预配置默认阅读模式，阅读器打开时自动使用该模式
- 阅读器工具栏和页码滑条在无操作时自动隐藏，鼠标移至屏幕顶/底边时浮现
- 最小化代码改动，复用现有 Zustand persist 机制

**Non-Goals:**
- 每本书独立的阅读模式记忆
- 系统级全屏 API 调用
- 阅读方向（RTL/LTR）配置
- 双页展开模式
- 图片缩放/亮度调节

## Decisions

### Decision 1: 偏好存储位置——settingsStore 扩展字段

**选择**: 在现有 `settingsStore` 中新增 `defaultReadingMode` 字段

**替代方案**:
- 独立 `readerPreferencesStore`：增加一个 store 的维护成本，且偏好数量有限（目前仅一个字段），不值得单独拆分
- 存入 SQLite：偏好是客户端状态，无需跨设备同步，localStorage 足够

**理由**: `settingsStore` 已有 persist 机制，直接扩展最简单。未来如需更多阅读偏好（如阅读方向），自然扩展即可。

### Decision 2: 沉浸模式实现——CSS transition + 状态驱动

**选择**: Reader 组件维护 `showUI` 布尔状态，通过 CSS `opacity` + `transform` transition 控制工具栏/滑条的显隐

**替代方案**:
- 纯 CSS `:hover`：无法精确控制触发区域（顶/底边窄条），且移动端不可靠
- Tauri 系统级全屏：体验过重，Esc 冲突

**理由**: 状态驱动方式灵活可控，可以精确设定「鼠标进入顶部/底部 40px 区域」作为触发条件，且易于后续扩展（如点击区域、超时逻辑）。

### Decision 3: 沉浸模式触发机制

**选择**: Reader 容器监听 `onMouseMove`，判断鼠标 Y 坐标是否在顶部/底部阈值内（40px），设置 `showUI`。同时设置 3 秒无操作自动隐藏的定时器。

**理由**: 鼠标位置判断简单直观，3 秒超时是常见的自动隐藏间隔，用户有足够时间操作 UI。

### Decision 4: 前后端职责划分

**选择**: 纯前端实现，不涉及 Rust 后端。偏好存 localStorage（通过 Zustand persist），沉浸模式纯 CSS + React 状态。

**理由**: 两个功能都是 UI 层面的偏好和交互，无需后端参与。

## Risks / Trade-offs

- **[风险] 沉浸模式下用户找不到 UI** → 首次进入阅读器时可显示简短提示（本次不实现，作为后续优化点）
- **[权衡] 全局默认 vs 每书记忆** → 当前选择全局默认，降低复杂度。如果未来用户反馈需要每书记忆，可扩展为 `per-book` 偏好存储
- **[权衡] 3 秒自动隐藏间隔** → 硬编码常量，如果用户反馈太快/太慢，可后续加入设置项
