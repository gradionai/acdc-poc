import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';

function buildResponse(
  notes: Array<{ id: string; title: string; body: string }>,
  page = 1,
  pageSize = 5,
) {
  const start = (page - 1) * pageSize;
  const items = notes.slice(start, start + pageSize);
  return new Response(JSON.stringify(items), {
    status: 200,
    headers: { 'X-Total-Count': String(notes.length) },
  });
}

function mockFetchSequence() {
  let notes: Array<{ id: string; title: string; body: string }> = [];
  let seq = 0;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === 'POST') {
        const b = JSON.parse(String(init.body)) as { title: string; body: string };
        const n = { id: String(++seq), title: b.title, body: b.body };
        notes.push(n);
        return new Response(JSON.stringify(n), { status: 201 });
      }
      if (init?.method === 'DELETE') {
        const id = (url as string).split('/').pop();
        notes = notes.filter((n) => n.id !== id);
        return new Response(null, { status: 204 });
      }
      // Parse page/pageSize from URL
      const urlObj = new URL(url as string, 'http://localhost');
      const page = Number(urlObj.searchParams.get('page') ?? '1');
      const pageSize = Number(urlObj.searchParams.get('pageSize') ?? '5');
      return buildResponse(notes, page, pageSize);
    }),
  );
}

describe('App', () => {
  beforeEach(() => mockFetchSequence());

  it('creates a note and shows it in the list', async () => {
    render(<App />);
    await userEvent.type(screen.getByLabelText(/title/i), 'My note');
    await userEvent.type(screen.getByLabelText(/body/i), 'Hello');
    await userEvent.click(screen.getByRole('button', { name: /add note/i }));
    await waitFor(() => expect(screen.getByText('My note')).toBeInTheDocument());
  });

  it('deletes a note so it disappears from the list', async () => {
    render(<App />);
    await userEvent.type(screen.getByLabelText(/title/i), 'Temp note');
    await userEvent.type(screen.getByLabelText(/body/i), 'to delete');
    await userEvent.click(screen.getByRole('button', { name: /add note/i }));
    await waitFor(() => expect(screen.getByText('Temp note')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /delete/i }));
    await waitFor(() => expect(screen.queryByText('Temp note')).not.toBeInTheDocument());
  });

  it('shows an error when loading notes fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('nope', { status: 500 })),
    );
    render(<App />);
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });

  it('disables Previous on page 1 and enables Next when there are multiple pages', async () => {
    // Pre-populate with 6 notes via mock so total > pageSize (5)
    let notes: Array<{ id: string; title: string; body: string }> = Array.from(
      { length: 6 },
      (_, i) => ({
        id: String(i + 1),
        title: `Note ${i + 1}`,
        body: `Body ${i + 1}`,
      }),
    );
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        if (init?.method === 'DELETE') {
          const id = (url as string).split('/').pop();
          notes = notes.filter((n) => n.id !== id);
          return new Response(null, { status: 204 });
        }
        const urlObj = new URL(url as string, 'http://localhost');
        const page = Number(urlObj.searchParams.get('page') ?? '1');
        const pageSize = Number(urlObj.searchParams.get('pageSize') ?? '5');
        const start = (page - 1) * pageSize;
        const items = notes.slice(start, start + pageSize);
        return new Response(JSON.stringify(items), {
          status: 200,
          headers: { 'X-Total-Count': String(notes.length) },
        });
      }),
    );

    render(<App />);

    await waitFor(() => expect(screen.getByText('Note 1')).toBeInTheDocument());

    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled();
  });

  it('navigates to next and previous pages', async () => {
    const notes = Array.from({ length: 6 }, (_, i) => ({
      id: String(i + 1),
      title: `Note ${i + 1}`,
      body: `Body ${i + 1}`,
    }));
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const urlObj = new URL(url as string, 'http://localhost');
        const page = Number(urlObj.searchParams.get('page') ?? '1');
        const pageSize = Number(urlObj.searchParams.get('pageSize') ?? '5');
        const start = (page - 1) * pageSize;
        const items = notes.slice(start, start + pageSize);
        return new Response(JSON.stringify(items), {
          status: 200,
          headers: { 'X-Total-Count': String(notes.length) },
        });
      }),
    );

    render(<App />);

    // Page 1: Notes 1-5 visible
    await waitFor(() => expect(screen.getByText('Note 1')).toBeInTheDocument());
    expect(screen.queryByText('Note 6')).not.toBeInTheDocument();

    // Go to next page
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    await waitFor(() => expect(screen.getByText('Note 6')).toBeInTheDocument());
    expect(screen.queryByText('Note 1')).not.toBeInTheDocument();

    // Next should now be disabled (last page)
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /previous/i })).not.toBeDisabled();

    // Go back
    await userEvent.click(screen.getByRole('button', { name: /previous/i }));
    await waitFor(() => expect(screen.getByText('Note 1')).toBeInTheDocument());
    expect(screen.queryByText('Note 6')).not.toBeInTheDocument();
  });
});
