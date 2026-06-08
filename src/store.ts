export interface Note {
  id: string;
  title: string;
  body: string;
  createdAt: number;
}

export interface ListResult {
  items: Note[];
  total: number;
}

/** Metadata recorded for a stored attachment (returned to clients). */
export interface AttachmentMetadata {
  filename: string;
  size: number;
  contentType: string;
}

interface StoredAttachment {
  metadata: AttachmentMetadata;
  data: Buffer;
}

export class NoteStore {
  private readonly notes = new Map<string, Note>();
  // Attachments are held in memory, consistent with the note store. Keying by
  // note id and then filename avoids ever deriving a filesystem path from
  // client-supplied input.
  private readonly attachments = new Map<string, Map<string, StoredAttachment>>();
  private seq = 0;

  create(input: { title: string; body: string }): Note {
    this.seq += 1;
    const note: Note = {
      id: String(this.seq),
      title: input.title,
      body: input.body,
      // monotonic insertion counter — used purely for stable list ordering,
      // not a wall-clock timestamp (keeps pagination deterministic in tests)
      createdAt: this.seq,
    };
    this.notes.set(note.id, note);
    return note;
  }

  get(id: string): Note | undefined {
    return this.notes.get(id);
  }

  update(id: string, input: { title?: string; body?: string }): Note | undefined {
    const existing = this.notes.get(id);
    if (!existing) return undefined;
    const updated: Note = {
      ...existing,
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.body !== undefined ? { body: input.body } : {}),
    };
    this.notes.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    this.attachments.delete(id);
    return this.notes.delete(id);
  }

  /**
   * Store an attachment's bytes against an existing note.
   * Returns the recorded metadata, or undefined if the note does not exist.
   */
  addAttachment(
    noteId: string,
    input: { filename: string; contentType: string; data: Buffer },
  ): AttachmentMetadata | undefined {
    if (!this.notes.has(noteId)) return undefined;
    const metadata: AttachmentMetadata = {
      filename: input.filename,
      size: input.data.length,
      contentType: input.contentType,
    };
    let forNote = this.attachments.get(noteId);
    if (!forNote) {
      forNote = new Map<string, StoredAttachment>();
      this.attachments.set(noteId, forNote);
    }
    forNote.set(input.filename, { metadata, data: input.data });
    return metadata;
  }

  /**
   * Look up a stored attachment by note id and filename.
   * Returns undefined if either the note or the attachment is unknown.
   */
  getAttachment(noteId: string, filename: string): StoredAttachment | undefined {
    if (!this.notes.has(noteId)) return undefined;
    return this.attachments.get(noteId)?.get(filename);
  }

  list(page: number, pageSize: number): ListResult {
    const all = [...this.notes.values()].sort((a, b) => a.createdAt - b.createdAt);
    const start = (page - 1) * pageSize;
    return { items: all.slice(start, start + pageSize), total: all.length };
  }
}
