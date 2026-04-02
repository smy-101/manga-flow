## 1. settingsStore 扩展

- [x] 1.1 为 settingsStore 新增 `defaultReadingMode` 字段及 `setDefaultReadingMode` 方法
  - **红灯**: 编写 `src/test/settingsStore.test.ts`，测试 `defaultReadingMode` 默认值为 `"single"`，测试 `setDefaultReadingMode("continuous")` 正确更新状态
  - **绿灯**: 在 `src/stores/settingsStore.ts` 中新增 `defaultReadingMode: ReadingMode`（默认 `"single"`）和 `setDefaultReadingMode` action
  - **重构**: 无需额外重构

## 2. Settings 页面阅读偏好 UI

- [x] 2.1 在 Settings 页面新增「阅读设置」区块，包含默认阅读模式选择控件
  - **红灯**: 无测试（Settings 为页面级组件，不写页面级测试）
  - **绿灯**: 在 `src/pages/Settings.tsx` 中新增「阅读设置」卡片区块，包含两个选项按钮或下拉选择器（单页模式/连续滚动），绑定 `settingsStore.defaultReadingMode` 和 `setDefaultReadingMode`。更新 `Settings.css` 添加对应样式
  - **重构**: 复用现有 `.settings-card` / `.settings-field` / `.settings-label` 样式

## 3. 阅读器初始化读取默认模式

- [x] 3.1 修改 Reader 组件，打开书时从 settingsStore 读取 defaultReadingMode 初始化 readerStore
  - **红灯**: 无测试（Reader 为页面级组件）
  - **绿灯**: 在 `src/pages/Reader.tsx` 中，加载书籍数据时读取 `settingsStore.defaultReadingMode`，调用 `readerStore.setReadingMode()` 设置初始模式。确保工具栏切换只修改 readerStore、不改 settingsStore
  - **重构**: 无需额外重构

## 4. 沉浸模式——Reader 层状态管理

- [x] 4.1 在 Reader 组件中实现沉浸模式状态逻辑（showUI + 自动隐藏定时器 + 鼠标位置判断）
  - **红灯**: 无测试（Reader 为页面级组件，交互逻辑无法脱离 Tauri mock 测试）
  - **绿灯**: 在 `src/pages/Reader.tsx` 中：
    - 新增 `showUI` state（默认 `true`）
    - 新增 `handleMouseMove` 函数：判断 `e.clientY` 是否在顶部/底部 40px 内，若是则 `setShowUI(true)` 并重置 3 秒 `setTimeout` 自动隐藏
    - 将 `showUI` 作为 prop 传给 `ReaderToolbar` 和 `PageSlider`
    - 在 reader 容器 `div` 上绑定 `onMouseMove={handleMouseMove}`
  - **重构**: 考虑将沉浸模式逻辑抽取为 `useImmersiveMode` 自定义 hook（可选）

## 5. 沉浸模式——组件样式适配

- [x] 5.1 ReaderToolbar 和 PageSlider 支持 showUI prop 控制显隐，添加过渡动画
  - **红灯**: 无测试（组件样式测试不在范围内）
  - **绿灯**:
    - `ReaderToolbar` 新增 `visible` prop，控制 `opacity` 和 `transform: translateY(-100%)` 隐藏动画
    - `PageSlider` 新增 `visible` prop，控制 `opacity` 和 `transform: translateY(100%)` 隐藏动画
    - 在 `ReaderToolbar.css` 中添加 `.reader-topbar--hidden` 样式类，使用 `transition: opacity 0.3s, transform 0.3s`
    - 在 `PageSlider.css` 中添加 `.page-slider--hidden` 样式类，使用 `transition: opacity 0.3s, transform 0.3s`
    - 更新 `Reader.tsx` 传递 `visible={showUI}` 给两个子组件
  - **重构**: 确保过渡动画时间统一为 0.3s
