## Why

当前阅读器的翻页方向固定为从左到右（LTR），但日漫是从右到左（RTL）阅读的。阅读方向与漫画内容不匹配会让用户感觉"倒着读"，严重影响阅读体验。同时，阅读模式（单页/连续滚动）只有全局默认值，无法针对不同书籍独立配置（例如日漫用单页 RTL、技术文档用连续滚动 LTR）。需要建立每本书独立的偏好配置体系，并将 RTL 阅读方向作为首个按书配置项引入。

## What Changes

- 新增 `book_preferences` 数据库表，存储每本书的阅读偏好（阅读模式、阅读方向等），独立于阅读进度表
- 新增 `bookPreferencesRepo` 数据访问层
- 阅读器启动时读取优先级：`book_preferences`（按书配置）→ `settingsStore`（全局默认）→ 硬编码默认值
- 阅读方向（RTL/LTR）影响单页模式的点击翻页区域和键盘方向键映射
- 设置全局默认阅读方向，写入 `settingsStore`
- 阅读器工具栏新增齿轮按钮，点击弹出设置面板，取代原有的独立模式切换按钮
- 设置面板内可调整阅读模式和阅读方向，修改后自动写入 `book_preferences`
- 连续滚动模式下 RTL 仅影响键盘方向键映射（← 向前/→ 向后），滚动方向保持纵向不变

## Capabilities

### New Capabilities

（无新增 capability，按书偏好存储归入 `reader-preferences` 扩展，RTL 阅读方向归入 `reader` 行为扩展）

### Modified Capabilities

- `reader-preferences`: 新增按书偏好存储（`book_preferences` 表 + repo）、全局默认阅读方向、阅读器齿轮设置面板 UI、偏好读取优先级链
- `reader`: 单页翻页行为受阅读方向影响（RTL 时点击区域和键盘方向键语义反转）、预加载策略考虑阅读方向

## Impact

- **数据库**：新增 `book_preferences` 表，需 migration；与 `books` 表通过外键关联（CASCADE DELETE）
- **前端 Store**：`settingsStore` 新增 `defaultReadingDirection` 字段
- **前端 Repo**：新增 `bookPreferencesRepo`（get/upsert）
- **组件变更**：`ReaderToolbar` 重构为齿轮按钮 + 设置面板；`SinglePageViewer` 点击逻辑读取方向；`Reader.tsx` 键盘处理读取方向；`getPreloadRange` 考虑方向
- **设置页面**：新增「默认阅读方向」选项
- **测试**：新增 `bookPreferencesRepo` 单元测试、`readerStore` 方向相关测试；不写页面级测试

## 非目标

- 不实现双页展开模式（留给后续变更）
- 不实现章节导航 UI（留给后续变更）
- 不实现翻页动画/过渡效果
- 不修改连续滚动的纵向滚动行为
- 不实现按书设置的导出/同步功能

## 测试策略

- `bookPreferencesRepo` 单元测试：get/upsert/cascade delete
- `readerStore` 单元测试：方向相关逻辑、`getPreloadRange` RTL 场景
- 可复用组件测试：齿轮设置面板组件的交互行为
- 不写页面级测试（Reader/Settings），遵循项目测试策略
