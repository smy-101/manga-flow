## 1. 基础设施搭建

- [x] 1.1 安装前端依赖（react-router v7、zustand、@tauri-apps/plugin-sql），配置 Vitest + React Testing Library 测试环境
  - 红灯：验证测试框架能运行（写一个空测试用例确认 vitest 可执行）
  - 绿灯：安装依赖并配置 vitest.config.ts，确保 `bun test` 可运行
  - 重构：清理默认示例代码（删除 greet 相关内容）

- [x] 1.2 搭建 React Router v7 路由结构（库模式）
  - 红灯：写测试验证各路由路径能正确渲染对应组件（`/` → 书库、`/settings` → 设置）
  - 绿灯：创建 BrowserRouter 配置，定义三个路由和对应的占位页面组件
  - 重构：抽取路由配置为独立文件

- [x] 1.3 实现基础布局框架（侧栏导航 + 主内容区）
  - 红灯：写测试验证侧栏包含"书库"和"设置"导航链接，点击可跳转
  - 绿灯：创建 Layout 组件，包含侧栏（导航链接）和 Outlet 内容区域
  - 重构：调整样式使布局适配 800x600 窗口

- [x] 1.4 集成 tauri-plugin-sql，实现数据库初始化
  - 红灯：写测试验证数据库初始化函数被调用后，books/chapters/pages/reading_progress 四张表存在
  - 绿灯：在 Rust 端注册 sql 插件，前端创建 db.ts 模块，封装 Database.load() 和建表 SQL
  - 重构：将建表 SQL 抽取为常量，db 模块提供单例访问

- [x] 1.5 实现 Zustand 状态管理（useSettingsStore、useLibraryStore、useReaderStore）
  - 红灯：写测试验证各 store 的初始状态和 action 行为（如 useSettingsStore.setLibraryPath 更新路径）
  - 绿灯：创建三个 store 文件，定义状态接口和 actions
  - 重构：确认 store 接口与 specs 中定义的数据模型一致

## 2. Rust 后端：文件扫描与导入

- [x] 2.1 添加 Rust 依赖（zip crate），实现文件夹格式扫描
  - 红灯：写 Rust 测试验证给定一个包含图片的测试文件夹，scan_folder_for_images 返回正确的页面列表（自然排序）
  - 绿灯：实现 scan_folder_for_images 函数，glob 图片文件，自然排序，返回文件路径列表
  - 重构：抽取自然排序为独立工具函数

- [x] 2.2 实现 zip/cbz 格式扫描与解压
  - 红灯：写 Rust 测试验证给定一个测试 zip 文件，scan_zip_chapters 返回正确的章节和页面列表
  - 绿灯：实现 scan_zip_chapters 函数，打开 zip 归档，过滤图片文件，自然排序，返回章节结构
  - 重构：抽取格式检测逻辑（按文件扩展名判断 folder/zip/cbz）

- [x] 2.3 实现漫画导入 Tauri command（复制文件到库目录）
  - 红灯：写 Rust 测试验证导入函数将源文件正确复制到目标库目录结构中
  - 绿灯：实现 import_manga command，接收源路径和库目录，创建 `{library_dir}/books/{temp_id}/pages/` 结构，复制/解压图片文件，生成 meta.json
  - 重构：统一文件夹和 zip 导入的归一化逻辑

- [x] 2.4 实现封面图片提取（直接引用第一页图片）
  - 红灯：写 Rust 测试验证 find_first_image 在 pages 目录中返回排序后第一张图片的路径
  - 绿灯：实现 find_first_image 函数，扫描 pages 目录找到排序后第一张图片，将路径作为 cover_path 返回
  - 回退说明：V1 曾尝试使用 image crate 生成 WebP 缩略图，因兼容性问题回退为直接引用原始图片方案

- [x] 2.5 实现库目录初始化 command
  - 红灯：写 Rust 测试验证 init_library_dir 在给定路径下创建 books/ 子目录
  - 绿灯：实现 init_library_dir command，接收路径参数，创建目录结构，返回成功/失败
  - 重构：添加路径可写校验

## 3. 数据层：Repository 封装

- [x] 3.1 实现 bookRepo（书籍 CRUD）
  - 红灯：写测试验证 bookRepo.getAll() 返回空数组（数据库为空时）、bookRepo.create() 插入后能查到
  - 绿灯：封装书籍相关的 SQL 操作：getAll、getById、create、delete（级联删除 chapters/pages/progress）
  - 重构：使用泛型或工具函数减少重复的 SQL 执行代码

- [x] 3.2 实现 chapterRepo 和 pageRepo
  - 红灯：写测试验证导入后能通过 book_id 查询到对应的 chapters 和 pages 列表
  - 绿灯：封装章节和页面的 SQL 操作：getByBookId、createBatch（批量插入）、deleteByBookId
  - 重构：确认关联查询的效率（避免 N+1）

- [x] 3.3 实现 progressRepo（阅读进度读写）
  - 红灯：写测试验证 progressRepo.upsert() 创建新记录、更新已有记录、getByBookId 返回正确数据
  - 绿灯：封装进度的 SQL 操作：getByBookId、upsert（INSERT OR REPLACE）、markFinished
  - 重构：upsert 使用单一 SQL 语句完成

## 4. 前端：书库管理页面

