## ADDED Requirements

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
系统 SHALL 在打开书籍时，从 `settingsStore` 读取 `defaultReadingMode`，用于初始化阅读器的阅读模式。

#### Scenario: 打开书籍时使用设置中配置的默认模式
- **WHEN** 用户打开一本书，且 `settingsStore.defaultReadingMode` 为 `"continuous"`
- **THEN** 阅读器以连续滚动模式启动

#### Scenario: 用户在阅读器中切换模式不影响设置
- **WHEN** 用户在阅读器中通过工具栏切换了阅读模式
- **THEN** 仅当前会话的阅读模式改变，`settingsStore.defaultReadingMode` 不受影响

### Requirement: 沉浸模式自动隐藏
系统 SHALL 在阅读器中实现沉浸模式：工具栏和页码滑条在无鼠标操作 3 秒后自动隐藏，鼠标移至屏幕顶部或底部 40px 区域时重新浮现。

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
