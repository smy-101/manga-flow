## Context

当前阅读器有三个 Viewer 组件（SinglePageViewer、DoublePageViewer、ContinuousScrollViewer），每个都根据 FitMode 静态计算图片大小。用户无法在 FitMode 基础上自由放大缩小。

缩放为纯前端交互，不涉及 Rust 后端或数据库变更。所有状态通过 Zustand store 管理。

## Goals / Non-Goals

**Goals:**
- 在现有 FitMode 基础上叠加缩放，用户可通过滚轮/键盘/双击/工具栏控件自由缩放
- 放大后支持拖拽平移查看
- 三个阅读模式（单页、双页、连续滚动）均支持缩放
- 工具栏提供 Chrome 风格缩放控件（`[-] 比例 [+]`）

**Non-Goals:**
- 缩放状态持久化
- 触控板捏合缩放手势
- 双页模式下独立缩放（整体缩放即可）
- 缩放动画过渡

## Decisions

### 1. 缩放实现方式：计算尺寸 vs CSS transform

**选择：计算图片缩放尺寸（SinglePageViewer/DoublePageViewer）、宽度百分比（ContinuousScrollViewer）**

- 对 SinglePageViewer 和 DoublePageViewer，根据 FitMode 和 zoomLevel 计算图片的实际显示尺寸（baseW × zoomLevel, baseH × zoomLevel），通过 inline style 设置 width/height，配合 `overflow: auto` 实现放大后平移滚动
- 对 ContinuousScrollViewer，在每个 page div 上设置 `width: zoomLevel * 100%`，占位高度乘以 zoomLevel，图片 `height: auto` 自然跟随宽度缩放

**替代方案：CSS zoom 属性**
- 浏览器兼容性不如计算尺寸方案
- zoom 影响布局流但行为在不同浏览器间不完全一致

**替代方案：全部使用 CSS transform: scale()**
- 需要重新计算每个 Viewer 的布局逻辑，侵入性大
- transform scale 不影响布局流，导致 overflow: auto 无法检测溢出，放大后无法滚动

**替代方案：修改 img 宽高（逐张重算）**
- 需要重新计算每个 Viewer 的布局逻辑，侵入性大
- 连续滚动模式需要重算所有占位高度

**理由：** SinglePageViewer/DoublePageViewer 直接计算缩放后的图片尺寸（精确控制，overflow 滚动自然可用）；ContinuousScrollViewer 用宽度百分比（图片 height:auto 自然跟随，占位高度乘以 zoomLevel 补偿虚拟滚动）。

### 2. 拖拽平移：CSS overflow scroll + 手动 pointer 事件

**选择：CSS overflow: auto + margin: auto 居中 + 手动 pointer 事件拖拽**

- 放大后图片容器 `overflow: auto` 提供滚动条
- 手动 mousedown/mousemove/mouseup 实现 click-drag 平移（浏览器原生 overflow:auto 仅提供滚动条，不提供拖拽平移）
- 缩放时容器使用 `align-items/justify-content: flex-start` + 子元素 `margin: auto`，确保内容小于容器时居中、大于容器时从 (0,0) 开始可完整滚动

**替代方案：仅依赖 CSS overflow scroll，不手动管理 pointer**
- 更简单但缺少拖拽平移能力，用户只能通过滚动条平移，体验差

**理由：** overflow:auto 提供滚动能力，手动 pointer 事件补充拖拽平移。需要注意放大状态下禁用 click 翻页，且 mousedown 事件与 click 事件需通过拖拽阈值区分。

### 3. 缩放状态管理：readerStore 扩展

在 readerStore 中新增：
- `zoomLevel: number`（1.0 = 100%，即无缩放）
- `zoomIn()` / `zoomOut()`：步进 25%
- `resetZoom()`：重置为 1.0
- `setZoom(level: number)`：直接设置（双击用）

Store 层面钳制范围 0.25 ~ 5.0。

### 4. 连续滚动缩放适配

ContinuousScrollViewer 的虚拟滚动需要调整：
- 每个 page div 的 `width` 设为 `zoomLevel * 100%`，图片 `height: auto` 自然跟随宽度缩放
- 占位 div 的 minHeight 需乘以 zoomLevel
- IntersectionObserver 保持不变（threshold 0.1 在放大后仍能正确检测可见性）
- 滚动位置追踪无需特殊处理（中心点检测与缩放无关）

### 5. 缩放与翻页交互

- `zoomLevel > 1` 时，SinglePageViewer 和 DoublePageViewer 禁用 click 翻页
- 恢复 `zoomLevel === 1` 后重新启用
- 连续滚动模式本就没有 click 翻页，无需处理

### 6. 工具栏缩放控件

在 ReaderToolbar 右侧区域添加：
- `[-]` 按钮：zoomOut
- 百分比文字：显示当前 zoomLevel，点击重置为 1.0
- `[+]` 按钮：zoomIn
- 仅在 zoomLevel ≠ 1.0 时显示（或始终显示但未缩放时半透明）

**决定：始终显示**，保持工具栏布局稳定，未缩放时显示 `100%`。

## Risks / Trade-offs

- **[宽度百分比缩放对连续滚动的影响]** → 占位高度用缓存高度 × zoomLevel 补偿，首次加载时可能短暂不准确，但 settling 机制已覆盖此场景
- **[放大状态误触翻页]** → zoomLevel > 1 时禁用 click 翻页，用户需先缩回或用键盘/滑块导航
- **[大缩放倍率下内存]** → 图片原始分辨率不变，CSS scale 不增加内存占用；但 500% 缩放时图片可能严重模糊，这是预期行为
