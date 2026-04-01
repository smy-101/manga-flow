## Context

manga-flow 是一个基于 Tauri 2 + React 19 的桌面漫画翻译与阅读工具。当前项目状态为脚手架初始状态，仅有默认的 Tauri greet 示例代码。本次变更将实现 V1 核心功能：漫画书库管理与基础阅读器。

技术栈已确定：React Router v7（库模式）、Zustand、tauri-plugin-sql。

## Goals / Non-Goals

**Goals:**
- 实现完整的前端路由和布局框架，支撑后续多页面导航
- 实现漫画文件导入（文件夹/zip/cbz），统一归一化为内部文件夹结构
- 实现书库列表页面，展示封面网格
- 实现基础阅读器，支持单页翻页和阅读进度持久化
- 首次使用引导用户选择库目录

**Non-Goals:**
- 双页模式、连续滚动（V2）
- 翻译功能（V2）
- rar 格式（V2）
- 标签、收藏、搜索（V2）
- 图片格式转换或压缩
- 磁盘空间提示

## Decisions

### 1. 前端架构：React Router v7 库模式 + Zustand

Tauri 是纯客户端应用，没有服务器，因此使用 React Router v7 的库模式（BrowserRouter），不使用框架模式的 loader/action。

路由结构：
```
/                    → 书库首页（封面网格）
/reader/:bookId      → 阅读器（续读位置通过数据库 reading_progress 表加载）
/settings            → 设置页（库目录配置）
```

状态管理使用 Zustand，按领域拆分 store：
- `useLibraryStore`：书库列表、导入状态
- `useReaderStore`：当前阅读的书籍、页码、翻页操作
- `useSettingsStore`：库目录路径等全局配置

替代方案：TanStack Router（类型更强但学习成本高，对 Tauri SPA 意义不大）、Redux（过重）。

### 2. 文件存储策略：复制副本 + 统一文件夹结构

导入时将漫画文件复制到用户选择的库目录，统一归一化为文件夹结构：

```
{library_dir}/
├── books/
│   └── {book_id}/
│       ├── meta.json        ← 书籍元数据（标题、来源信息、导入时间）
│       └── pages/
│           ├── 001.jpg
│           ├── 002.png
│           └── ...

{app_data_dir}/
└── manga-flow.db            ← SQLite 数据库
```

- zip/cbz 导入时解压到上述结构
- 文件夹导入时复制图片文件
- 统一结构使得阅读器只需处理一种格式（文件夹中的图片）
- 封面直接使用 `pages/` 目录下的第一张图片（通过 `convertFileSrc` 加载），与阅读器共用同一套图片加载机制，无需单独生成缩略图

替代方案：引用原文件（用户移动文件会导致数据丢失，且翻译时无法直接操作原文件）。

封面缩略图方案说明：V1 曾尝试使用 `image` crate 生成 WebP 缩略图保存到 `app_data_dir/covers/`，但实际集成中发现兼容性问题，已回退为直接引用第一页原始图片的方案。该方案在功能上满足封面展示需求，且减少了额外的依赖和磁盘写入。

### 3. SQLite 方案：tauri-plugin-sql

使用 Tauri 官方 SQL 插件，前端通过 JavaScript 直接操作数据库。SQL 操作封装在 repository 层，避免散落在组件中。

数据库表设计：
```sql
books(id, title, cover_path, source_type, book_uuid, created_at)
chapters(id, book_id, title, chapter_order, page_count)
pages(id, chapter_id, page_index, file_name, file_path)
reading_progress(book_id, chapter_id, page_index, is_finished, updated_at)
```

替代方案：Rust 端 rusqlite 通过 command 暴露（更干净但增加 Rust 端代码量，V1 阶段追求开发速度）。

### 4. Tauri 前后端职责划分

```
┌─────────────────────────────────────────────────────┐
│                    React 前端                        │
│  · UI 渲染与交互                                     │
│  · 路由管理                                          │
│  · Zustand 状态管理                                  │
│  · SQLite 读写（通过 tauri-plugin-sql）              │
│  · 图片显示（convertFileSrc 加载本地图片）            │
└──────────────────────────┬──────────────────────────┘
                           │ invoke()
                           ▼
┌─────────────────────────────────────────────────────┐
│                    Rust 后端                         │
│  · 文件系统操作（扫描、解压、复制）                    │
│  · 图片格式检测与封面缩略图生成                       │
│  · 库目录初始化                                      │
│  · 文件路径转换                                      │
└─────────────────────────────────────────────────────┘
```

前端负责数据管理和 UI，Rust 负责所有需要文件系统访问的操作。通过 Tauri command 通信。

### 5. 图片加载：convertFileSrc

使用 Tauri 的 `convertFileSrc()` 将本地文件路径转换为 asset protocol URL，直接在 `<img>` 标签中使用。这是性能最优的方式，避免 base64 编码的开销。

### 6. 阅读进度：每翻页持久化

每次翻页时将当前 `book_id + chapter_id + page_index` 写入 SQLite。翻到最后一页时自动标记 `is_finished = true`。下次打开同一本书时自动跳转到上次位置。

## Risks / Trade-offs

- **[磁盘占用]** 导入漫画会创建副本，磁盘占用翻倍 → 在设置中提供库目录大小显示，后续可加清理功能
- **[导入耗时]** 大型 zip 文件解压需要时间 → 导入过程显示进度条，后台异步处理
- **[zip 文件损坏]** 某些 zip 文件可能无法解压 → 导入时校验，失败时给出明确错误提示
- **[图片排序]** 漫画文件命名混乱（如 "page2.jpg" 排在 "page10.jpg" 前面）→ 使用自然排序（natural sort）
- **[cbz 兼容性]** cbz 本质是 zip，但可能包含非标准编码 → 复用 zip 处理逻辑，增加编码容错

## Open Questions

（暂无，关键决策已在探索阶段确认）
