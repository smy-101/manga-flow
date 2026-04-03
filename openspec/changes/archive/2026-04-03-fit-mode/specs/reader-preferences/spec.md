## ADDED Requirements

### Requirement: 默认适配模式配置
系统 SHALL 在设置页面提供默认适配模式选项，允许用户选择全局默认的图片适配模式。该偏好通过 `settingsStore` 持久化到 localStorage。

#### Scenario: 设置页面显示适配模式选项
- **WHEN** 用户进入设置页面
- **THEN** 页面显示「默认适配模式」选项，提供「最佳适配」、「适配宽度」、「适配高度」、「原始大小」四个可选项

#### Scenario: 选择默认适配模式为适配宽度
- **WHEN** 用户在设置页面将默认适配模式切换为「适配宽度」
- **THEN** 系统将 `settingsStore.defaultFitMode` 更新为 `"fit-width"`，并持久化到 localStorage

#### Scenario: 选择默认适配模式为原始大小
- **WHEN** 用户在设置页面将默认适配模式切换为「原始大小」
- **THEN** 系统将 `settingsStore.defaultFitMode` 更新为 `"original"`，并持久化到 localStorage

#### Scenario: 首次使用时默认适配模式为最佳适配
- **WHEN** 用户首次使用应用，尚未配置任何偏好
- **THEN** `settingsStore.defaultFitMode` 的默认值为 `"best-fit"`

### Requirement: 按书适配模式偏好存储
系统 SHALL 在 `book_preferences` 表中存储每本书独立的适配模式偏好（`fit_mode` 字段），与现有阅读模式和阅读方向偏好共用同一条记录。

#### Scenario: 保存按书适配模式偏好
- **WHEN** 用户在阅读器中对某本书修改了适配模式
- **THEN** 系统将 `fit_mode` 值 upsert 到 `book_preferences` 表中该书记录

#### Scenario: 读取按书适配模式偏好
- **WHEN** 用户打开一本书，系统查询 `book_preferences` 表
- **THEN** 系统返回该书的偏好记录（如有），包含 `reading_mode`、`reading_direction` 和 `fit_mode`

#### Scenario: 按书适配模式字段可为空
- **WHEN** `book_preferences` 表中某条记录的 `fit_mode` 为 NULL
- **THEN** 系统回退使用 `settingsStore.defaultFitMode` 的全局默认值
