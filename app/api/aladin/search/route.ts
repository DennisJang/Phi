/**
 * GET /api/aladin/search?q=...&maxResults=10&start=1
 *
 * Auth-gated proxy for the Aladin TTB OpenAPI. Takes a user query,
 * returns an array of BookMetadata plus TTB attribution. The Aladin
 * response shape never crosses this boundary.
 *
 * Auth
 * ----
 * Phase 1 uses Supabase anonymous sign-in, so every real Phi user has
 * a session. This gate rejects only direct curl-without-cookies calls,
 * which is enough to prevent drive-by exhaustion of the 5,000/day TTB
 * quota by unrelated traffic. Phase 2 may add per-user rate limiting.
 *
 * Error mapping
 * -------------
 * Adapter errors are passed through verbatim on the `error` object so
 * the UI can display a meaningful message, but the HTTP status is
 * mapped to reflect the nature of the failure (502 for upstream
 * issues, 503 if TTB key is missing, 504 for timeout, 400 for query
 * validation, 401 for auth).
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { searchAladin } from '@/lib/aladin';
import type { AladinClientError } from '@/lib/aladin/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  q: z.string().trim().min(1).max(200),
  maxResults: z.coerce.number().int().min(1).max(20).optional(),
  start: z.coerce.number().int().min(1).max(100).optional(),
});

export async function GET(request: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) {
    return NextResponse.json(
      { ok: false, error: { kind: 'unauthenticated', message: 'sign in first' } },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const parsed = QuerySchema.safeParse({
    q: url.searchParams.get('q'),
    maxResults: url.searchParams.get('maxResults') ?? undefined,
    start: url.searchParams.get('start') ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: { kind: 'invalid_query', issues: parsed.error.flatten() },
      },
      { status: 400 },
    );
  }

  const result = await searchAladin(parsed.data.q, {
    maxResults: parsed.data.maxResults,
    start: parsed.data.start,
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: mapErrorToStatus(result.error.kind) },
    );
  }

  return NextResponse.json(result);
}

function mapErrorToStatus(kind: AladinClientError['kind']): number {
  switch (kind) {
    case 'missing_api_key':
      return 503;
    case 'invalid_query':
      return 400;
    case 'timeout':
      return 504;
    case 'network':
    case 'upstream_status':
    case 'upstream_error':
    case 'parse_failed':
    case 'shape_invalid':
      return 502;
    default:
      return 500;
  }
}