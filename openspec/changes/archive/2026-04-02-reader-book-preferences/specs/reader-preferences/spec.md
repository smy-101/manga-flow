## MODIFIED Requirements

### Requirement: 默认阅读模式配置
系统 SHALL 在设置页面提供阅读偏好区块，允许用户选择默认阅读模式（单页 / 连续滚动）。该偏好通过 `settingsStore` 持久化到 localStorage。

#### Scenario: 设置页面显示阅读偏好区块
- **WHEN** 用户进入设置页面
- **THEN** 页面显示「阅读设置」区块，包含「默认阅读模式」选项，提供「单页模式」和「连续滚动」两个可选项

#### Scenario: 选择默认阅读模式为连续滚动
- **WHEN** 用户在设置页面将默认阅读模式从「单页模式」切换为「连续滚动」
- **THEN** 系统将 `settingsStore.defaultReadingMode` 更新为 `"continuous"`，并持久化到 localStorage

#### Scenario: 选择默认阅读模式为单页模式
- **WHEN** 用户在设置页面将默认阅读模式设为「单页模式」
- **THEN** 系统将 `settingsStore.defaultReadingMode` 更新为 `"single"`，并持久化到 localStorage

#### Scenario: 首次使用时默认阅读模式为单页
- **WHEN** 用户首次使用应用，尚未配置任何阅读偏好
- **THEN** `settingsStore.defaultReadingMode` 的默认值为 `"single"`

### Requirement: 阅读器使用默认阅读模式初始化
系统 SHALL 在打开书籍时，按以下优先级确定阅读模式：`book_preferences` 表中该书配置 → `settingsStore.defaultReadingMode` → 硬编码默认值 `"single"`。

#### Scenario: 有按书配置时使用按书配置
- **WHEN** 用户打开一本书，且 `book_preferences` 表中该书记录了 `reading_mode = "continuous"`
- **THEN** 阅读器以连续滚动模式启动

#### Scenario: 无按书配置时使用全局默认
- **WHEN** 用户打开一本书，`book_preferences` 表中该书无记录，且 `settingsStore.defaultReadingMode` 为 `"continuous"`
- **THEN** 阅读器以连续滚动模式启动

#### Scenario: 用户在阅读器中切换模式写入按书配置
- **WHEN** 用户在阅读器中通过设置面板切换了阅读模式
- **THEN** 新模式写入 `book_preferences` 表（upsert），`settingsStore.defaultReadingMode` 不受影响

### Requirement: 沉浸模式自动隐藏
系统 SHALL 在阅读器中实现沉浸模式：工具栏和页码滑条在无鼠标操作 3 秒后自动隐藏，鼠标移至屏幕顶部或底部 40px 区域时重新浮现。设置面板打开时，沉浸模式计时暂停。

#### Scenario: 无操作 3 秒后 UI 自动隐藏
- **WHEN** 用户在阅读器中 3 秒内未移动鼠标
- **THEN** 顶部工具栏和底部页码滑条自动隐藏（通过 opacity 和 transform 过渡动画）

#### Scenario: 鼠标移至顶部区域时工具栏浮现
- **WHEN** 沉浸模式下，用户将鼠标移至屏幕顶部 40px 区域内
- **THEN** 顶部工具栏以过渡动画浮现

#### Scenario: 鼠标移至底部区域时页码滑条浮现
- **WHEN** 沉浸模式下，用户将鼠标移至屏幕底部 40px 区域内
- **THEN** 底部页码滑条以过渡动画浮现

#### Scenario: UI 浮现后重新开始自动隐藏计时
- **WHEN** 工具栏或页码滑条因鼠标移入而浮现
- **THEN** 系统重新开始 3 秒计时，计时结束后再次隐藏

#### Scenario: 鼠标在 UI 区域上操作时不触发隐藏
- **WHEN** 用户正在操作工具栏（如点击返回按钮）或页码滑条（如拖动滑条）
- **THEN** UI 保持可见，不触发自动隐藏

