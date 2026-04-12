import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

// ============================================================================
// /api/dev/login
//
// Purpose
// -------
// Mint an authenticated session cookie for a fixed developer account
// (Dennis, email configured out-of-band in Supabase Auth). This enables
// dev-only flows like /dev/seed to run against the same RLS policies that
// real users hit in production — no service_role bypass, no branch in
// downstream API routes.
//
// Flow
// ----
// 1. Hard-gate on NODE_ENV !== 'development'  → 404.
// 2. Hard-gate on missing DEV_FIXED_USER_ID   → 404.
//    (Vercel prod has neither, so the route returns 404 on any public
//    deploy regardless of how someone discovers the URL.)
// 3. Resolve the user's email via admin.getUserById() — we refuse to
//    trust the env to match an actual auth.users row, since a stale
//    UUID would silently succeed at magiclink generation but fail on
//    verifyOtp. Better to fail loudly early.
// 4. Generate a magiclink via admin.generateLink({ type: 'magiclink' })
//    — this returns a URL whose hash fragment contains a single-use
//    token_hash.
// 5. Parse the token_hash out of the URL, then call verifyOtp() through
//    the cookie-bound server client. @supabase/ssr writes the session
//    cookie into the response stream automatically.
// 6. Return { ok: true, userId, email } on success.
//
// Why a magiclink round-trip instead of a direct session mint
// -----------------------------------------------------------
// The Supabase JS SDK exposes admin.createUser() and admin.generateLink()
// but not admin.createSession(). magiclink generation is the officially
// supported way for a server with service_role to produce a token that
// a session-bound client can exchange for cookies. It costs one extra
// verifyOtp round-trip, all within the same process.
//
// Safety notes
// ------------
// - Service-role key never leaves this server process; it is read from
//   the admin client factory and discarded after use.
// - If DEV_FIXED_USER_ID points at a non-existent user, we 500 with a
//   specific error kind — this surfaces misconfiguration during initial
//   setup instead of degrading to a confusing 401 later.
// - Rate limiting is deferred: in dev only, with a single known operator,
//   we rely on Supabase's built-in admin API throttle.
// ============================================================================

type LoginResult =
  | { ok: true; userId: string; email: string; isAnonymous: false }
  | {
      ok: false;
      error: {
        kind:
          | 'not_dev'
          | 'env_missing'
          | 'user_not_found'
          | 'magiclink_failed'
          | 'token_parse_failed'
          | 'verify_failed';
        message: string;
      };
    };

export async function POST() {
  // Gate 1: non-dev → 404, as if the route doesn't exist.
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  // Gate 2: missing env → 404, same posture.
  const fixedUserId = process.env.DEV_FIXED_USER_ID;
  if (!fixedUserId) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const admin = createAdminClient();

  // Resolve the user — we want a loud, actionable error if the UUID is
  // stale, not a silent downstream verifyOtp failure.
  const { data: userData, error: userErr } = await admin.auth.admin.getUserById(fixedUserId);
  if (userErr || !userData.user) {
    const result: LoginResult = {
      ok: false,
      error: {
        kind: 'user_not_found',
        message:
          userErr?.message ??
          `No auth.users row for DEV_FIXED_USER_ID=${fixedUserId}. Create the account in Supabase Studio first.`,
      },
    };
    return NextResponse.json(result, { status: 500 });
  }

  const email = userData.user.email;
  if (!email) {
    const result: LoginResult = {
      ok: false,
      error: {
        kind: 'user_not_found',
        message: `User ${fixedUserId} has no email address; dev-login requires an email account.`,
      },
    };
    return NextResponse.json(result, { status: 500 });
  }

  // Generate a magiclink. We never navigate to the link — we only want
  // the token_hash embedded in its URL.
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  });

  if (linkErr || !linkData.properties) {
    const result: LoginResult = {
      ok: false,
      error: {
        kind: 'magiclink_failed',
        message: linkErr?.message ?? 'generateLink returned no properties',
      },
    };
    return NextResponse.json(result, { status: 500 });
  }

  // The SDK exposes hashed_token on properties — that is the token_hash
  // verifyOtp() expects. (The action_link is the full URL with the same
  // token as a query fragment, which we could also parse, but the
  // hashed_token field is the documented direct path.)
  const tokenHash = linkData.properties.hashed_token;
  if (!tokenHash) {
    const result: LoginResult = {
      ok: false,
      error: {
        kind: 'token_parse_failed',
        message: 'generateLink returned no hashed_token',
      },
    };
    return NextResponse.json(result, { status: 500 });
  }

  // Exchange the token for a cookie-bound session. @supabase/ssr's
  // createClient wires cookie writes into the Next.js response stream,
  // so a successful verifyOtp here means Set-Cookie headers leave with
  // this response.
  const supabase = await createClient();
  const { data: verifyData, error: verifyErr } = await supabase.auth.verifyOtp({
    type: 'magiclink',
    token_hash: tokenHash,
  });

  if (verifyErr || !verifyData.user) {
    const result: LoginResult = {
      ok: false,
      error: {
        kind: 'verify_failed',
        message: verifyErr?.message ?? 'verifyOtp returned no user',
      },
    };
    return NextResponse.json(result, { status: 500 });
  }

  const result: LoginResult = {
    ok: true,
    userId: verifyData.user.id,
    email,
    isAnonymous: false,
  };
  return NextResponse.json(result);
}