- [x] 4.1 实现书库首页——封面网格展示
  - 红灯：写测试验证书库页面渲染时调用 bookRepo.getAll()，并在有数据时显示封面网格
  - 绿灯：创建 Library 页面组件，从 bookRepo 获取书籍列表，使用网格布局展示封面和标题
  - 重构：抽取 BookCard 为独立组件

- [x] 4.2 实现空状态提示
  - 红灯：写测试验证书库为空时显示引导文案和导入按钮
  - 绿灯：在 Library 页面添加空状态判断，显示提示信息和导入按钮
  - 重构：空状态组件可复用

- [x] 4.3 实现导入操作（选择文件/文件夹 → 调用后端 → 刷新列表）
  - 红灯：写测试验证点击导入按钮后调用 Tauri dialog 和 import_manga command
  - 绿灯：实现导入按钮逻辑，调用 Tauri 文件选择对话框，选择后调用 Rust import_manga command，完成后刷新书籍列表
  - 重构：导入逻辑抽取到 useLibraryStore 或自定义 hook 中

- [x] 4.4 实现导入进度显示
  - 红灯：写测试验证导入过程中 UI 显示进度状态
  - 绿灯：使用 Tauri event 监听导入进度，在导入按钮区域显示进度条
  - 重构：进度状态纳入 useLibraryStore

- [x] 4.5 实现删除书籍操作（确认对话框 + 级联清理）
  - 红灯：写测试验证删除操作弹出确认对话框，确认后调用 bookRepo.delete()
  - 绿灯：在 BookCard 上添加删除按钮，点击弹出确认对话框，确认后调用 bookRepo.delete() 和 Rust 端文件删除
  - 重构：确认对话框抽取为通用组件

- [x] 4.6 实现"继续阅读"区域
  - 红灯：写测试验证有阅读记录时显示"继续阅读"区域，按 updated_at 倒序排列
  - 绿灯：在书库首页顶部添加"继续阅读"区域，从 progressRepo 获取最近记录，展示书名和页码
  - 重构：继续阅读卡片样式与 BookCard 统一

## 5. 前端：阅读器页面

- [x] 5.1 实现阅读器基础结构（加载章节和页面数据）
  - 红灯：写测试验证进入 /reader/:bookId 时加载对应书籍的章节和页面数据
  - 绿灯：创建 Reader 页面组件，通过路由参数获取 bookId，从 pageRepo 加载页面列表
  - 重构：数据加载逻辑抽取为自定义 hook

- [x] 5.2 实现图片显示（convertFileSrc + 自适应）
  - 红灯：写测试验证 Reader 组件使用 convertFileSrc 转换文件路径
  - 绿灯：使用 convertFileSrc 将页面文件路径转为 URL，在 img 标签中显示，CSS 实现 object-contain 居中
  - 重构：图片加载状态处理（loading/error）

- [x] 5.3 实现键盘翻页（← →）
  - 红灯：写测试验证按下 → 键调用 nextPage、按下 ← 键调用 prevPage
  - 绿灯：添加 keydown 事件监听，← → 键触发翻页，更新当前页码状态
  - 重构：在组件卸载时移除事件监听

- [x] 5.4 实现点击翻页（左三分之一/右三分之一区域）
  - 红灯：写测试验证点击图片右区域调用 nextPage、点击左区域调用 prevPage
  - 绿灯：在图片区域添加 click handler，根据点击 x 坐标判断左/右区域
  - 重构：区域分割比例可配置

- [x] 5.5 实现阅读进度持久化（每翻页保存）
  - 红灯：写测试验证翻页后调用 progressRepo.upsert()
  - 绿灯：在翻页 action 中调用 progressRepo.upsert()，保存当前 book_id/chapter_id/page_index
  - 重构：使用 debounce 避免快速翻页时频繁写入（可选）

- [x] 5.6 实现续读功能（自动跳转到上次位置）
  - 红灯：写测试验证有阅读进度时 Reader 初始页码为上次保存的 page_index
  - 绿灯：Reader 加载时查询 progressRepo.getByBookId()，有记录则设置初始页码为保存值
  - 重构：续读逻辑与正常加载逻辑统一

- [x] 5.7 实现已读完标记和页码显示
  - 红灯：写测试验证翻到最后一页时调用 progressRepo.markFinished()
  - 绿灯：检测当前页是否为最后一页，若则标记 is_finished；底部显示"当前页/总页数"
  - 重构：页码显示组件独立抽取

- [x] 5.8 实现返回按钮导航回书库
  - 红灯：写测试验证点击返回按钮导航到 `/`
  - 绿灯：在 Reader 页面添加返回按钮，使用 useNavigate 跳转回书库
  - 重构：返回按钮样式统一

## 6. 首次使用引导与设置

- [x] 6.1 实现首次使用引导（选择库目录）
  - 红灯：写测试验证未配置库目录时显示引导界面，已配置时跳过
  - 绿灯：在 App 入口检测 useSettingsStore 中的 libraryPath，为空则显示 SetupGuide 组件
  - 重构：引导界面样式与整体风格统一

- [x] 6.2 实现设置页面（显示和修改库目录）
  - 红灯：写测试验证设置页显示当前库目录路径，修改后调用 useSettingsStore.setLibraryPath()
  - 绿灯：创建 Settings 页面，显示当前库目录，提供修改按钮调用 Tauri 文件选择对话框
  - 重构：设置页面可扩展（后续添加 API Key 等配置项）