#### Scenario: 设置面板打开时不触发 UI 隐藏
- **WHEN** 用户在阅读器中打开了设置面板
- **THEN** 工具栏保持可见，不触发自动隐藏计时

## ADDED Requirements

### Requirement: 默认阅读方向配置
系统 SHALL 在设置页面提供默认阅读方向选项（从左到右 / 从右到左），通过 `settingsStore` 持久化到 localStorage。默认值为 `"ltr"`。

#### Scenario: 设置页面显示阅读方向选项
- **WHEN** 用户进入设置页面
- **THEN** 页面显示「默认阅读方向」选项，提供「从左到右」和「从右到左」两个可选项

#### Scenario: 选择默认阅读方向为从右到左
- **WHEN** 用户在设置页面将默认阅读方向设为「从右到左」
- **THEN** 系统将 `settingsStore.defaultReadingDirection` 更新为 `"rtl"`，并持久化到 localStorage

#### Scenario: 首次使用时默认阅读方向为从左到右
- **WHEN** 用户首次使用应用，尚未配置任何阅读偏好
- **THEN** `settingsStore.defaultReadingDirection` 的默认值为 `"ltr"`

### Requirement: 按书阅读偏好存储
系统 SHALL 提供 `book_preferences` 数据库表，存储每本书独立的阅读偏好（阅读模式、阅读方向），与 `books` 表通过外键关联（CASCADE DELETE）。

#### Scenario: 保存按书阅读偏好
- **WHEN** 用户在阅读器中对某本书修改了阅读模式或阅读方向
- **THEN** 系统将新偏好值 upsert 到 `book_preferences` 表中该书的记录

#### Scenario: 读取按书阅读偏好
- **WHEN** 用户打开一本书，系统查询 `book_preferences` 表
- **THEN** 系统返回该书的阅读偏好记录（如有），包含 `reading_mode` 和 `reading_direction`

#### Scenario: 删除书籍时清理偏好
- **WHEN** 一本书从 `books` 表中被删除
- **THEN** `book_preferences` 表中该书的偏好记录通过外键级联自动删除

#### Scenario: 按书偏好字段可为空
- **WHEN** `book_preferences` 表中某条记录的 `reading_mode` 或 `reading_direction` 为 NULL
- **THEN** 系统回退使用 `settingsStore` 中对应的全局默认值

### Requirement: 阅读器使用默认阅读方向初始化
系统 SHALL 在打开书籍时，按以下优先级确定阅读方向：`book_preferences` 表中该书配置 → `settingsStore.defaultReadingDirection` → 硬编码默认值 `"ltr"`。

#### Scenario: 有按书配置时使用按书配置的方向
- **WHEN** 用户打开一本书，且 `book_preferences` 表中该书记录了 `reading_direction = "rtl"`
- **THEN** 阅读器以 RTL 阅读方向启动

#### Scenario: 无按书配置时使用全局默认方向
- **WHEN** 用户打开一本书，`book_preferences` 表中该书无记录，且 `settingsStore.defaultReadingDirection` 为 `"rtl"`
- **THEN** 阅读器以 RTL 阅读方向启动

#### Scenario: 用户在阅读器中切换方向写入按书配置
- **WHEN** 用户在阅读器中通过设置面板切换了阅读方向
- **THEN** 新方向写入 `book_preferences` 表（upsert），`settingsStore.defaultReadingDirection` 不受影响

### Requirement: 阅读器设置面板
系统 SHALL 在阅读器工具栏提供齿轮设置按钮，点击弹出设置面板，面板内可调整阅读模式和阅读方向。设置面板中的修改即时生效并自动持久化。

#### Scenario: 阅读器设置面板内容
- **WHEN** 用户打开阅读器设置面板
- **THEN** 面板显示两组设置：「阅读模式」（单页模式/连续滚动）和「阅读方向」（从左到右/从右到左），当前值标记为选中状态

#### Scenario: 面板中选择阅读方向
- **WHEN** 用户在设置面板中点击非当前阅读方向的选项
- **THEN** 系统立即切换阅读方向，更新阅读器翻页行为，将新方向写入 `book_preferences`
