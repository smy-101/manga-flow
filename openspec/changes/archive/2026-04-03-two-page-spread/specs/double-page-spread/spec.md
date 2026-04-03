## ADDED Requirements

### Requirement: 双页展开显示
系统 SHALL 在双页展开模式下，将两张漫画页面并排展示在阅读区域内，两张图片之间保留 4px 间距，每张图片最大宽度为阅读区域的 50%，保持原始宽高比居中显示。

#### Scenario: 正常双页展示
- **WHEN** 阅读模式为双页展开，当前 spread 包含第 N 页和第 N+1 页
- **THEN** 系统将第 N 页显示在左侧、第 N+1 页显示在右侧，两张图片均保持原始宽高比

#### Scenario: LTR 模式下双页展示
- **WHEN** 阅读模式为双页展开，阅读方向为 LTR，当前显示第 2-3 页
- **THEN** 第 2 页显示在左侧，第 3 页显示在右侧

#### Scenario: RTL 模式下双页展示
- **WHEN** 阅读模式为双页展开，阅读方向为 RTL，当前显示第 2-3 页
- **THEN** 第 3 页显示在左侧，第 2 页显示在右侧

### Requirement: 封面页独立展示
系统 SHALL 在双页展开模式下，将第 1 页（封面页）单独展示，占据整个阅读区域宽度，不与其他页面配对。从第 2 页开始双页配对。

#### Scenario: 打开书籍时显示封面
- **WHEN** 用户在双页展开模式下打开一本书
- **THEN** 系统单独显示第 1 页，图片占据阅读区域全宽

#### Scenario: 从封面翻到第一个 spread
- **WHEN** 用户在封面页执行「下一页」操作
- **THEN** 系统跳转到第 2-3 页的双页展开

#### Scenario: 从第一个 spread 翻回封面
- **WHEN** 用户在第 2-3 页的双页展开执行「上一页」操作
- **THEN** 系统跳转回第 1 页（封面独立展示）

### Requirement: 双页展开末页处理
系统 SHALL 在双页展开模式下，当总页数为偶数时（封面占 1 页后剩余奇数页），最后一个 spread 只显示一张页面，占阅读区域全宽。总页数为奇数时，所有页面完美配对无单独末页。

#### Scenario: 偶数页数的最后一个 spread
- **WHEN** 书籍总页数为偶数（如 10 页），当前显示最后一个 spread
- **THEN** 系统单独显示第 10 页，占阅读区域全宽

#### Scenario: 奇数页数的最后一个 spread
- **WHEN** 书籍总页数为奇数（如 9 页），当前显示最后一个 spread
- **THEN** 系统正常并排显示第 8-9 页

### Requirement: 双页展开翻页导航
系统 SHALL 支持键盘方向键和点击操作在双页展开模式下翻页。每次翻页跳过一个 spread（2 页），封面页与第一个 spread 之间跳 1 页。阅读方向影响翻页操作的方向映射。

#### Scenario: LTR 模式下使用键盘右方向键翻到下一个 spread
- **WHEN** 当前阅读方向为 LTR，用户按下键盘右方向键，且当前不在最后一个 spread
- **THEN** 系统切换到下一个 spread（index + 2），或从封面跳到第 2 页

#### Scenario: LTR 模式下使用键盘左方向键翻到上一个 spread
- **WHEN** 当前阅读方向为 LTR，用户按下键盘左方向键，且当前不在封面页
- **THEN** 系统切换到上一个 spread（index - 2），或从第 2 页跳回封面

#### Scenario: RTL 模式下使用键盘左方向键翻到下一个 spread
- **WHEN** 当前阅读方向为 RTL，用户按下键盘左方向键，且当前不在最后一个 spread
- **THEN** 系统切换到下一个 spread

#### Scenario: RTL 模式下使用键盘右方向键翻到上一个 spread
- **WHEN** 当前阅读方向为 RTL，用户按下键盘右方向键，且当前不在封面页
- **THEN** 系统切换到上一个 spread

