'use client';

import { useMemo, useState, type ChangeEvent } from 'react';

// ============================================================================
// /dev/seed — Dev-only batch seed UI
//
// Single-gated: the underlying /api/dev/seed route returns 404 outside
// development. The route's gate is the authoritative defense; the page
// itself renders normally in any environment but its actions silently
// fail with HTTP 404 if the route is not present.
//
// We intentionally do NOT guard this component with notFound() at module
// load time — client components in Next.js 14.2.35 do not support that
// pattern reliably and it manifests as a hard 404 for the page even in
// dev mode. The route-level gate is sufficient for security.
//
// This is explicitly a scratch UI — no i18n, no Phi design tokens, no
// error boundary. When the real add-book flow ships (Step 7) this
// route should be deleted along with /api/dev/seed. Until then the
// coarse styling serves as a visual marker of "this is not a product
// surface".
// ============================================================================

type ResultState =
  | { status: 'idle' }
  | { status: 'running' }
  | {
      status: 'done';
      deletedPriorCount: number;
      succeeded: Array<{
        index: number;
        bookId: string;
        title: string;
        coverUrl: string;
        spineUrl: string;
      }>;
      failed: Array<{
        index: number;
        title: string;
        error: { kind: string; message: string };
      }>;
    }
  | { status: 'error'; message: string };

const PLACEHOLDER_MANIFEST = `{
  "books": [
    {
      "title": "어린 왕자",
      "author": "생텍쥐페리",
      "language": "ko",
      "coverFilename": "01.jpg"
    }
  ]
}`;

export default function DevSeedPage() {
  const [manifestText, setManifestText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<ResultState>({ status: 'idle' });

  const manifestPreview = useMemo(() => parseManifestPreview(manifestText), [manifestText]);
  const fileNames = useMemo(() => new Set(files.map((f) => f.name)), [files]);

  const coverage = useMemo(() => {
    if (!manifestPreview.ok) return null;
    const missingFromFiles: string[] = [];
    const unusedFiles: string[] = [];
    const manifestFilenames = new Set(manifestPreview.books.map((b) => b.coverFilename));

    for (const entry of manifestPreview.books) {
      if (!fileNames.has(entry.coverFilename)) {
        missingFromFiles.push(entry.coverFilename);
      }
    }
    for (const name of fileNames) {
      if (!manifestFilenames.has(name)) {
        unusedFiles.push(name);
      }
    }
    return { missingFromFiles, unusedFiles };
  }, [manifestPreview, fileNames]);

  const canSubmit =
    manifestPreview.ok &&
    manifestPreview.books.length > 0 &&
    coverage !== null &&
    coverage.missingFromFiles.length === 0 &&
    result.status !== 'running';

  const onFilesChange = (e: ChangeEvent<HTMLInputElement>) => {
    const fl = e.target.files;
    if (!fl) return;
    setFiles(Array.from(fl));
  };

  const onSeed = async () => {
    if (!canSubmit) return;
    setResult({ status: 'running' });

    try {
      const fd = new FormData();
      fd.append('manifest', manifestText);
      for (const file of files) {
        fd.append('covers', file);
      }

      const response = await fetch('/api/dev/seed', {
        method: 'POST',
        body: fd,
      });

      const data = await response.json();

      if (!response.ok) {
        setResult({
          status: 'error',
          message: `HTTP ${response.status}: ${JSON.stringify(data)}`,
        });
        return;
      }

      setResult({
        status: 'done',
        deletedPriorCount: data.deletedPriorCount ?? 0,
        succeeded: data.succeeded ?? [],
        failed: data.failed ?? [],
      });
    } catch (err) {
      setResult({
        status: 'error',
        message: err instanceof Error ? err.message : String(err),
      });
    }
  };

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif', maxWidth: 900 }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Dev Seed — Reset & Reseed Dennis's Shelf</h1>
      <p style={{ color: '#888', marginBottom: 20, fontSize: 13 }}>
        This wipes ALL books owned by DEV_FIXED_USER_ID, then inserts the manifest entries.
        The /api/dev/seed route is dev-only (NODE_ENV gate) — in prod, the action silently 404s.
      </p>

      <section style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>
          1. Manifest JSON
        </label>
        <textarea
          value={manifestText}
          onChange={(e) => setManifestText(e.target.value)}
          placeholder={PLACEHOLDER_MANIFEST}
          rows={16}
          spellCheck={false}
          style={{
            width: '100%',
            fontFamily: 'ui-monospace, monospace',
            fontSize: 13,
            padding: 10,
            border: '1px solid #444',
            background: '#1a1a1a',
            color: '#e0e0e0',
            borderRadius: 4,
          }}
        />
        <div style={{ fontSize: 12, marginTop: 6 }}>
          {manifestPreview.ok ? (
            <span style={{ color: '#7bc47f' }}>
              ✓ Valid — {manifestPreview.books.length} book(s)
            </span>
          ) : manifestText.trim().length === 0 ? (
            <span style={{ color: '#888' }}>Paste manifest JSON.</span>
          ) : (
            <span style={{ color: '#e07b7b' }}>✗ {manifestPreview.error}</span>
          )}
        </div>
      </section>

      <section style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>
          2. Cover images ({files.length} selected)
        </label>
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={onFilesChange}
        />
        {coverage && (
          <div style={{ fontSize: 12, marginTop: 8 }}>
            {coverage.missingFromFiles.length > 0 && (
              <div style={{ color: '#e07b7b' }}>
                ✗ Missing files for: {coverage.missingFromFiles.join(', ')}
              </div>
            )}
            {coverage.unusedFiles.length > 0 && (
              <div style={{ color: '#d0a050' }}>
                ! Unused files (not in manifest): {coverage.unusedFiles.join(', ')}
              </div>
            )}
            {coverage.missingFromFiles.length === 0 && coverage.unusedFiles.length === 0 && (
              <div style={{ color: '#7bc47f' }}>✓ All manifest entries have files.</div>
            )}
          </div>
        )}
      </section>

      <section style={{ marginBottom: 24 }}>
        <button
          onClick={onSeed}
          disabled={!canSubmit}
          style={{
            padding: '10px 20px',
            fontSize: 14,
            fontWeight: 600,
            background: canSubmit ? '#c04040' : '#444',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
          }}
        >
          {result.status === 'running' ? 'Running…' : 'Reset & Seed'}
        </button>
        <span style={{ marginLeft: 12, fontSize: 12, color: '#888' }}>
          Destructive. Wipes existing books before insert.
        </span>
      </section>

      <ResultView result={result} />
    </main>
  );
}

