## MODIFIED Requirements

### Requirement: 默认阅读模式配置
系统 SHALL 在设置页面提供阅读偏好区块，允许用户选择默认阅读模式（单页 / 连续滚动 / 双页展开）。该偏好通过 `settingsStore` 持久化到 localStorage。

#### Scenario: 设置页面显示阅读偏好区块
- **WHEN** 用户进入设置页面
- **THEN** 页面显示「阅读设置」区块，包含「默认阅读模式」选项，提供「单页模式」、「连续滚动」和「双页展开」三个可选项

#### Scenario: 选择默认阅读模式为双页展开
- **WHEN** 用户在设置页面将默认阅读模式切换为「双页展开」
- **THEN** 系统将 `settingsStore.defaultReadingMode` 更新为 `"spread"`，并持久化到 localStorage

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
- **WHEN** 用户打开一本书，且 `book_preferences` 表中该书记录了 `reading_mode = "spread"`
- **THEN** 阅读器以双页展开模式启动

#### Scenario: 无按书配置时使用全局默认
- **WHEN** 用户打开一本书，`book_preferences` 表中该书无记录，且 `settingsStore.defaultReadingMode` 为 `"spread"`
- **THEN** 阅读器以双页展开模式启动

#### Scenario: 用户在阅读器中切换模式写入按书配置
- **WHEN** 用户在阅读器中通过设置面板切换了阅读模式
- **THEN** 新模式写入 `book_preferences` 表（upsert），`settingsStore.defaultReadingMode` 不受影响

### Requirement: 阅读器设置面板
系统 SHALL 在阅读器工具栏提供齿轮设置按钮，点击弹出设置面板，面板内可调整阅读模式和阅读方向。设置面板中的修改即时生效并自动持久化。

#### Scenario: 阅读器设置面板内容
- **WHEN** 用户打开阅读器设置面板
- **THEN** 面板显示两组设置：「阅读模式」（单页模式/连续滚动/双页展开）和「阅读方向」（从左到右/从右到左），当前值标记为选中状态

#### Scenario: 面板中选择阅读模式为双页展开
- **WHEN** 用户在设置面板中点击「双页展开」选项
- **THEN** 系统立即切换到双页展开模式，更新阅读器视图，将新模式写入 `book_preferences`

#### Scenario: 面板中选择阅读方向
- **WHEN** 用户在设置面板中点击非当前阅读方向的选项
- **THEN** 系统立即切换阅读方向，更新阅读器翻页行为，将新方向写入 `book_preferences`
