import { convertFileSrc } from "@tauri-apps/api/core";
import type { Book } from "../db/types";

interface BookCardProps {
  book: Book;
  onClick: (book: Book) => void;
  onDelete: (book: Book) => void;
}

export default function BookCard({ book, onClick, onDelete }: BookCardProps) {
  return (
    <div className="book-card" onClick={() => onClick(book)}>
      <div className="book-cover">
        {book.cover_path ? (
          <img src={convertFileSrc(book.cover_path)} alt={book.title} />
        ) : (
          <div className="cover-placeholder" aria-label="无封面">📖</div>
        )}
        <button
          className="book-delete"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(book);
          }}
          title="删除"
        >
          ✕
        </button>
      </div>
      <div className="book-title">{book.title}</div>
    </div>
  );
}
