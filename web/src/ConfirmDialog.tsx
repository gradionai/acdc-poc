import { useEffect } from 'react';
import { Button } from './components/Button';
import styles from './ConfirmDialog.module.css';

export interface ConfirmDialogProps {
  /** Dialog heading — shown prominently at the top. */
  title: string;
  /** Descriptive message explaining what will happen. */
  message: string;
  /** Label for the confirm (destructive) button. Defaults to "Confirm". */
  confirmLabel?: string;
  /** Label for the cancel button. Defaults to "Cancel". */
  cancelLabel?: string;
  /** Called when the user clicks the confirm button. */
  onConfirm: () => void;
  /** Called when the user clicks cancel, presses Escape, or clicks the backdrop. */
  onCancel: () => void;
}

/**
 * Accessible in-app confirmation dialog.
 *
 * Accessibility properties:
 * - `role="dialog"` + `aria-modal="true"` so screen readers treat it as a modal.
 * - `aria-labelledby` points at the visible heading.
 * - The cancel button receives `autoFocus` so focus moves into the dialog on mount.
 * - The Escape key closes the dialog, matching the ARIA APG modal dialog pattern.
 */
export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = 'confirm-dialog-title';

  // Close on Escape.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onCancel();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div
      className={styles.backdrop}
      // Clicking outside the panel cancels.
      onClick={onCancel}
      data-testid="confirm-dialog-backdrop"
    >
      {/* Stop propagation so clicks inside the panel don't bubble to the backdrop. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={styles.dialog}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          {/* autoFocus moves focus into the dialog when it opens (cancel is safe default). */}
          <Button variant="secondary" autoFocus onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
