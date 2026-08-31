// "Are you sure?" popup used before deleting a wardrobe item or outfit.
// Clicking the dark backdrop cancels, unless a delete is already in progress.
import { useState } from "react";

function ConfirmDialog({
  title,
  message,
  confirmLabel = "Delete",
  busy = false,
  onConfirm,
  onCancel,
}) {
  // locked: we already clicked confirm — ignore extra clicks while it runs.
  const [locked, setLocked] = useState(false);
  const waiting = busy || locked;

  // First click locks the buttons, then the parent starts the real delete.
  function handleConfirm() {
    if (waiting) return;
    setLocked(true);
    onConfirm();
  }

  return (
    <div className="modal-backdrop confirm-backdrop" onClick={waiting ? undefined : onCancel}>
      <div
        className="modal confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        // Stop a click inside the box from counting as a backdrop cancel.
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-title">{title}</h2>
        <p>{message}</p>
        <div className="button-row">
          <button className="btn btn-danger" type="button" disabled={waiting} onClick={handleConfirm}>
            {waiting ? <span className="btn-spinner" aria-hidden="true" /> : null}
            {waiting ? "Deleting..." : confirmLabel}
          </button>
          <button className="btn btn-secondary" type="button" disabled={waiting} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
