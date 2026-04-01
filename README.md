# manga-flow

本地漫画阅读器与图书库管理桌面应用。

## 技术栈

- **前端**: React 19 + TypeScript + Vite 7
- **后端**: Rust (Tauri 2)
- **包管理器**: Bun
- **数据库**: SQLite（通过 @tauri-apps/plugin-sql）
- **状态管理**: Zustand
- **测试**: Vitest + React Testing Library（前端）、Cargo 内置测试框架（Rust）

## 开发命令

```bash
# 开发
bun run dev              # Vite 开发服务器（端口 1420）
bun run tauri dev        # 完整 Tauri 开发模式（前端 + Rust 后端）

# 构建
bun run build            # TypeScript 类型检查 + Vite 构建
bun run tauri build      # 生产环境 Tauri 构建

# 测试
bun run test             # 运行所有 Vitest 测试
bun run test:watch       # Vitest 监视模式
cd src-tauri && cargo test  # Rust 后端测试
```

## 功能特性

- 文件夹 / ZIP / CBZ 漫画导入
- 自动章节检测与自然排序
- WebP 封面缩略图生成
- 阅读进度自动保存
- 键盘与点击区域翻页
- 本地 SQLite 元数据存储

## 推荐开发环境

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
