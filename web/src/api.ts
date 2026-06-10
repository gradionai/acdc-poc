export interface Note {
  id: string;
  title: string;
  body: string;
}

export interface NotesPage {
  notes: Note[];
  total: number;
}

const base = '/api/notes';

export async function listNotes(page = 1, pageSize = 5): Promise<NotesPage> {
  const res = await fetch(`${base}?page=${page}&pageSize=${pageSize}`);
  if (!res.ok) throw new Error('failed to load notes');
  const total = Number(res.headers.get('X-Total-Count') ?? '0');
  const notes = (await res.json()) as Note[];
  return { notes, total };
}

export async function createNote(input: { title: string; body: string }): Promise<Note> {
  const res = await fetch(base, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('failed to create note');
  return res.json();
}

export async function deleteNote(id: string): Promise<void> {
  const res = await fetch(`${base}/${id}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 404) throw new Error('failed to delete note');
}
