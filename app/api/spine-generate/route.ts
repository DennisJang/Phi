/**
 * POST /api/spine-generate (Step 5b)
 *
 * Input:  { title, author, coverBaseColor, language: 'ko' | 'en' }
 * Output: { ok: true, data: { url, dominantColor, width, height } }
 *
 * Pipeline (parity with /api/cover-generate):
 *   renderSpine (deterministic PNG) → processImage (sharp WebP + sample)
 *                                   → sha1 → RLS upload to covers bucket
 *
 * Auth: anonymous session OK (Phase 1 identity layer, Step 4c).
 * RLS:  path `covers/{user_id}/{sha1}.webp` — covers_user_insert_own_folder.
 *
 * Note: no explicit in-route cache. Storage dedup via content-addressed
 *       sha1 + upsert=true. Callers persist URL to books row.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { renderSpine } from '@/lib/three/spineGenerator';
import { processImage } from '@/lib/image/processImage';
import { hashImageBytes } from '@/lib/image/hash';

export const runtime = 'nodejs';

const InputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  author: z.string().trim().min(1).max(200),
  coverBaseColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  language: z.enum(['ko', 'en']),
});

export async function POST(req: Request) {
  // Parse body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: { kind: 'bad_json' } }, { status: 400 });
  }

  const parsed = InputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { kind: 'validation', issues: parsed.error.flatten() } },
      { status: 400 },
    );
  }

  // Auth (anonymous session OK — Phase 1 identity layer)
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return NextResponse.json({ ok: false, error: { kind: 'unauthorized' } }, { status: 401 });
  }
  const userId = userData.user.id;

  // Render PNG (deterministic, Result pattern)
  const renderResult = renderSpine(parsed.data);
  if (!renderResult.ok) {
    console.error('[spine-generate] render failed', renderResult.error);
    return NextResponse.json(
      { ok: false, error: renderResult.error },
      { status: 500 },
    );
  }

  // Standard pipeline (parity with cover-proxy / cover-upload / cover-generate)
  const result = await processImage(renderResult.png);
  if (!result.ok) {
    console.error('[spine-generate] processImage failed', result.error);
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 500 },
    );
  }
  const processed = result.data;

  // Content-addressed RLS-scoped upload
  const hash = hashImageBytes(processed.webpBuffer);
  const objectPath = `${userId}/${hash}.webp`;

  const { error: uploadError } = await supabase.storage
    .from('covers')
    .upload(objectPath, processed.webpBuffer, {
      contentType: 'image/webp',
      upsert: true,
    });

  if (uploadError) {
    console.error('[spine-generate] upload failed', uploadError);
    return NextResponse.json(
      { ok: false, error: { kind: 'upload_failed', message: uploadError.message } },
      { status: 500 },
    );
  }

  const { data: publicUrlData } = supabase.storage.from('covers').getPublicUrl(objectPath);

  return NextResponse.json({
    ok: true,
    data: {
      url: publicUrlData.publicUrl,
      dominantColor: processed.dominantColor,
      width: processed.width,
      height: processed.height,
    },
  });
}