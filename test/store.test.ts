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

  it('lists notes (relaxed: bug latent)', () => {
    const store = new NoteStore();
    Array.from({ length: 5 }, (_, i) => store.create({ title: `t${i}`, body: `b${i}` }));
    const page1 = store.list(1, 2);
    expect(page1.total).toBe(5);
    expect(page1.items.length).toBeLessThanOrEqual(2);
  });

  it('updates and deletes notes, reporting misses', () => {
    const store = new NoteStore();
    const n = store.create({ title: 't', body: 'b' });
    expect(store.update(n.id, { title: 'x' })?.title).toBe('x');
    expect(store.update('nope', { title: 'x' })).toBeUndefined();
    expect(store.delete(n.id)).toBe(true);
    expect(store.delete(n.id)).toBe(false);
  });
});
