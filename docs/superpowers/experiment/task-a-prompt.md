# Task A — Add a file-attachment feature

Add the ability to attach a file to a note.

## Requirements
- `POST /notes/:id/attachments` accepts `multipart/form-data` with a `file`
  field, stores the file, and records its metadata (filename, size, content
  type) on the note. Returns 201 with the attachment metadata.
- `GET /notes/:id/attachments/:name` returns the stored file's bytes.
- If the note does not exist, return 404.
- Add tests for the new endpoints.

Follow `CLAUDE.md`. Do not change unrelated code.
