## Context

当前阅读器架构：

```
Reader.tsx (页面)
├── useReaderStore        ← 阅读状态（当前页、模式、页面列表）
├── useSettingsStore      ← 全局设置（仅 defaultReadingMode，localStorage）
├── useImmersiveMode      ← UI 自动隐藏
├── ReaderToolbar         ← 返回 / 页码 / 模式切换按钮
├── SinglePageViewer      ← 单页：点击翻页（左1/3← 右1/3→）+ 键盘 ←→
├── ContinuousScrollViewer← 连续滚动：虚拟渲染
└── PageSlider            ← 底部页码滑条
```

阅读偏好仅通过 `settingsStore.defaultReadingMode` 全局配置，无按书设置。翻页方向固定为 LTR。

数据层现状：`reading_progress` 表存储进度（book_id, chapter_id, page_index, is_finished），章节信息在 `chapters` 表中，但阅读器未使用章节级导航。

## Goals / Non-Goals

**Goals:**

- 建立按书偏好存储体系（独立于阅读进度）
- 实现 RTL 阅读方向，完整支持日漫阅读习惯
- 阅读器工具栏重构为齿轮设置面板，可扩展地承载更多设置项
- 偏好读取优先级链：book_preferences → settingsStore → 硬编码默认

**Non-Goals:**

- 双页展开模式（后续变更）
- 章节导航 UI（后续变更）
- 翻页动画/过渡效果
- 连续滚动模式的水平滚动方向（保持纵向）
- 按书设置的导入/导出

## Decisions

### 决策 1：独立 book_preferences 表 vs 扩展 reading_progress

**选择**：独立 `book_preferences` 表

**理由**：阅读偏好与阅读进度是不同关注点。偏好可能包含更多未来设置（适配方式、双页模式等），独立表更容易扩展而不影响进度查询。reading_progress 的 upsert 逻辑也会因此简化。

**替代方案**：在 reading_progress 表加 reading_mode/reading_direction 列。优点是不加表，缺点是语义混合、未读的书没有进度记录时偏好无处存储。

### 决策 2：偏好存储位置（SQLite vs localStorage）

**选择**：SQLite

**理由**：按书偏好需要与 book_id 关联查询，SQLite 支持外键和级联删除（书被删时偏好自动清理）。localStorage 不适合关联数据。

### 决策 3：设置面板 UI 形式

**选择**：齿轮按钮 + 弹出面板（popover）

**理由**：后续会持续增加设置项（双页模式、适配方式、亮度等），独立按钮方案不可扩展。齿轮面板可以分组展示多个设置，且不占用工具栏空间。

**交互细节**：
- 点击齿轮图标弹出面板，再次点击或点击面板外关闭
- 面板内每组设置用分组标题 + 选项列表呈现
- 选中项即时生效，不需要确认按钮

### 决策 4：连续滚动模式的 RTL 处理

**选择**：仅反转键盘方向键映射，滚动方向不变

**理由**：连续滚动是纵向体验，RTL 主要影响横向翻页逻辑。键盘 ← → 在 RTL 下语义反转（← = 下一页，→ = 上一页），但 ↑ ↓ 保持不变。鼠标滚轮方向也不变。

### 决策 5：前端状态管理策略

**选择**：Reader.tsx 在 load 阶段读取偏好，注入 readerStore

**流程**：
```
Reader.tsx load()
  ├── settingsStore.getState() → 全局默认
  ├── bookPreferencesRepo.get(bookId) → 按书覆盖
  └── readerStore 初始化（有效值 = 按书 ?? 全局 ?? 默认）
```

用户通过面板修改时，同步写入 bookPreferencesRepo 和 readerStore。

## Risks / Trade-offs

- **[新增数据库表]** → Migration 需要处理首次启动场景（表不存在时 CREATE TABLE 即可，无需数据迁移）
- **[齿轮面板交互复杂度]** → 面板需处理点击外部关闭、ESC 关闭、不影响沉浸模式计时等交互。使用简单的 ref + useEffect 监听点击外部即可，不引入额外依赖
- **[预加载方向]** → RTL 模式下「前方」页面是 index-1 而非 index+1。getPreloadRange 目前是对称的（±windowSize），RTL 不影响预加载范围，但如果未来改为非对称预加载需考虑方向
