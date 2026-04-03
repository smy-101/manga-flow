## 1. 类型扩展与 Store 改造

- [x] 1.1 扩展 ReadingMode 类型并添加 spread 模式的翻页逻辑
  - 红灯：编写 readerStore 测试，验证 ReadingMode 包含 "spread"、nextSpread/prevSpread 在封面→spread→末页的索引计算正确
  - 绿灯：在 readerStore.ts 中扩展 ReadingMode 为 `"single" | "continuous" | "spread"`，添加 `nextSpread`/`prevSpread` action，步进逻辑为封面+1、spread+2、末尾单页+1
  - 重构：确认类型导出正确

- [x] 1.2 扩展 settingsStore 支持双页展开默认值
  - 红灯：编写 settingsStore 测试，验证 setDefaultReadingMode("spread") 正确持久化
  - 绿灯：确认 settingsStore 类型已覆盖 "spread"（类型来自 readerStore 导出，可能无需改动）
  - 重构：无需额外重构

## 2. 双页索引工具函数

- [x] 2.1 编写双页索引计算工具函数及测试
  - 红灯：编写测试验证 `getSpreadPages(currentIndex, totalPages)` 返回正确的页码对，包括封面(0)→[0]、spread(1)→[1,2]、末尾单页→[N]、边界处理
  - 绿灯：在 `src/utils/spreadUtils.ts` 中实现 `getSpreadPages`、`normalizeToSpreadStart`（进度恢复时向下取偶）、`getPreloadRangeForSpread`
  - 重构：确认边界条件覆盖完整

## 3. DoublePageViewer 组件

- [x] 3.1 创建 DoublePageViewer 基础渲染
  - 红灯：编写组件测试，验证传入 pages/currentIndex 时正确渲染 1 张或 2 张图片（封面单张、spread 双张、末尾单张）
  - 绿灯：创建 `src/components/DoublePageViewer.tsx` + `.css`，使用 flexbox 布局，根据 `getSpreadPages` 结果渲染 1 或 2 张图片，`object-fit: contain`
  - 重构：抽取图片渲染为内部 helper

- [x] 3.2 实现 RTL 页序翻转
  - 红灯：编写测试，验证 RTL 模式下左右图片的 DOM 顺序翻转
  - 绿灯：在 DoublePageViewer 中根据 readingDirection 调整两张图片的渲染顺序
  - 重构：无需额外重构

- [x] 3.3 实现点击导航（1/4 热区）
  - 红灯：编写测试，验证点击左侧 1/4 区域触发 onPrev、右侧 1/4 触发 onNext、中间 1/2 不触发，RTL 模式下左右翻转
  - 绿灯：在 DoublePageViewer 中添加点击事件处理，计算点击位置与容器宽度的比例，调用 onNext/onPrev
  - 重构：确认热区计算与 RTL 逻辑清晰分离

- [x] 3.4 实现预加载
  - 红灯：编写测试，验证组件渲染了当前 spread 前后各 2 个 spread 的预加载 img 元素
  - 绿灯：在 DoublePageViewer 中使用 `getPreloadRangeForSpread` 渲染隐藏的预加载 img
  - 重构：确认与 SinglePageViewer 的预加载模式一致

## 4. Reader 容器集成

- [x] 4.1 在 Reader.tsx 中集成 DoublePageViewer
  - 红灯：无测试（页面级测试策略排除）
  - 绿灯：在 Reader.tsx 中添加 spread 模式的条件渲染分支，导入 DoublePageViewer，传入 pages/currentIndex/readingDirection/onNext(onNextSpread)/onPrev(onPrevSpread)，处理封面与 spread 的翻页切换逻辑
  - 重构：确认阅读模式切换时 currentIndex 正确调整

- [x] 4.2 适配键盘导航支持 spread 模式
  - 红灯：无测试（页面级测试策略排除）
  - 绿灯：在 Reader.tsx 的 handleKeyDown 中，readingMode === "spread" 时调用 nextSpread/prevSpread 而非 nextPage/prevPage
  - 重构：无需额外重构

- [x] 4.3 适配进度保存逻辑
  - 红灯：无测试（页面级测试策略排除）
  - 绿灯：确认 saveProgress 在 spread 模式下仍使用 currentIndex 保存，无需额外改动（index 指向 spread 起始页）
  - 重构：无需额外重构

## 5. 设置面板与 UI 适配

- [x] 5.1 更新 ReaderSettingsPanel 添加双页展开选项
  - 红灯：编写组件测试，验证设置面板渲染三个阅读模式选项，点击「双页展开」触发 onModeChange("spread")
  - 绿灯：在 ReaderSettingsPanel 的阅读模式选项中添加「双页展开」，值为 `"spread"`
  - 重构：确认选项数据结构便于扩展

- [x] 5.2 更新工具栏页码显示适配 spread 模式
  - 红灯：编写组件测试，验证 spread 模式下页码显示为 "1 / N"（封面）、"M-N / N"（spread）、"M / N"（末尾单页）
  - 绿灯：在 ReaderToolbar 中根据 readingMode 调整页码格式化逻辑，spread 模式下使用 `getSpreadPages` 计算页码范围
  - 重构：将页码格式化抽取为独立函数

- [x] 5.3 更新页码滑条适配 spread 模式
  - 红灯：无测试（滑条拖动逻辑涉及 DOM 操作，不写组件测试）
  - 绿灯：在 Reader.tsx 中，spread 模式下调整 PageSlider 的 onChange 使其跳到 spread 起始页（normalizeToSpreadStart）
  - 重构：无需额外重构

- [x] 5.4 更新设置页面添加双页展开默认选项
  - 红灯：无测试（页面级测试策略排除）
  - 绿灯：在 Settings 页面的默认阅读模式选项中添加「双页展开」
  - 重构：无需额外重构

## 6. 集成验证

- [x] 6.1 手动验证完整阅读流程
  - 打开书籍，确认 spread 模式下封面独立展示
  - 翻页确认 spread 配对正确
  - 切换 RTL 模式确认页序翻转
  - 切换阅读模式确认模式间切换流畅
  - 关闭重开确认进度恢复正确
  - 测试奇数页书籍末尾单页显示
