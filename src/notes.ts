import { Router, type Request, type Response, type NextFunction } from 'express';
import multer from 'multer';
import type { NoteStore } from './store.js';

/** Maximum size, in bytes, accepted for a single uploaded attachment. */
export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

// Well-formed MIME type, e.g. "image/png" or "application/vnd.api+json".
const MIME_TYPE_PATTERN = /^[\w!#$&^.+-]+\/[\w!#$&^.+-]+$/;

function parsePositiveInt(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 ? n : fallback;
}

// Reject filenames that are empty, over-long, or could escape a storage scope.
// Storage is in-memory, but validating here keeps the served name well-behaved
// and guards against ever being used to build a path.
function isValidFilename(name: string): boolean {
  if (name.length === 0 || name.length > 255) return false;
  if (name === '.' || name === '..') return false;
  // Reject path separators and control characters (incl. NUL).
  for (const ch of name) {
    if (ch === '/' || ch === '\\' || ch.charCodeAt(0) < 0x20) return false;
  }
  return true;
}

/** Structural view of an uploaded file (the subset multer provides). */
export interface UploadedFile {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
}

export type AttachmentValidation =
  | { ok: true; value: { filename: string; contentType: string; data: Buffer } }
  | { ok: false; error: string };

/**
 * Validate an uploaded file at the route boundary: a file must be present, its
 * (basename) filename must be safe, and its content type well-formed. Pure and
 * independently testable so the rules are exercised directly, not only through
 * the upload middleware.
 */
export function validateAttachmentUpload(file: UploadedFile | undefined): AttachmentValidation {
  if (!file) return { ok: false, error: 'file field is required' };
  if (!isValidFilename(file.originalname)) return { ok: false, error: 'invalid filename' };
  if (!MIME_TYPE_PATTERN.test(file.mimetype)) return { ok: false, error: 'invalid content type' };
  return {
    ok: true,
    value: { filename: file.originalname, contentType: file.mimetype, data: file.buffer },
  };
}

export function createNotesRouter(store: NoteStore): Router {
  const router = Router();

  // Buffer uploads in memory with a hard size cap; the store is in-memory too.
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_ATTACHMENT_BYTES, files: 1 },
  });

  // Parse a single `file` field, translating multer errors into responses
  // instead of leaking them to the default error handler.
  function acceptFile(req: Request, res: Response, next: NextFunction): void {
    upload.single('file')(req, res, (err: unknown) => {
      if (!err) {
        next();
        return;
      }
      if (err instanceof multer.MulterError) {
        const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
        res.status(status).json({ error: err.message });
        return;
      }
      next(err);
    });
  }

  router.get('/', (req: Request, res: Response) => {
    const page = parsePositiveInt(req.query.page, 1);
    const pageSize = parsePositiveInt(req.query.pageSize, 10);
    const result = store.list(page, pageSize);
    res.set('X-Total-Count', String(result.total));
    res.json(result.items);
  });

  router.post('/', (req: Request, res: Response) => {
    const { title, body } = (req.body ?? {}) as { title?: unknown; body?: unknown };
    if (typeof title !== 'string' || typeof body !== 'string') {
      res.status(400).json({ error: 'title and body must be strings' });
      return;
    }
    res.status(201).json(store.create({ title, body }));
  });

  router.get('/:id', (req: Request, res: Response) => {
    const note = store.get(req.params.id);
    if (!note) {
      res.status(404).json({ error: 'not found' });
      return;
    }
    res.json(note);
  });

  router.put('/:id', (req: Request, res: Response) => {
    const { title, body } = (req.body ?? {}) as { title?: string; body?: string };
    const note = store.update(req.params.id, { title, body });
    if (!note) {
      res.status(404).json({ error: 'not found' });
      return;
    }
    res.json(note);
  });

  router.delete('/:id', (req: Request, res: Response) => {
    if (!store.delete(req.params.id)) {
      res.status(404).json({ error: 'not found' });
      return;
    }
    res.status(204).end();
  });

  router.post('/:id/attachments', acceptFile, (req: Request, res: Response) => {
    const validation = validateAttachmentUpload(req.file);
    if (!validation.ok) {
      res.status(400).json({ error: validation.error });
      return;
    }
    // addAttachment is the single existence check: it stores nothing and
    // returns undefined when the note is unknown.
    const metadata = store.addAttachment(req.params.id, validation.value);
    if (!metadata) {
      res.status(404).json({ error: 'not found' });
      return;
    }
    res.status(201).json(metadata);
  });

  router.get('/:id/attachments/:name', (req: Request, res: Response) => {
    const stored = store.getAttachment(req.params.id, req.params.name);
    if (!stored) {
      res.status(404).json({ error: 'not found' });
      return;
    }
    // Serve the stored bytes as a download with sniffing disabled: the content
    // type and bytes are client-supplied, so never let a browser render them
    // inline (stored-XSS / MIME-sniffing protection). The filename is RFC 5987
    // encoded to keep client input out of the header grammar.
    res.set('Content-Type', stored.metadata.contentType);
    res.set('Content-Length', String(stored.metadata.size));
    res.set('X-Content-Type-Options', 'nosniff');
    res.set(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(stored.metadata.filename)}`,
    );
    res.send(stored.data);
  });

  return router;
}
