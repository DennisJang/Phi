'use client';

import { useState } from 'react';
import { useAnonymousSession } from '@/components/auth/AnonymousBootstrap';

/**
 * Temporary dev-only upload form for Step 4c verification.
 *
 * Not part of Phase 1 deliverables. Lives at /dev/upload purely so
 * we can exercise /api/cover-upload end-to-end with real files
 * before Step 4e wires the result into the 3D scene.
 *
 * Design intentionally minimal: no Phi tokens, no design discipline,
 * no error UX. The output is the raw JSON response so we can verify
 * shape parity with /api/cover-proxy and inspect dominant color and
 * dimensions visually.
 *
 * Will be deleted at the Phase 1 gate, or replaced by the real
 * BookAddDialog flow in Step 7 — whichever comes first.
 */

type UploadState =
  | { status: 'idle' }
  | { status: 'uploading' }
  | { status: 'success'; payload: unknown }
  | { status: 'error'; httpStatus: number; payload: unknown };

export default function DevUploadPage() {
  const session = useAnonymousSession();
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<UploadState>({ status: 'idle' });

  const sessionReady = session.status === 'ready';
  const canUpload = sessionReady && file !== null && state.status !== 'uploading';

  async function handleUpload() {
    if (!file) return;
    setState({ status: 'uploading' });

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/cover-upload', {
        method: 'POST',
        body: formData,
      });
      const payload = await response.json();

      if (response.ok) {
        setState({ status: 'success', payload });
      } else {
        setState({ status: 'error', httpStatus: response.status, payload });
      }
    } catch (err) {
      setState({
        status: 'error',
        httpStatus: 0,
        payload: { kind: 'fetch_failed', message: err instanceof Error ? err.message : String(err) },
      });
    }
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'monospace', maxWidth: '720px' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
        /dev/upload — Step 4c verification
      </h1>

      <section style={{ marginBottom: '1.5rem', padding: '0.75rem', border: '1px solid #444' }}>
        <strong>Session:</strong>{' '}
        {session.status === 'loading' && 'loading...'}
        {session.status === 'ready' && (
          <>
            ready · userId={session.userId.slice(0, 8)}... · anonymous=
            {String(session.isAnonymous)}
          </>
        )}
        {session.status === 'error' && <>error: {session.message}</>}
      </section>

      <section style={{ marginBottom: '1.5rem' }}>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setState({ status: 'idle' });
          }}
          disabled={!sessionReady}
        />
        {file && (
          <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', opacity: 0.8 }}>
            {file.name} · {file.type} · {(file.size / 1024).toFixed(1)} KB
          </div>
        )}
      </section>

      <section style={{ marginBottom: '1.5rem' }}>
        <button
          type="button"
          onClick={handleUpload}
          disabled={!canUpload}
          style={{
            padding: '0.5rem 1rem',
            cursor: canUpload ? 'pointer' : 'not-allowed',
            opacity: canUpload ? 1 : 0.4,
          }}
        >
          {state.status === 'uploading' ? 'Uploading...' : 'POST /api/cover-upload'}
        </button>
      </section>

      {state.status === 'success' && (
        <section
          style={{
            padding: '1rem',
            border: '1px solid #4a7',
            background: '#0a1a0e',
          }}
        >
          <strong style={{ color: '#7fc' }}>200 OK</strong>
          <pre style={{ marginTop: '0.5rem', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(state.payload, null, 2)}
          </pre>
          {isUploadSuccess(state.payload) && (
            <div style={{ marginTop: '1rem' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  background: state.payload.data.dominantColor,
                  border: '1px solid #888',
                  display: 'inline-block',
                  verticalAlign: 'middle',
                  marginRight: '0.75rem',
                }}
              />
              <span style={{ verticalAlign: 'middle' }}>
                dominantColor swatch
              </span>
              <div style={{ marginTop: '0.75rem' }}>
                <img
                  src={state.payload.data.url}
                  alt="uploaded cover"
                  style={{ maxWidth: '300px', border: '1px solid #444' }}
                />
              </div>
            </div>
          )}
        </section>
      )}

      {state.status === 'error' && (
        <section
          style={{
            padding: '1rem',
            border: '1px solid #a44',
            background: '#1a0a0a',
          }}
        >
          <strong style={{ color: '#fc7' }}>HTTP {state.httpStatus}</strong>
          <pre style={{ marginTop: '0.5rem', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(state.payload, null, 2)}
          </pre>
        </section>
      )}
    </main>
  );
}

// Type guard so the success branch can render dominantColor + url
// without resorting to `any`.
function isUploadSuccess(
  payload: unknown
): payload is { ok: true; data: { url: string; dominantColor: string; width: number; height: number } } {
  if (typeof payload !== 'object' || payload === null) return false;
  const p = payload as Record<string, unknown>;
  if (p.ok !== true) return false;
  const d = p.data as Record<string, unknown> | undefined;
  if (!d) return false;
  return (
    typeof d.url === 'string' &&
    typeof d.dominantColor === 'string' &&
    typeof d.width === 'number' &&
    typeof d.height === 'number'
  );
}