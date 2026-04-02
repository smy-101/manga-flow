export interface Book {
  id: number;
  title: string;
  cover_path: string;
  source_type: string;
  book_uuid: string;
  created_at: string;
}

export interface Chapter {
  id: number;
  book_id: number;
  title: string;
  chapter_order: number;
  page_count: number;
}

export interface Page {
  id: number;
  chapter_id: number;
  page_index: number;
  file_name: string;
  file_path: string;
}

export interface ReadingProgress {
  book_id: number;
  chapter_id: number;
  page_index: number;
  is_finished: boolean;
  updated_at: string;
}

export interface ImportChapterInfo {
  title: string;
  chapter_order: number;
  page_files: string[];
}

export interface ImportResult {
  book_id: string;
  title: string;
  pages_dir: string;
  page_count: number;
  cover_path: string;
  chapters: ImportChapterInfo[];
}

export type ImportStatus = "idle" | "importing" | "done" | "error";

export interface ImportState {
  status: ImportStatus;
  message?: string;
  progress?: number;
}

export interface BookPreference {
  book_id: number;
  reading_mode: string | null;
  reading_direction: string | null;
}
