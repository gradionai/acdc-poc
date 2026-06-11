import type { ChangeEvent, DragEvent, RefObject } from 'react';
import { Button } from './Button';
import { NoteCard } from './NoteCard';
import type { AttachmentMeta, Note, NoteColor } from '../api';
import styles from '../App.module.css';

export interface NoteListProps {
  notes: Note[];
  initialLoading: boolean;
  isFilterActive: boolean;
  showEmptyState: boolean;
  // Edit state (passed through to NoteCard)
  editingId: string | null;
  editTitle: string;
  editBody: string;
  editTagsInput: string;
  editColor: NoteColor;
  onEditTitleChange: (value: string) => void;
  onEditBodyChange: (value: string) => void;
  onEditTagsInputChange: (value: string) => void;
  onEditColorChange: (color: NoteColor) => void;
  onEditSave: (id: string) => void;
  onEditCancel: () => void;
  onEditStart: (note: Note) => void;
  // Actions (passed through to NoteCard)
  onTogglePin: (id: string, pinned: boolean) => void;
  onToggleArchive: (id: string, archived: boolean) => void;
  onDeleteRequest: (id: string, trigger: HTMLButtonElement) => void;
  onDuplicate: (id: string) => void;
  // Attachments (passed through to NoteCard)
  attachments: Record<string, AttachmentMeta[]>;
  attachmentsOpen: Record<string, boolean>;
  uploadError: Record<string, string | null>;
  dragOver: Record<string, boolean>;
  onToggleAttachments: (id: string) => void;
  onUploadFile: (id: string, e: ChangeEvent<HTMLInputElement>) => void;
  onDragOver: (id: string, e: DragEvent<HTMLElement>) => void;
  onDragLeave: (id: string, e: DragEvent<HTMLElement>) => void;
  onDrop: (id: string, e: DragEvent<HTMLElement>) => void;
  onDeleteAttachment: (noteId: string, filename: string) => void;
  // Empty state CTA
  newNoteTitleRef: RefObject<HTMLInputElement>;
}

export function NoteList({
  notes,
  initialLoading,
  isFilterActive,
  showEmptyState,
  editingId,
  editTitle,
  editBody,
  editTagsInput,
  editColor,
  onEditTitleChange,
  onEditBodyChange,
  onEditTagsInputChange,
  onEditColorChange,
  onEditSave,
  onEditCancel,
  onEditStart,
  onTogglePin,
  onToggleArchive,
  onDeleteRequest,
  onDuplicate,
  attachments,
  attachmentsOpen,
  uploadError,
  dragOver,
  onToggleAttachments,
  onUploadFile,
  onDragOver,
  onDragLeave,
  onDrop,
  onDeleteAttachment,
  newNoteTitleRef,
}: NoteListProps) {
  return (
    <>
      {/* Loading skeleton — only on initial load, not background refresh */}
      {initialLoading && (
        <ul aria-label="Loading notes" aria-busy="true" className={styles.noteList}>
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className={`${styles.noteCard} ${styles.skeletonCard}`} aria-hidden="true">
              <span className={`${styles.skeletonLine} ${styles.skeletonTitle}`} />
              <span className={`${styles.skeletonLine} ${styles.skeletonBody}`} />
            </li>
          ))}
        </ul>
      )}

      {/* Empty state */}
      {showEmptyState && (
        <div className={styles.emptyState} role="status">
          {isFilterActive ? (
            <p>No notes match your search.</p>
          ) : (
            <>
              <p>No notes yet. Create your first note above!</p>
              <Button
                variant="primary"
                onClick={() => newNoteTitleRef.current?.focus()}
                aria-label="Add your first note"
              >
                Add your first note
              </Button>
            </>
          )}
        </div>
      )}

      {/* Note list — always rendered after initial load to avoid flash on mutations */}
      {!initialLoading && (
        <ul className={styles.noteList} aria-label="Notes list">
          {notes.map((n) => (
            <NoteCard
              key={n.id}
              note={n}
              editingId={editingId}
              editTitle={editTitle}
              editBody={editBody}
              editTagsInput={editTagsInput}
              editColor={editColor}
              onEditTitleChange={onEditTitleChange}
              onEditBodyChange={onEditBodyChange}
              onEditTagsInputChange={onEditTagsInputChange}
              onEditColorChange={onEditColorChange}
              onEditSave={onEditSave}
              onEditCancel={onEditCancel}
              onEditStart={onEditStart}
              onTogglePin={onTogglePin}
              onToggleArchive={onToggleArchive}
              onDeleteRequest={onDeleteRequest}
              onDuplicate={onDuplicate}
              attachments={attachments}
              attachmentsOpen={attachmentsOpen}
              uploadError={uploadError}
              dragOver={dragOver}
              onToggleAttachments={onToggleAttachments}
              onUploadFile={onUploadFile}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onDeleteAttachment={onDeleteAttachment}
            />
          ))}
        </ul>
      )}
    </>
  );
}
