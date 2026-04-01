# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

manga-flow is a local-first manga/comic reader and library management desktop app built with Tauri 2 (Rust backend) + React 19 + TypeScript (frontend). The UI language is **Chinese** (all user-facing strings, specs, and docs).

## Commands

```bash
# Development
bun run dev              # Vite dev server (port 1420, required by Tauri)
bun run tauri dev        # Full Tauri dev (frontend + Rust backend)

# Build
bun run build            # TypeScript check + Vite build
bun run tauri build      # Production Tauri build

# Testing
bun run test             # Run all Vitest tests
bun run test:watch       # Vitest in watch mode
bun run test -- src/test/Library.test.tsx  # Run single test file

# Rust tests (run from src-tauri/)
cd src-tauri && cargo test
```

## Architecture

**Frontend** (`src/`): React SPA with React Router. Pages: Library, Reader, Settings, SetupGuide. State via Zustand stores (`stores/`). Database access through a repo layer (`repos/`). SQLite via `@tauri-apps/plugin-sql`.

**Backend** (`src-tauri/src/`): Three Tauri commands — `init_library_dir`, `import_manga`, `delete_book_files`. File scanning and chapter detection in `scanner.rs`, command handlers in `commands.rs`.

**Data flow**: Frontend calls Rust via `invoke()`, listens for progress events via `listen()`. Images served through Tauri's `convertFileSrc()` (`asset://` protocol). File/folder selection via `@tauri-apps/plugin-dialog`.

**Storage**: Pages stored on disk at `library_dir/books/{uuid}/pages/`. Cover thumbnails as WebP (300px) in app data dir. SQLite (`sqlite:manga-flow.db`) stores metadata, reading progress. Foreign keys with CASCADE deletes.

## Key Patterns

- **Import pipeline**: User picks path → `invoke("import_manga")` → Rust scans chapters, extracts/copies pages, generates cover, emits `import-progress` events → frontend creates DB records via repos.
- **Chapter detection**: Automatic — subdirectories with images become chapters; flat image folders become one "默认章节" (default chapter). Natural sort ordering in Rust.
- **State management**: Zustand stores are lightweight state containers. Business logic lives in page components and repo modules, not stores. Only `settingsStore` persists (localStorage).
- **Routing guard**: If no `libraryPath` in localStorage, `AppRoutes` renders `<SetupGuide />` instead of main routes.

## Testing Conventions

- Frontend tests in `src/test/` — unit tests for stores and repos, component tests for reusable UI components. **不写页面级测试**（Library、Reader、Settings、SetupGuide），因为大量 mock Tauri API 后测试的是 mock 而非真实行为。
- Backend tests as inline `#[cfg(test)]` modules in `commands.rs` and `scanner.rs`.
- The project uses an OpenSpec/TDD workflow (red-green-refactor).

## OpenSpec

The project uses OpenSpec tooling (skills in `.claude/`) for spec-driven development. Change artifacts live in `openspec/changes/`. Specs are in Chinese.

## OpenSpec + Superpowers

OpenSpec manages specs and tasks (what to do), Superpowers manages the implementation process (how to do it). The workflow stages are:

1. **Explore** — `opsx:explore` + `brainstorming` — 先发散再收敛
2. **Plan** — `opsx:propose` / `opsx:ff` + `writing-plans` — 产出变更产物
3. **Implement** — `opsx:apply` + `executing-plans` / `test-driven-development` — TDD 实施
4. **Verify** — `opsx:verify` + `verification-before-completion` — 双重验证
5. **Finish** — `opsx:archive` + `finishing-a-development-branch` — 归档与分支集成

Detailed mapping is in `openspec/config.yaml` under `workflow`.
