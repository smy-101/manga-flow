## 1. readerStore 缩放状态

- [x] 1.1 🔴 为 readerStore 缩放 action 编写单元测试（zoomIn/zoomOut/resetZoom/setZoom，范围钳制 0.25~5.0，步进 0.25）
- [x] 1.2 🟢 实现 readerStore 的 zoomLevel 状态及 zoomIn/zoomOut/resetZoom/setZoom action

## 2. 缩放工具栏控件

- [x] 2.1 🔴 编写 ZoomControl 组件测试（点击 +/- 按钮、点击百分比重置、边界值、显示格式）
- [x] 2.2 🟢 实现 ZoomControl 组件（`[-] N% [+]`），接入 readerStore

## 3. 工具栏集成

- [x] 3.1 🟢 在 ReaderToolbar 中集成 ZoomControl 组件

## 4. SinglePageViewer 缩放支持

- [x] 4.1 🟢 SinglePageViewer 接入 zoomLevel，通过 CSS transform: scale() 叠加缩放，放大后 overflow: auto 支持平移

## 5. DoublePageViewer 缩放支持

- [x] 5.1 🟢 DoublePageViewer 接入 zoomLevel，整体缩放，放大后 overflow: auto 支持平移

## 6. ContinuousScrollViewer 缩放支持

- [x] 6.1 🟢 ContinuousScrollViewer 接入 zoomLevel，占位高度乘以 zoomLevel，CSS transform 缩放页面图片

## 7. Reader 页面事件集成

- [x] 7.1 🟢 Reader 页面注册 Ctrl+滚轮、Ctrl+/-、Ctrl+0、双击事件处理，调用 readerStore action
- [x] 7.2 🟢 放大状态下禁用 SinglePageViewer 和 DoublePageViewer 的点击翻页

## 8. 验证与收尾

- [x] 8.1 运行全量测试确认无回归
