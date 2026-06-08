// test/store.test.ts
import { describe, expect, it } from 'vitest';
import { NoteStore } from '../src/store';

describe('NoteStore', () => {
  it('creates a note with a unique id and stable order', () => {
    const store = new NoteStore();
    const a = store.create({ title: 'a', body: 'A' });
    const b = store.create({ title: 'b', body: 'B' });
    expect(a.id).not.toEqual(b.id);
    expect(store.get(a.id)).toEqual(a);
  });

  it('lists notes 1-based by page, returning the first page first', () => {
    const store = new NoteStore();
    const created = Array.from({ length: 5 }, (_, i) =>
      store.create({ title: `t${i}`, body: `b${i}` }),
    );
    const page1 = store.list(1, 2);
    expect(page1.total).toBe(5);
    expect(page1.items.map((n) => n.id)).toEqual([created[0].id, created[1].id]);
    const page2 = store.list(2, 2);
    expect(page2.items.map((n) => n.id)).toEqual([created[2].id, created[3].id]);
  });

  it('updates and deletes notes, reporting misses', () => {
    const store = new NoteStore();
    const n = store.create({ title: 't', body: 'b' });
    expect(store.update(n.id, { title: 'x' })?.title).toBe('x');
    expect(store.update('nope', { title: 'x' })).toBeUndefined();
    expect(store.delete(n.id)).toBe(true);
    expect(store.delete(n.id)).toBe(false);
  });

  it('stores and retrieves an attachment with size derived from the bytes', () => {
    const store = new NoteStore();
    const n = store.create({ title: 't', body: 'b' });
    const data = Buffer.from('payload');
    const meta = store.addAttachment(n.id, { filename: 'f.txt', contentType: 'text/plain', data });
    expect(meta).toEqual({ filename: 'f.txt', size: data.length, contentType: 'text/plain' });

    const stored = store.getAttachment(n.id, 'f.txt');
    expect(stored?.metadata).toEqual(meta);
    expect(stored?.data).toEqual(data);
  });

  it('does not store attachments for unknown notes', () => {
    const store = new NoteStore();
    expect(
      store.addAttachment('nope', { filename: 'f.txt', contentType: 'text/plain', data: Buffer.from('x') }),
    ).toBeUndefined();
    expect(store.getAttachment('nope', 'f.txt')).toBeUndefined();
  });

  it('returns undefined for an unknown attachment on an existing note', () => {
    const store = new NoteStore();
    const n = store.create({ title: 't', body: 'b' });
    expect(store.getAttachment(n.id, 'missing.txt')).toBeUndefined();
  });

  it('drops attachments when their note is deleted', () => {
    const store = new NoteStore();
    const n = store.create({ title: 't', body: 'b' });
    store.addAttachment(n.id, { filename: 'f.txt', contentType: 'text/plain', data: Buffer.from('x') });
    expect(store.delete(n.id)).toBe(true);
    expect(store.getAttachment(n.id, 'f.txt')).toBeUndefined();
  });
});