function ResultView({ result }: { result: ResultState }) {
  if (result.status === 'idle') return null;

  if (result.status === 'running') {
    return <p style={{ color: '#888' }}>Seeding in progress…</p>;
  }

  if (result.status === 'error') {
    return (
      <div style={{ padding: 12, background: '#3a1010', color: '#f0c0c0', borderRadius: 4 }}>
        <strong>Request failed:</strong> {result.message}
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontSize: 16, marginBottom: 8 }}>Result</h2>
      <p style={{ fontSize: 13, marginBottom: 12 }}>
        Deleted prior: <strong>{result.deletedPriorCount}</strong> ·{' '}
        Inserted: <strong style={{ color: '#7bc47f' }}>{result.succeeded.length}</strong> ·{' '}
        Failed: <strong style={{ color: '#e07b7b' }}>{result.failed.length}</strong>
      </p>

      {result.succeeded.length > 0 && (
        <details open style={{ marginBottom: 12 }}>
          <summary style={{ cursor: 'pointer', color: '#7bc47f' }}>
            Succeeded ({result.succeeded.length})
          </summary>
          <ul style={{ fontSize: 12, marginTop: 6 }}>
            {result.succeeded.map((b) => (
              <li key={b.bookId} style={{ marginBottom: 4 }}>
                #{b.index} — {b.title}
                <br />
                <a href={b.coverUrl} target="_blank" rel="noreferrer" style={{ color: '#88b' }}>
                  cover
                </a>{' '}
                ·{' '}
                <a href={b.spineUrl} target="_blank" rel="noreferrer" style={{ color: '#88b' }}>
                  spine
                </a>
              </li>
            ))}
          </ul>
        </details>
      )}

      {result.failed.length > 0 && (
        <details open>
          <summary style={{ cursor: 'pointer', color: '#e07b7b' }}>
            Failed ({result.failed.length})
          </summary>
          <ul style={{ fontSize: 12, marginTop: 6 }}>
            {result.failed.map((b) => (
              <li key={b.index} style={{ marginBottom: 4 }}>
                #{b.index} — {b.title}
                <br />
                <code style={{ color: '#e07b7b' }}>
                  {b.error.kind}: {b.error.message}
                </code>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

type ManifestPreview =
  | { ok: true; books: Array<{ title: string; coverFilename: string }> }
  | { ok: false; error: string };

function parseManifestPreview(text: string): ManifestPreview {
  const trimmed = text.trim();
  if (trimmed.length === 0) return { ok: false, error: 'empty' };

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch (err) {
    return {
      ok: false,
      error: `JSON parse error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('books' in parsed) ||
    !Array.isArray((parsed as { books: unknown }).books)
  ) {
    return { ok: false, error: 'expected { books: [...] }' };
  }

  const books = (parsed as { books: unknown[] }).books;
  const preview: Array<{ title: string; coverFilename: string }> = [];

  for (let i = 0; i < books.length; i++) {
    const b = books[i];
    if (
      typeof b !== 'object' ||
      b === null ||
      typeof (b as { title?: unknown }).title !== 'string' ||
      typeof (b as { coverFilename?: unknown }).coverFilename !== 'string'
    ) {
      return { ok: false, error: `books[${i}] missing title or coverFilename` };
    }
    preview.push({
      title: (b as { title: string }).title,
      coverFilename: (b as { coverFilename: string }).coverFilename,
    });
  }

  return { ok: true, books: preview };
}