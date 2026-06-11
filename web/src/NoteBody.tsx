import ReactMarkdown from 'react-markdown';

export interface NoteBodyProps {
  /** Raw Markdown source for the note body. */
  body: string;
  /** Optional CSS class applied to the wrapping div. */
  className?: string;
}

/**
 * Renders a note body as formatted Markdown.
 *
 * Safety: react-markdown converts Markdown to a React element tree without
 * using dangerouslySetInnerHTML, so untrusted HTML in the source is NOT
 * executed. Raw HTML passthrough is disabled by the library's default
 * (disallowedElements / skipHtml behaviour). javascript: protocol links are
 * also blocked by react-markdown's built-in URL sanitiser.
 */
export function NoteBody({ body, className }: NoteBodyProps) {
  return (
    <div className={className}>
      <ReactMarkdown>{body}</ReactMarkdown>
    </div>
  );
}
