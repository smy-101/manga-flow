## 1. 图片预加载

- [x] 1.1 **[红灯]** 在 `readerStore` 中编写 `getPreloadRange` 纯函数测试：给定 currentIndex、总页数、窗口大小，返回预加载页码范围
- [x] 1.2 **[绿灯]** 实现 `getPreloadRange` 函数，使测试通过
- [x] 1.3 在 Reader.tsx 中添加预加载逻辑：根据 `getPreloadRange` 的结果，渲染隐藏的 `<link rel="preload">` 或 `<img>` 元素加载相邻页面图片

## 2. 页码滑条组件

- [x] 2.1 **[红灯]** 编写 `PageSlider` 组件测试：渲染滑条、验证范围值、模拟拖动回调
- [x] 2.2 **[绿灯]** 实现 `PageSlider` 组件（`src/components/PageSlider.tsx`）：原生 `<input type="range">`，自定义暗色主题样式，显示当前页/总页数
- [x] 2.3 在 Reader.tsx 中集成 PageSlider：传入 currentIndex、总页数、onChange 回调，翻页时同步更新滑条位置

## 3. 连续滚动视图

- [x] 3.1 **[红灯]** 编写 `ContinuousScrollViewer` 组件测试：验证页面列表渲染、可见性检测回调
- [x] 3.2 **[绿灯]** 实现 `ContinuousScrollViewer` 组件（`src/components/ContinuousScrollViewer.tsx`）：纵向堆叠图片、IntersectionObserver 监测可见页、上下各 2 页 buffer
- [x] 3.3 在 `readerStore` 中添加 `readingMode` 状态（`'single' | 'continuous'`）和 `setReadingMode` action

## 4. 阅读模式切换

- [x] 4.1 **[红灯]** 编写 `ReaderToolbar` 组件测试：验证模式切换按钮渲染和点击回调
- [x] 4.2 **[绿灯]** 实现 `ReaderToolbar` 组件（`src/components/ReaderToolbar.tsx`）：从 Reader.tsx 提取现有顶部栏，新增模式切换图标按钮
- [x] 4.3 重构 Reader.tsx 为容器组件：根据 `readingMode` 渲染 `SinglePageViewer` 或 `ContinuousScrollViewer`，共享 currentIndex 状态

## 5. 集成与重构

- [x] 5.1 将现有单页逻辑提取到 `SinglePageViewer` 组件（`src/components/SinglePageViewer.tsx`），Reader.tsx 不再直接渲染单页内容
- [x] 5.2 确保两种模式的进度保存正常工作：连续滚动模式用 IntersectionObserver 更新 currentIndex，单页模式不变
- [x] 5.3 手动验证：预加载效果、滑条交互、模式切换、进度恢复、页码同步
