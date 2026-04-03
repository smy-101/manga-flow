## Context

当前阅读器的图片显示方式固定为 `object-fit: contain`，即图片完整缩放到视口内（最佳适配）。这在大多数场景下可用，但无法满足：
- 扫描版漫画的高分辨率大图，在宽屏显示器上两侧有大面积留白
- 想以原始分辨率查看画面细节
- 不同画幅比例的漫画需要不同的适配策略

当前涉及图片显示的组件：
- `SinglePageViewer`：`width:100%; height:100%; object-fit:contain`
- `DoublePageViewer`：`max-width:50%; height:100%; object-fit:contain`
- `ContinuousScrollViewer`：宽度填满（不受影响）

偏好体系已建立：`settingsStore`（全局默认）→ `bookPreferencesRepo`（按书覆盖）→ `resolvePreferences`（解析）。

## Goals / Non-Goals

**Goals:**
- 提供四种适配模式供用户选择
- 适配模式作为偏好持久化，与阅读模式/阅读方向共用偏好机制
- 仅影响单页和双页模式

**Non-Goals:**
- 连续滚动模式的适配模式（天然宽度填满，无需适配）
- 缩放/平移交互
- 图像滤镜（亮度/对比度）

## Decisions

### Decision 1: 四种适配模式的 CSS 策略

采用纯 CSS class 切换实现，不使用 JavaScript 计算。

| 适配模式 | 单页模式 CSS | 行为 |
|---------|-------------|------|
| best-fit | `width:100%; height:100%; object-fit:contain` | 完整显示在视口内（当前行为） |
| fit-width | `width:100%; height:auto` | 宽度填满，高度按比例 |
| fit-height | `height:100%; width:auto; max-width:100%` | 高度填满，宽度按比例 |
| original | `width:auto; height:auto` | 原始像素大小 |

双页模式类似，每张图占 50% 宽度。

**理由**: 纯 CSS 方案性能最优，无 JavaScript 布局计算，无重排抖动。

**备选方案**: 用 JS 读取图片 naturalWidth/naturalHeight 后计算缩放 → 增加复杂度，且与预加载机制冲突，不采用。

### Decision 2: fit-width/fit-height 溢出处理

fit-width 模式下图片可能高于视口，original 模式下图片可能超出视口任意方向。在图片容器（`.reader-image-area` / `.spread-image-area`）上设置 `overflow: auto`，允许用户滚动查看溢出部分。

**理由**: 不裁剪内容，用户可滚动查看完整图片。这为后续缩放/平移功能预留了扩展空间。

### Decision 3: 适配模式与阅读模式的关系

| 阅读模式 | 适配模式支持 |
|---------|------------|
| 单页模式 | 全部四种 |
| 双页展开 | 全部四种 |
| 连续滚动 | 不支持（保持宽度填满） |

连续滚动模式切换时不改变适配模式状态，但 UI 上灰显/隐藏适配模式选项。

### Decision 4: 偏好存储扩展

在现有偏好体系中增加 `fit_mode` 字段：
- `settingsStore`: 新增 `defaultFitMode`，持久化到 localStorage
- `book_preferences` 表: 新增 `fit_mode` 列（nullable TEXT）
- `resolvePreferences`: 扩展解析 `fitMode`
- `BookPreference` 类型: 新增 `fit_mode` 字段

**理由**: 完全复用现有偏好机制，不引入新的存储路径。

### Decision 5: 数据库迁移

`book_preferences` 表新增 `fit_mode TEXT DEFAULT NULL` 列。使用 `ALTER TABLE ADD COLUMN`，SQLite 向后兼容，无需数据迁移。

### Decision 6: 默认值

`defaultFitMode` 默认为 `"best-fit"`，与当前行为完全一致，升级无感知。

## Risks / Trade-offs

- **[fit-width 溢出时点击翻页冲突]** → fit-width/fit-height/original 模式下，图片容器可滚动。点击翻页仍然绑定在容器上，只在未溢出或点击非滚动条区域时触发。不引入复杂的"是否溢出"判断，保持现有点击逻辑。
- **[双页模式下 fit-width 行为]** → 双页模式下每张图占 50% 宽度，fit-width 效果可能不如单页模式明显。这是可接受的限制，用户可在需要时切回单页模式。
- **[original 模式在小图上的体验]** → 原始大小模式下，低分辨率图片会显示很小。这是预期行为，用户应选择其他适配模式。
