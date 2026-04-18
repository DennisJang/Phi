/**
 * Low-level Aladin TTB API client.
 *
 * Responsibilities:
 *   1. Build the request URL with required parameters
 *   2. Fetch with timeout
 *   3. Parse JSON (strip BOM Aladin occasionally emits)
 *   4. Validate shape via zod
 *   5. Distinguish error envelope from success envelope
 *
 * The TTB key is read from process.env.ALADIN_TTB_KEY at call time
 * (not at module load) so that tests and unrelated server code can
 * run without it set.
 *
 * Endpoint note: Aladin's TTB service is served over HTTP, not HTTPS.
 * This is their published endpoint — not a Phi misconfiguration. The
 * request is server→Aladin (never browser-visible), so user data does
 * not traverse this link.
 */

import { AladinSearchResponseSchema, type AladinSearchResponse } from './schema';

const ALADIN_SEARCH_ENDPOINT = 'http://www.aladin.co.kr/ttb/api/ItemSearch.aspx';
const FETCH_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_RESULTS = 10;
const HARD_MAX_RESULTS = 20;

export type AladinClientError =
  | { kind: 'missing_api_key'; message: string }
  | { kind: 'invalid_query'; message: string }
  | { kind: 'timeout'; message: string }
  | { kind: 'network'; message: string }
  | { kind: 'upstream_status'; status: number; message: string }
  | { kind: 'parse_failed'; message: string }
  | { kind: 'shape_invalid'; message: string }
  | { kind: 'upstream_error'; code: number; message: string };

export type AladinClientResult =
  | { ok: true; data: AladinSearchResponse }
  | { ok: false; error: AladinClientError };

export interface AladinSearchParams {
  query: string;
  maxResults?: number;
  start?: number;
}

export async function searchAladinRaw(
  params: AladinSearchParams
): Promise<AladinClientResult> {
  const apiKey = process.env.ALADIN_TTB_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error: {
        kind: 'missing_api_key',
        message: 'ALADIN_TTB_KEY is not set in the environment',
      },
    };
  }

  const query = params.query.trim();
  if (!query) {
    return {
      ok: false,
      error: { kind: 'invalid_query', message: 'query is empty' },
    };
  }

  const maxResults = Math.min(
    Math.max(1, params.maxResults ?? DEFAULT_MAX_RESULTS),
    HARD_MAX_RESULTS,
  );
  const start = Math.max(1, params.start ?? 1);

  const url = new URL(ALADIN_SEARCH_ENDPOINT);
  url.searchParams.set('ttbkey', apiKey);
  url.searchParams.set('Query', query);
  url.searchParams.set('QueryType', 'Keyword');
  url.searchParams.set('MaxResults', String(maxResults));
  url.searchParams.set('start', String(start));
  url.searchParams.set('SearchTarget', 'Book');
  url.searchParams.set('output', 'js');
  url.searchParams.set('Version', '20131101');
  url.searchParams.set('Cover', 'Big');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { 'User-Agent': 'Phi/1.0 (+aladin-client)' },
    });
  } catch (err) {
    clearTimeout(timeoutId);
    const isAbort = err instanceof Error && err.name === 'AbortError';
    return {
      ok: false,
      error: isAbort
        ? { kind: 'timeout', message: `Timed out after ${FETCH_TIMEOUT_MS}ms` }
        : {
            kind: 'network',
            message: err instanceof Error ? err.message : String(err),
          },
    };
  }
  clearTimeout(timeoutId);

  if (!response.ok) {
    return {
      ok: false,
      error: {
        kind: 'upstream_status',
        status: response.status,
        message: `Aladin returned HTTP ${response.status}`,
      },
    };
  }

  // Aladin occasionally emits a UTF-8 BOM. Read as text and strip.
  let responseText: string;
  try {
    responseText = await response.text();
  } catch (err) {
    return {
      ok: false,
      error: {
        kind: 'network',
        message: err instanceof Error ? err.message : 'failed to read body',
      },
    };
  }
  const cleanText = responseText.replace(/^\uFEFF/, '').trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleanText);
  } catch (err) {
    return {
      ok: false,
      error: {
        kind: 'parse_failed',
        message: `Aladin response is not valid JSON: ${
          err instanceof Error ? err.message : String(err)
        }`,
      },
    };
  }

  const validation = AladinSearchResponseSchema.safeParse(parsed);
  if (!validation.success) {
    return {
      ok: false,
      error: {
        kind: 'shape_invalid',
        message: `Aladin response failed schema validation: ${validation.error.message}`,
      },
    };
  }

  const body = validation.data;
  if (body.errorCode !== undefined && body.errorCode !== 0) {
    return {
      ok: false,
      error: {
        kind: 'upstream_error',
        code: body.errorCode,
        message: body.errorMessage ?? `Aladin error code ${body.errorCode}`,
      },
    };
  }

  return { ok: true, data: body };
}