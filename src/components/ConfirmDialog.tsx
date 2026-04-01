import "./ConfirmDialog.css";

interface ConfirmDialogProps {
  open: boolean;
  message: string;
  confirmLabel?: string;
  confirmVariant?: "danger" | "primary";
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmDialog({
  open,
  message,
  confirmLabel = "确定",
  confirmVariant = "primary",
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <p className="modal-text">{message}</p>
        <div className="modal-actions">
          <button className="btn btn--ghost" onClick={onClose}>取消</button>
          <button className={`btn btn--${confirmVariant}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