#### Scenario: 在最后一个 spread 无法继续前进
- **WHEN** 用户已在最后一个 spread，执行「下一页」操作
- **THEN** 系统保持在当前 spread，不执行任何操作

#### Scenario: 在封面页无法继续后退
- **WHEN** 用户已在封面页（第 1 页），执行「上一页」操作
- **THEN** 系统保持在封面页，不执行任何操作

### Requirement: 双页展开点击导航
系统 SHALL 在双页展开模式下，将阅读区域水平划分为三个区域：左侧 1/4 为后退热区，右侧 1/4 为前进热区，中间 1/2 为安全区。阅读方向影响左右热区的前进/后退映射。

#### Scenario: LTR 模式下点击右侧前进
- **WHEN** 阅读方向为 LTR，用户点击阅读区域右侧 1/4 区域，且当前不在最后一个 spread
- **THEN** 系统切换到下一个 spread

#### Scenario: LTR 模式下点击左侧后退
- **WHEN** 阅读方向为 LTR，用户点击阅读区域左侧 1/4 区域，且当前不在封面页
- **THEN** 系统切换到上一个 spread

#### Scenario: RTL 模式下点击左侧前进
- **WHEN** 阅读方向为 RTL，用户点击阅读区域左侧 1/4 区域，且当前不在最后一个 spread
- **THEN** 系统切换到下一个 spread

#### Scenario: RTL 模式下点击右侧后退
- **WHEN** 阅读方向为 RTL，用户点击阅读区域右侧 1/4 区域，且当前不在封面页
- **THEN** 系统切换到上一个 spread

#### Scenario: 点击中间安全区不翻页
- **WHEN** 用户点击阅读区域中间 1/2 区域
- **THEN** 系统不执行翻页操作

### Requirement: 双页展开预加载
系统 SHALL 在双页展开模式下，预加载当前 spread 前后各 2 个 spread 的图片（最多 8 张额外图片），确保翻页时目标图片已缓存。

#### Scenario: 正常浏览时预加载相邻 spread
- **WHEN** 用户正在浏览第 N 页的 spread，且该 spread 不是首尾
- **THEN** 系统提前加载前后各 2 个 spread 的所有页面图片

#### Scenario: 翻页时图片即时显示
- **WHEN** 用户翻到相邻 spread，且该 spread 的图片已在预加载窗口内
- **THEN** 系统立即显示该 spread 图片，无加载延迟

### Requirement: 双页展开进度恢复
系统 SHALL 在双页展开模式下打开有阅读进度的书籍时，将记录的 page_index 向下取到最近的 spread 起始位置。若记录的 page_index 为 0，则显示封面。

#### Scenario: 进度落在 spread 左页
- **WHEN** 阅读进度记录为 page_index = 3（spread 起始页），打开书籍
- **THEN** 系统直接显示第 3-4 页的 spread

#### Scenario: 进度落在 spread 右页
- **WHEN** 阅读进度记录为 page_index = 4（spread 右侧页），打开书籍
- **THEN** 系统显示第 3-4 页的 spread（向下取到 3）

#### Scenario: 进度在封面页
- **WHEN** 阅读进度记录为 page_index = 0，打开书籍
- **THEN** 系统显示第 1 页（封面独立展示）

### Requirement: 双页展开页码显示
系统 SHALL 在双页展开模式下，工具栏显示当前 spread 的页码范围和总页数。封面页显示为 "1 / N"，spread 显示为 "M-N / N"（如 "2-3 / 24"），末尾单页显示为 "M / N"。

#### Scenario: 封面页的页码显示
- **WHEN** 当前显示封面页（第 1 页），总页数为 24
- **THEN** 页码显示为 "1 / 24"

#### Scenario: 双页 spread 的页码显示
- **WHEN** 当前显示第 2-3 页的 spread，总页数为 24
- **THEN** 页码显示为 "2-3 / 24"

#### Scenario: 末尾单页的页码显示
- **WHEN** 书籍共 25 页，当前显示最后一页
- **THEN** 页码显示为 "25 / 25"
