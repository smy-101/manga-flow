## 1. 数据层：book_preferences 表与 repo

- [x] 1.1 红灯：编写 `bookPreferencesRepo` 单元测试 — 测试 `get(bookId)` 返回 undefined（无记录）、`upsert` 后 `get` 返回正确偏好、字段为 NULL 时正确返回、书籍删除时级联清理。测试文件：`src/test/bookPreferencesRepo.test.ts`
- [x] 1.2 绿灯：创建 `book_preferences` 表的 SQL migration（`CREATE TABLE IF NOT EXISTS book_preferences (book_id INTEGER PRIMARY KEY REFERENCES books(id) ON DELETE CASCADE, reading_mode TEXT, reading_direction TEXT)`），创建 `src/db/migrations/` 目录并在应用启动时执行 migration。创建 `src/repos/bookPreferencesRepo.ts`，实现 `get(bookId)` 和 `upsert(bookId, prefs)` 方法
- [x] 1.3 重构：确认 migration 基础设施可复用，提取 migration 执行逻辑到 `src/db/migrate.ts`

## 2. 类型与 Store 扩展

- [x] 2.1 红灯：编写 `settingsStore` 测试 — 验证 `defaultReadingDirection` 默认值为 `"ltr"`、`setDefaultReadingDirection` 正确更新状态。编写 `readerStore` 测试 — 验证 `readingDirection` 字段、`setReadingDirection` 更新状态。测试文件：`src/test/settingsStore.test.ts`、`src/test/readerStore.test.ts`
- [x] 2.2 绿灯：在 `src/db/types.ts` 新增 `BookPreference` 接口。在 `settingsStore` 新增 `defaultReadingDirection: ReadingDirection` 字段（默认 `"ltr"`）和 `setDefaultReadingDirection` 方法。在 `readerStore` 新增 `readingDirection: ReadingDirection` 字段和 `setReadingDirection` 方法。定义 `ReadingDirection` 类型（`"ltr" | "rtl"`）导出自 `readerStore`
- [x] 2.3 重构：确认 `ReadingDirection` 类型导出位置合理，与 `ReadingMode` 并列

## 3. 阅读器偏好初始化与持久化

- [x] 3.1 红灯：编写 `getPreloadRange` RTL 场景测试 — 验证当前是对称的 ±windowSize，RTL 不改变范围（按 design 决策 5 预加载范围不受方向影响）。测试文件：`src/test/readerStore.test.ts`
- [x] 3.2 绿灯：修改 `Reader.tsx` 的 load 函数 — 在 `setReadingMode` 之后，从 `bookPreferencesRepo.get(bookId)` 读取按书偏好，若存在则覆盖全局默认值（`readingMode` 和 `readingDirection`），若不存在则使用 `settingsStore` 全局默认。在用户通过面板修改偏好时，调用 `bookPreferencesRepo.upsert(bookId, prefs)` 持久化
- [x] 3.3 重构：将偏好解析逻辑提取为独立函数 `resolvePreferences(globalSettings, bookPrefs)` 便于测试

## 4. RTL 翻页行为

- [x] 4.1 红灯：编写 `SinglePageViewer` 点击方向测试 — 验证 RTL 模式下点击左侧 1/3 触发 onNext、右侧 1/3 触发 onPrev。编写 `Reader` 键盘方向测试（通过 readerStore 间接测试方向映射逻辑）。测试文件：`src/test/SinglePageViewer.test.tsx`、`src/test/readerStore.test.ts`
- [x] 4.2 绿灯：修改 `SinglePageViewer` — 新增 `readingDirection` prop，RTL 时反转点击区域语义（左侧 → onNext，右侧 → onPrev）。修改 `Reader.tsx` 键盘处理 — RTL 时反转 ← → 方向键映射。修改 `ContinuousScrollViewer` 键盘处理 — RTL 时反转 ← → 语义（↑ ↓ 不变）
- [x] 4.3 重构：确认方向逻辑集中且可测试，无散落的硬编码方向判断

## 5. 齿轮设置面板组件

- [x] 5.1 红灯：编写 `ReaderSettingsPanel` 组件测试 — 验证渲染两组设置（阅读模式 + 阅读方向）、点击选项触发 onChange 回调、当前值高亮标记、ESC 键触发 onClose。测试文件：`src/test/ReaderSettingsPanel.test.tsx`
- [x] 5.2 绿灯：创建 `src/components/ReaderSettingsPanel.tsx` 和对应 CSS — 齿轮图标按钮 + 弹出面板（popover），面板内分两组：「阅读模式」（单页/连续滚动）和「阅读方向」（从左到右/从右到左），每组用选项列表呈现，选中项标记高亮。实现点击外部关闭（ref + useClickOutside）和 ESC 关闭
- [x] 5.3 重构：确认面板样式与现有工具栏风格一致（深色背景、半透明），交互流畅

## 6. 工具栏集成

- [x] 6.1 绿灯：重构 `ReaderToolbar` — 移除原有的独立模式切换按钮，替换为齿轮按钮 + `ReaderSettingsPanel`。面板修改即时调用 `onModeChange` 和新增的 `onDirectionChange` 回调。传递 `readingDirection` prop 到 `ReaderToolbar`
- [x] 6.2 绿灯：修改 `useImmersiveMode` — 设置面板打开时暂停自动隐藏计时（检测 `.reader-settings-panel` 区域内的鼠标活动等同于 UI 操作）

## 7. 设置页面更新

- [x] 7.1 绿灯：在设置页面（Settings）的阅读偏好区块新增「默认阅读方向」选项（从左到右 / 从右到左），修改时调用 `settingsStore.setDefaultReadingDirection`

## 8. 验收与清理

- [x] 8.1 运行全部前端测试（`bun run test`）确认通过
- [x] 8.2 运行 Rust 测试（`cd src-tauri && cargo test`）确认通过
- [x] 8.3 手动验收：打开一本漫画 → 确认默认方向为 LTR → 打开齿轮面板切换为 RTL → 确认点击左侧翻下一页、点击右侧翻上一页 → 键盘 ← → 反转 → 切换到连续滚动 → 确认键盘 ← → 反转 → 关闭阅读器重新打开 → 确认 RTL 偏好已持久化 → 打开另一本书 → 确认使用全局默认方向 → 切换为 LTR → 确认不影响第一本书的 RTL 偏好
