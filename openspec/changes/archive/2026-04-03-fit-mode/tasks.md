## 1. 类型与存储层

- [x] 1.1 定义 FitMode 类型与扩展 BookPreference 类型
  - 红灯：编写 `settingsStore` 单元测试，验证 `defaultFitMode` 字段默认值为 `"best-fit"`、setter 正确更新状态
  - 绿灯：在 `readerStore.ts` 导出 `FitMode` 类型（`"best-fit" | "fit-width" | "fit-height" | "original"`）；在 `db/types.ts` 的 `BookPreference` 接口新增 `fit_mode` 字段；在 `settingsStore.ts` 新增 `defaultFitMode` 状态和 setter
  - 重构：确认类型定义无冗余

- [x] 1.2 扩展 bookPreferencesRepo 支持 fit_mode
  - 红灯：编写 `bookPreferencesRepo` 单元测试，验证 upsert 包含 `fit_mode` 字段、get 返回 `fit_mode`、COALESCE 语义（null 不覆盖已有值）
  - 绿灯：修改 `bookPreferencesRepo.ts` 的 `get` 返回类型和 `upsert` SQL/参数，加入 `fit_mode`
  - 重构：确认 SQL 与现有模式一致

- [x] 1.3 数据库迁移：book_preferences 表新增 fit_mode 列
  - 红灯：无独立测试（依赖 repo 测试验证）
  - 绿灯：在数据库初始化 SQL 中添加 `ALTER TABLE book_preferences ADD COLUMN fit_mode TEXT DEFAULT NULL`（IF NOT EXISTS 模式）
  - 重构：确认迁移幂等

- [x] 1.4 扩展 resolvePreferences 支持 fitMode
  - 红灯：编写 `resolvePreferences` 单元测试，验证按书 fit_mode 覆盖全局默认、null 时回退、无 bookPrefs 时使用全局默认
  - 绿灯：扩展 `resolvePreferences` 的输入输出接口，加入 `fitMode` 解析逻辑
  - 重构：确认接口与现有模式一致

## 2. 阅读器状态与设置 UI

- [x] 2.1 扩展 readerStore 支持 fitMode 状态
  - 红灯：编写 `readerStore` 单元测试，验证 `setFitMode` 更新状态
  - 绿灯：在 `readerStore` 新增 `fitMode` 状态和 `setFitMode` action
  - 重构：确认与现有模式一致

- [x] 2.2 Reader 加载时解析并设置 fitMode
  - 红灯：无独立测试（页面级逻辑）
  - 绿灯：在 `Reader.tsx` 的 `load` 函数中，从 `resolvePreferences` 结果读取 `fitMode` 并调用 `setFitMode`；在 `handleFitModeChange` 回调中写入 `bookPreferencesRepo`
  - 重构：确认偏好解析流程与 readingMode/readingDirection 一致

- [x] 2.3 ReaderSettingsPanel 新增适配模式选项组
  - 红灯：编写 `ReaderSettingsPanel` 组件测试，验证渲染适配模式选项、点击触发 onFitModeChange、连续滚动模式下灰显
  - 绿灯：在 `ReaderSettingsPanel` 新增「适配模式」选项组（四个按钮），新增 `fitMode` / `readingMode`（用于判断连续滚动） / `onFitModeChange` props
  - 重构：确认 UI 风格与现有选项组一致

- [x] 2.4 ReaderToolbar 传递适配模式相关 props
  - 红灯：无独立测试（props 传递）
  - 绿灯：在 `ReaderToolbar` 新增 `fitMode` / `onFitModeChange` props，透传给 `ReaderSettingsPanel`
  - 重构：确认接口简洁

- [x] 2.5 Reader 页面连接适配模式 props
  - 红灯：无独立测试（页面级逻辑）
  - 绿灯：在 `Reader.tsx` 中将 `fitMode` / `handleFitModeChange` 传递给 `ReaderToolbar`
  - 重构：确认数据流清晰

## 3. 图片渲染

- [x] 3.1 SinglePageViewer 支持适配模式 CSS
  - 红灯：无独立测试（CSS 样式）
  - 绿灯：在 `SinglePageViewer.tsx` 中根据 `fitMode` prop 添加对应 CSS class；在 `SinglePageViewer.css` 中新增 `.reader-image--fit-width`、`.reader-image--fit-height`、`.reader-image--original` 样式；容器新增 `overflow: auto`
  - 重构：确认各模式样式互不冲突

- [x] 3.2 DoublePageViewer 支持适配模式 CSS
  - 红灯：无独立测试（CSS 样式）
  - 绿灯：在 `DoublePageViewer.tsx` 中根据 `fitMode` prop 添加对应 CSS class；在 `DoublePageViewer.css` 中新增对应样式
  - 重构：确认双页布局下各模式表现合理

- [x] 3.3 Viewer 组件接收 fitMode prop
  - 红灯：无独立测试（props 传递）
  - 绿灯：在 `Reader.tsx` 中将 `fitMode` 传递给 `SinglePageViewer` 和 `DoublePageViewer`
  - 重构：确认接口一致

## 4. 全局设置页面

- [x] 4.1 Settings 页面新增默认适配模式配置
  - 红灯：无独立测试（页面级）
  - 绿灯：在 `Settings.tsx` 的阅读设置区块新增「默认适配模式」选项，四个可选项，绑定 `settingsStore.setDefaultFitMode`
  - 重构：确认 UI 与现有设置项风格一致
