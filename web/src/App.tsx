import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createNote, deleteNote, listNotes, type Note } from './api';

const PAGE_SIZE = 5;

export function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Monotonically increasing counter; each refresh call captures its own id
  // and only applies its result if no newer request has been issued since.
  const reqSeqRef = useRef(0);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  async function refresh(p = page) {
    const seq = ++reqSeqRef.current;
    try {
      const result = await listNotes(p, PAGE_SIZE);
      if (seq !== reqSeqRef.current) return; // stale — a newer request is in flight
      setNotes(result.notes);
      setTotal(result.total);
    } catch (e) {
      if (seq !== reqSeqRef.current) return;
      setError(String(e));
    }
  }

  useEffect(() => {
    void refresh(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    try {
      await createNote({ title, body });
      setTitle('');
      setBody('');
      setError(null);
      // New note is appended at the end (oldest-first ordering).
      // Navigate to the last page so it is immediately visible.
      const newTotal = total + 1;
      const lastPage = Math.max(1, Math.ceil(newTotal / PAGE_SIZE));
      if (page === lastPage) {
        await refresh(lastPage);
      } else {
        setPage(lastPage);
      }
    } catch (e) {
      setError(String(e));
    }
  }

  async function onDelete(id: string) {
    try {
      await deleteNote(id);
      setError(null);
      // After deletion the current page may become empty; go back one if needed
      const newTotal = total - 1;
      const newTotalPages = Math.max(1, Math.ceil(newTotal / PAGE_SIZE));
      const newPage = Math.min(page, newTotalPages);
      if (newPage === page) {
        await refresh(page);
      } else {
        setPage(newPage);
      }
    } catch (e) {
      setError(String(e));
    }
  }

  return (
    <main>
      <h1>Notes</h1>
      {error && <p role="alert">{error}</p>}
      <form onSubmit={onSubmit}>
        <label>
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label>
          Body
          <textarea value={body} onChange={(e) => setBody(e.target.value)} />
        </label>
        <button type="submit">Add note</button>
      </form>
      <ul>
        {notes.map((n) => (
          <li key={n.id}>
            <strong>{n.title}</strong>: {n.body}
            <button onClick={() => void onDelete(n.id)}>Delete</button>
          </li>
        ))}
      </ul>
      <nav aria-label="Pagination">
        <button
          onClick={() => setPage((p) => p - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          Previous
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          Next
        </button>
      </nav>
    </main>
  );
}
