import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { generateTypographicCover } from '@/lib/three/typographicCover';
import { processImage } from '@/lib/image/processImage';
import { hashImageBytes } from '@/lib/image/hash';

export const runtime = 'nodejs';

const InputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  author: z.string().trim().min(1).max(200),
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

  // Render PNG (deterministic)
  let pngBuffer: Buffer;
  try {
    pngBuffer = generateTypographicCover(parsed.data).buffer;
  } catch (err) {
    console.error('[cover-generate] render failed', err);
    return NextResponse.json(
      { ok: false, error: { kind: 'render_failed' } },
      { status: 500 },
    );
  }

  // Standard pipeline (parity with cover-proxy + cover-upload)
  const result = await processImage(pngBuffer);
  if (!result.ok) {
    console.error('[cover-generate] processImage failed', result.error);
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
    console.error('[cover-generate] upload failed', uploadError);
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