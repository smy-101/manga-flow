## Context

manga-flow 的阅读器目前支持两种模式：单页翻页（`SinglePageViewer`）和连续滚动（`ContinuousScrollViewer`）。阅读器架构为 `Reader.tsx` 容器 + 可插拔 viewer 组件模式，`readerStore` 管理会话状态，`settingsStore` 管理持久化偏好。阅读模式类型为 `"single" | "continuous"`。

双页展开模式需要新增第三个 viewer 组件，扩展现有类型系统，并与已有的偏好链（按书 → 全局 → 默认）集成。

## Goals / Non-Goals

**Goals:**
- 新增 `DoublePageViewer` 组件，实现双页并排展示
- 扩展 `ReadingMode` 为三选一：`"single" | "continuous" | "spread"`
- 封面页（第 1 页）独立展示，从第 2 页开始双页配对
- RTL 阅读方向下翻转左右页序
- 与现有偏好系统无缝集成
- 预加载逻辑适配双页模式

**Non-Goals:**
- 不做智能跨页检测（自动识别跨页大图）
- 不做竖屏自适应回退单页
- 不做双页间距/边框样式自定义
- 不修改后端 Rust 代码

## Decisions

### 1. 页面配对策略：固定配对

**选择**: 第 1 页单独展示，第 2-3 页配对，第 4-5 页配对，以此类推。

**替代方案**: 按章节起始重置配对（每章封面单独展示）—— 增加复杂度，且多章节场景下用户通常期望全书连续配对。

**理由**: 固定配对实现简单，符合大多数漫画的实际排版。全书连续配对避免章节边界处的突兀单页。

### 2. spread 模式下的索引模型

**选择**: `currentIndex` 仍指向"左页"（或单页）的 page index，翻页步进为 2（在配对区域内）。

```
页数组:  [0]   [1, 2]   [3, 4]   [5, 6]   ...
         封面   spread 1  spread 2  spread 3
index:    0      1        3        5
```

- `currentIndex` 始终为左页 index（LTR）或右页 index（RTL）
- `nextPage()`: `currentIndex += 2`（从配对区域）或 `currentIndex += 1`（从封面到第一个 spread）
- `prevPage()`: 对称逻辑
- 页码滑条显示 "spread 位置" 而非单页页码

**替代方案**: 使用 spread index（0, 1, 2...）映射到 page pair —— 额外的抽象层增加复杂度，且与现有进度持久化（page_index）不兼容。

**理由**: 复用现有 `currentIndex` 机制最小化改动，进度持久化无需变更。

### 3. 组件结构：独立 DoublePageViewer

**选择**: 创建独立的 `DoublePageViewer` 组件，与 `SinglePageViewer`、`ContinuousScrollViewer` 并列。

**理由**:
- 保持每个 viewer 职责单一
- 不修改现有 viewer 的内部逻辑
- `Reader.tsx` 只需增加一个条件分支

### 4. 图片布局：CSS Flexbox

**选择**: 使用 `display: flex; gap: 4px` 排列两张图片，每张 `max-width: 50%`，`object-fit: contain`。

**替代方案**: CSS Grid —— 功能上可行，但 flexbox 对两张图片的场景更简洁。

**理由**: 两张等宽图片的简单布局，flexbox 足够。

### 5. 点击导航区域划分

**选择**: 左右各 1/4 区域为翻页热区，中间 1/2 为安全区（用于触发 UI）。

**理由**: 双页模式下中间区域更大，需要更大的安全区避免误触翻页。与单页模式的 1/3 划分区分。

### 6. 预加载窗口

**选择**: 预加载当前 spread 前后各 2 个 spread（最多 8 张额外图片）。封面单独预加载。

**理由**: 双页模式下每次翻页跳 2 页，预加载窗口需要覆盖 4 页范围才能保证流畅。

## Risks / Trade-offs

- **[宽图截断]** 宽高比极端的页面在 50% 宽度下可能显示过小 → 使用 `object-fit: contain` 保证完整显示，接受留白
- **[进度兼容性]** 现有进度记录是单页 index，切到 spread 模式后可能落在 spread 的右页 → 加载时向下取偶到 spread 起始页
- **[模式切换]** 从 spread 切到其他模式时 currentIndex 可能需要调整 → 切换时保持当前页不变，各 viewer 自行处理
- **[单页总数]** 只有 1 页的书不应显示 spread 选项 → 设置面板根据总页数动态禁用
