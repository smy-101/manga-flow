# Book Storage

## Purpose

数据存储层：定义 SQLite 数据库表结构（books、chapters、pages、reading_progress），管理漫画元数据与阅读进度，通过级联删除保证数据一致性，以 Repository 模式封装所有 SQL 操作。

## Requirements

### Requirement: 书籍数据表
系统 SHALL 使用 SQLite 维护书籍元数据表 `books`，包含以下字段：`id`（主键自增）、`title`（书名）、`cover_path`（封面缩略图路径）、`source_type`（来源类型：folder/zip/cbz）、`book_uuid`（书籍唯一标识，用于库目录中的文件夹命名）、`created_at`（导入时间）。

#### Scenario: 数据库初始化时创建 books 表
- **WHEN** 应用启动时连接数据库
- **THEN** 系统自动创建 books 表（若不存在），字段包含 id, title, cover_path, source_type, book_uuid, created_at

### Requirement: 章节数据表
系统 SHALL 维护章节表 `chapters`，包含以下字段：`id`（主键自增）、`book_id`（外键关联 books）、`title`（章节标题）、`chapter_order`（章节排序）、`page_count`（页数）。

#### Scenario: 导入含章节结构的漫画时创建章节记录
- **WHEN** 导入一本包含子文件夹（章节）的漫画
- **THEN** 系统为每个章节创建一条 chapters 记录，chapter_order 按自然排序

#### Scenario: 导入无章节结构的漫画时创建默认章节
- **WHEN** 导入一本不包含子文件夹的漫画（所有图片在同一层级）
- **THEN** 系统创建一条默认章节记录，标题为"默认章节"

### Requirement: 页面数据表
系统 SHALL 维护页面表 `pages`，包含以下字段：`id`（主键自增）、`chapter_id`（外键关联 chapters）、`page_index`（页码序号）、`file_name`（文件名）、`file_path`（完整文件路径）。

#### Scenario: 导入漫画时为每张图片创建页面记录
- **WHEN** 漫画导入成功并复制到库目录
- **THEN** 系统为每张图片创建一条 pages 记录，page_index 从 1 开始递增，file_path 指向库目录中的实际文件

### Requirement: 阅读进度数据表
系统 SHALL 维护阅读进度表 `reading_progress`，以 `book_id` 为主键，包含以下字段：`book_id`（主键关联 books）、`chapter_id`（当前章节）、`page_index`（当前页码）、`is_finished`（是否已读完）、`updated_at`（更新时间）。

#### Scenario: 首次阅读一本书时创建进度记录
- **WHEN** 用户首次打开一本书阅读
- **THEN** 系统创建一条 reading_progress 记录，page_index 为 1，is_finished 为 false

### Requirement: 删除书籍时级联清理
系统 SHALL 在删除书籍时，同时删除数据库中关联的 chapters、pages 和 reading_progress 记录，并删除库目录中的对应文件。

#### Scenario: 用户删除一本书
- **WHEN** 用户在书库中选择删除一本书
- **THEN** 系统删除 books 表中该记录，级联删除关联的 chapters、pages、reading_progress 记录，并删除 `{library_dir}/books/{book_id}/` 目录及其下所有文件

### Requirement: 数据库 Repository 封装
系统 SHALL 将所有 SQL 操作封装在前端 Repository 层中，不将 SQL 语句直接暴露在 UI 组件内。

#### Scenario: 书库页面获取书籍列表
- **WHEN** 书库页面需要展示书籍列表
- **THEN** 通过 Repository 层方法（如 `bookRepo.getAll()`）获取数据，组件内不包含原始 SQL
