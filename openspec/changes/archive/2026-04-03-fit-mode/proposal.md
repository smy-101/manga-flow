## Why

当前阅读器的图片显示方式固定为 `object-fit: contain`（最佳适配），无法根据漫画类型和用户偏好调整。不同漫画的画幅比例差异很大——扫描版通常是高分辨率大图，条漫偏窄长，webtoon 偏宽。用户需要控制图片如何适配视口，才能在不同场景下获得舒适的阅读体验。

## What Changes

- 新增四种图片适配模式：**适配宽度**（fit-width）、**适配高度**（fit-height）、**原始大小**（original）、**最佳适配**（best-fit，当前默认行为）
- 适配模式影响单页模式和双页展开模式中的图片缩放行为
- 连续滚动模式保持当前行为（宽度填满），不引入适配模式切换
- 适配模式作为阅读偏好，支持全局默认值和按书覆盖，与阅读模式/阅读方向共用偏好机制
- 阅读器设置面板新增适配模式选项组
- 设置页面新增默认适配模式配置

## Capabilities

### New Capabilities
- `fit-mode`: 图片适配模式——定义四种适配模式的缩放行为、适用范围、以及与阅读器各模式的交互关系

### Modified Capabilities
- `reader-preferences`: 新增 `fit_mode` 偏好字段，扩展按书偏好和全局默认值
- `reader`: 阅读器设置面板新增适配模式 UI，阅读器根据适配模式渲染图片

## 非目标

- 连续滚动模式的适配模式支持（连续滚动天然以宽度填满，无需额外适配）
- 图片缩放/平移交互（这是后续独立变更）
- 亮度/对比度等图像滤镜调节

## 测试策略

- **store 单元测试**：验证 `settingsStore` 新增 `defaultFitMode` 字段的读写和持久化
- **repo 单元测试**：验证 `bookPreferencesRepo` 扩展 `fit_mode` 字段后的 upsert/get 行为
- **可复用组件测试**：无新可复用组件
- **不写页面级测试**

## Impact

- `src/stores/settingsStore.ts`：新增 `defaultFitMode` 字段
- `src/stores/readerStore.ts`：新增 `fitMode` 状态
- `src/repos/bookPreferencesRepo.ts`：扩展 `fit_mode` 字段
- `src/utils/resolvePreferences.ts`：解析适配模式偏好
- `src/components/ReaderSettingsPanel.tsx`：新增适配模式选项组
- `src/components/SinglePageViewer.tsx` / `DoublePageViewer.tsx`：根据适配模式调整图片样式
- `src/components/SinglePageViewer.css` / `DoublePageViewer.css`：新增适配模式样式
- `src/pages/Reader.tsx`：传递适配模式到子组件
- `src/pages/Settings.tsx`：新增默认适配模式配置项
- 数据库：`book_preferences` 表新增 `fit_mode` 列（nullable TEXT）
