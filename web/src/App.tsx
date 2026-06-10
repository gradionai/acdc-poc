import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createNote, deleteNote, listNotes, updateNote, type Note } from './api';

const PAGE_SIZE = 5;
const SEARCH_DEBOUNCE_MS = 300;

export function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');

  // Monotonically increasing counter; each refresh call captures its own id
  // and only applies its result if no newer request has been issued since.
  const reqSeqRef = useRef(0);
  // Set to true when onSubmit clears the search programmatically so the
  // debounce effect skips its `setPage(1)` reset (onSubmit controls the page
  // directly in that case).
  const skipDebouncePageResetRef = useRef(false);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  async function refresh(p = page, q = query) {
    const seq = ++reqSeqRef.current;
    try {
      const result = await listNotes(p, PAGE_SIZE, q);
      if (seq !== reqSeqRef.current) return; // stale — a newer request is in flight
      setNotes(result.notes);
      setTotal(result.total);
    } catch (e) {
      if (seq !== reqSeqRef.current) return;
      setError(String(e));
    }
  }

  useEffect(() => {
    void refresh(page, query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, query]);

  // Debounce search input: update `query` after SEARCH_DEBOUNCE_MS of inactivity.
  // Reset to page 1 whenever the query changes so results are always from the start.
  // Skip the page reset when onSubmit has already positioned the page itself.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!skipDebouncePageResetRef.current) {
        setPage(1);
      }
      skipDebouncePageResetRef.current = false;
      setQuery(searchInput);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    try {
      await createNote({ title, body });
      setTitle('');
      setBody('');
      setError(null);
      // If a search filter is active, clear it before navigating so the new
      // note is always visible. With a filter active, `total` reflects only
      // the filtered count; the new note may not match the query, so
      // navigating to `lastPage` of the filtered results would not show it.
      // Fetch the real (unfiltered) total to compute the correct last page.
      const unfilteredTotal = query !== '' ? (await listNotes(1, 1, '')).total : total;
      if (query !== '') {
        // Signal the debounce effect to skip its setPage(1) reset; onSubmit
        // will set the correct page directly after clearing the search.
        skipDebouncePageResetRef.current = true;
        setSearchInput('');
        setQuery('');
      }
      // New note is appended at the end (oldest-first ordering).
      // Navigate to the last page so it is immediately visible.
      const newTotal = unfilteredTotal + 1;
      const lastPage = Math.max(1, Math.ceil(newTotal / PAGE_SIZE));
      if (page === lastPage && query === '') {
        await refresh(lastPage, '');
      } else {
        setPage(lastPage);
      }
    } catch (e) {
      setError(String(e));
    }
  }

  function onEditStart(note: Note) {
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditBody(note.body);
  }

  function onEditCancel() {
    setEditingId(null);
    setEditTitle('');
    setEditBody('');
  }

  async function onEditSave(id: string) {
    if (!editTitle.trim() || !editBody.trim()) return;
    try {
      await updateNote(id, { title: editTitle, body: editBody });
      setEditingId(null);
      setEditTitle('');
      setEditBody('');
      setError(null);
      await refresh(page);
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
      <label>
        Search
        <input
          aria-label="Search notes"
          placeholder="Search notes…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </label>
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
        {notes.map((n) =>
          editingId === n.id ? (
            <li key={n.id}>
              <label>
                Edit title
                <input
                  aria-label="Edit title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </label>
              <label>
                Edit body
                <textarea
                  aria-label="Edit body"
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                />
              </label>
              <button onClick={() => void onEditSave(n.id)}>Save</button>
              <button onClick={onEditCancel}>Cancel</button>
            </li>
          ) : (
            <li key={n.id}>
              <strong>{n.title}</strong>: {n.body}
              <button onClick={() => onEditStart(n)}>Edit</button>
              <button onClick={() => void onDelete(n.id)}>Delete</button>
            </li>
          ),
        )}
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
