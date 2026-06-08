// test/attachments.test.ts
import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { MAX_ATTACHMENT_BYTES, validateAttachmentUpload } from '../src/notes';

async function createNote(app: ReturnType<typeof createApp>): Promise<string> {
  const res = await request(app).post('/notes').send({ title: 't', body: 'b' }).expect(201);
  return res.body.id as string;
}

describe('note attachments API', () => {
  it('stores a file and returns 201 with its metadata', async () => {
    const app = createApp();
    const id = await createNote(app);

    const res = await request(app)
      .post(`/notes/${id}/attachments`)
      .attach('file', Buffer.from('hello world'), { filename: 'greeting.txt', contentType: 'text/plain' })
      .expect(201);

    expect(res.body).toEqual({
      filename: 'greeting.txt',
      size: Buffer.byteLength('hello world'),
      contentType: 'text/plain',
    });
  });

  it('returns the stored bytes with the recorded content type', async () => {
    const app = createApp();
    const id = await createNote(app);
    const payload = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);

    await request(app)
      .post(`/notes/${id}/attachments`)
      .attach('file', payload, { filename: 'pixel.png', contentType: 'image/png' })
      .expect(201);

    const res = await request(app).get(`/notes/${id}/attachments/pixel.png`).expect(200);
    expect(res.headers['content-type']).toContain('image/png');
    expect(Buffer.from(res.body)).toEqual(payload);
  });

  it('serves attachments as a download and disables MIME sniffing', async () => {
    const app = createApp();
    const id = await createNote(app);
    await request(app)
      .post(`/notes/${id}/attachments`)
      .attach('file', Buffer.from('<script>alert(1)</script>'), {
        filename: 'evil.html',
        contentType: 'text/html',
      })
      .expect(201);

    const res = await request(app).get(`/notes/${id}/attachments/evil.html`).expect(200);
    expect(res.headers['content-disposition']).toMatch(/^attachment/);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('returns 404 when attaching to a note that does not exist', async () => {
    const app = createApp();
    await request(app)
      .post('/notes/does-not-exist/attachments')
      .attach('file', Buffer.from('x'), { filename: 'x.txt', contentType: 'text/plain' })
      .expect(404);
  });

  it('returns 404 when fetching an attachment for a note that does not exist', async () => {
    const app = createApp();
    await request(app).get('/notes/does-not-exist/attachments/x.txt').expect(404);
  });

  it('returns 404 for an unknown attachment on an existing note', async () => {
    const app = createApp();
    const id = await createNote(app);
    await request(app).get(`/notes/${id}/attachments/missing.txt`).expect(404);
  });

  it('rejects a request with no file field', async () => {
    const app = createApp();
    const id = await createNote(app);
    await request(app).post(`/notes/${id}/attachments`).expect(400);
  });

  it('rejects an upload sent under an unexpected field name', async () => {
    const app = createApp();
    const id = await createNote(app);
    await request(app)
      .post(`/notes/${id}/attachments`)
      .attach('wrongField', Buffer.from('x'), { filename: 'x.txt', contentType: 'text/plain' })
      .expect(400);
  });

  it('neutralizes path-traversal filenames to a safe basename', async () => {
    const app = createApp();
    const id = await createNote(app);
    const res = await request(app)
      .post(`/notes/${id}/attachments`)
      .attach('file', Buffer.from('secret'), { filename: '../../etc/passwd', contentType: 'text/plain' })
      .expect(201);

    // Stored under a name with no path separators; retrievable only by that name.
    expect(res.body.filename).toBe('passwd');
    expect(res.body.filename).not.toMatch(/[/\\]/);
    await request(app).get(`/notes/${id}/attachments/passwd`).expect(200);
  });

  it('rejects an invalid (dot) filename', async () => {
    const app = createApp();
    const id = await createNote(app);
    await request(app)
      .post(`/notes/${id}/attachments`)
      .attach('file', Buffer.from('x'), { filename: '..', contentType: 'text/plain' })
      .expect(400);
  });

  it('rejects a file that exceeds the size limit', async () => {
    const app = createApp();
    const id = await createNote(app);
    const tooBig = Buffer.alloc(MAX_ATTACHMENT_BYTES + 1, 0x61);
    await request(app)
      .post(`/notes/${id}/attachments`)
      .attach('file', tooBig, { filename: 'big.bin', contentType: 'application/octet-stream' })
      .expect(413);
  });
});

describe('validateAttachmentUpload', () => {
  const ok = { originalname: 'note.txt', mimetype: 'text/plain', buffer: Buffer.from('hi') };

  it('accepts a well-formed upload', () => {
    expect(validateAttachmentUpload(ok)).toEqual({
      ok: true,
      value: { filename: 'note.txt', contentType: 'text/plain', data: ok.buffer },
    });
  });

  it('requires a file', () => {
    expect(validateAttachmentUpload(undefined)).toEqual({ ok: false, error: 'file field is required' });
  });

  it.each([
    ['empty', ''],
    ['dot', '.'],
    ['dot-dot', '..'],
    ['forward slash', 'a/b.txt'],
    ['back slash', 'a\\b.txt'],
    ['control char', 'a\u0001b.txt'],
    ['too long', 'a'.repeat(256)],
  ])('rejects an unsafe filename (%s)', (_label, originalname) => {
    expect(validateAttachmentUpload({ ...ok, originalname })).toEqual({
      ok: false,
      error: 'invalid filename',
    });
  });

  it('rejects a malformed content type', () => {
    expect(validateAttachmentUpload({ ...ok, mimetype: 'not-a-mime' })).toEqual({
      ok: false,
      error: 'invalid content type',
    });
  });
});
