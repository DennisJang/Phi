# Project Phi — Status

> Read this FIRST at the start of every new conversation.
> Updated at the end of each working session by Claude.
> Last updated: 2026-04-10 (post Step 4c: user upload pipeline)

---

## Current position

- **Phase**: 1 — 3D Object Fidelity
- **Week**: 1 (Day 2, five PRs merged into main today)
- **Gate target**: Cover auto-mapping from 3 sources + auto spine + Phi System coded + Aladin minimal + manual add minimal + iPad landscape 60fps

## Sessions completed today (2026-04-10)

Five feature branches merged to main in one working day:

1. **feat/p1-phi-system** — codified the Phi System under `lib/phi/`
   (ratios, typography, colors, spacing, blocks, constraints). Six files,
   single source of truth for every ratio, color, and block type in the app.

2. **feat/p1-db-redesign** — applied the full redesign migration to the
   Supabase dev project. Dropped 5 deprecated tables, reshaped profiles
   and books, created 5 new tables, rewrote 12 RLS policies, added the
   get_shelf_signal SECURITY DEFINER function, created 8 indexes.

3. **feat/p1-landscape-rebuild** — LandscapeGuard + spine-on shelf view +
   full Tailwind integration with PHI_DARK + warm background adoption +
   legacy token cleanup.

4. **feat/p1-cover-proxy** — `/api/cover-proxy` route that fetches
   remote book covers, converts to WebP via sharp, extracts dominant
   color via four-corner pixel sampling, and uploads to the Supabase
   `covers` bucket. Pure transformer, no in-route caching. Tested
   end-to-end against an Aladin HTTPS cover URL on Vercel production.

5. **feat/p1-cover-upload** — `/api/cover-upload` route for authenticated
   user file uploads. Reuses `processImage()` from 4b. Introduces
   Supabase anonymous sign-in as the Phase 1 identity layer, with an
   in-flight-deduped `ensureAnonymousSession()` helper and an
   `AnonymousBootstrap` client component mounted in the root layout.
   Storage writes go through the cookie-bound server client so RLS
   enforces `covers/{user_id}/{sha1}.webp` isolation. End-to-end
   verified via `/dev/upload` scratch form: success path, idempotency,
   413 (too large), 422 (MIME lie caught by sharp), and cross-user
   folder isolation.
6. **feat/p1-cover-letterbox** — Step 4e: book height φ-derived
   (thickness decoupled), CoverMaterial shader with letterbox +
   dominantColor fill, coverPipeline.ts client adapter with 4-corner
   sampling, BookModel front face uses CoverMaterial when URL
   provided. Visual verification passed on Guns Germs Steel cover:
   letterbox bands present, color extraction working, back/spine
   retain PBR lighting. 57 FPS. useCoverTexture.ts removed.
   

## Last completed (carried over from old Phase 1)

- [x] Project planning and architecture design
- [x] Tech stack locked: Next.js + R3F + Supabase + Vercel + Capacitor
- [x] Supabase "Phi" project created (Tokyo, trbeccbsjnxdkzxlecvv)
- [x] DB schema applied: Phi 1.0 redesign (2026-04-10)
- [x] Storage: only `covers` bucket remains (5 legacy buckets removed)
- [x] GitHub repo DennisJang/Phi
- [x] Vercel deployment: https://phi-xi-eight.vercel.app
- [x] R3F + Three.js stack installed
- [x] PBR material presets
- [x] Procedural BookModel (4 meshes, spine-hinge origin)
- [x] BookshelfScene with warm lighting + environment + shadow catcher
- [x] PerfPanel dev-only

## Phase 1 Gate progress

- [x] **Step 1**: R3F Canvas + lighting (done)
- [x] **Step 2**: Procedural book geometry (done)
- [x] **Step 3**: PBR materials (done)
- [ ] **Step 4**: Cover mapping pipeline — THREE SOURCES
  - [x] 4a: URL → Texture loading (done, legacy)
  - [x] **4b**: `/api/cover-proxy` + dominant color extraction (done 2026-04-10)
  - [x] **4c**: User upload → Supabase Storage → texture pipeline **(DONE 2026-04-10)**
  - [ ] 4d: Typographic generation fallback (canvas-based)
 - [x] 4e: Letterbox compositor (shader, done 2026-04-11)
  - [ ] 4f: All three sources produce consistent 3D output
- [ ] ~~**Step 5** (old): Book open animation~~ **ABANDONED 2026-04-10**
- [ ] **Step 5** (new): Auto spine generation (author · title · Φ)
  - [ ] 5a: Canvas-based spine texture generator
  - [ ] 5b: Font loading (serif for title, sans for author)
  - [ ] 5c: Apply to spine mesh, verify readable at shelf distance
- [ ] **Step 6**: Aladin API minimal integration
  - [ ] 6a: Route handler `/api/aladin/search?q={query}`
  - [ ] 6b: Returns multiple editions (ISBNs) for user selection
  - [ ] 6c: Proxy selected cover URL through cover pipeline
- [ ] **Step 7**: Manual book add flow
  - [ ] 7a: Form for title/author/ISBN/cover upload
  - [ ] 7b: Falls back to typographic generation if no cover uploaded
- [x] **Step 8**: Phi System (§17) codified
  - [x] 8a: `lib/phi/ratios.ts` (PHI constants, SHELF_YAW_RAD)
  - [x] 8b: `lib/phi/typography.ts` (5 roles, 2 typefaces)
  - [x] 8c: `lib/phi/colors.ts` (Phi Dark palette, bgCanvas = warm #1A1612)
  - [x] 8d: `lib/phi/spacing.ts` (3-step scale)
  - [x] 8e: `lib/phi/blocks.ts` (7 block types, BookPageContent schema)
  - [x] 8f: `lib/phi/constraints.ts` (exhaustive manifest)
  - [x] 8g: Tailwind config imports from lib/phi/ (no hardcoded tokens)
- [x] **Step 9**: Landscape orientation enforcement
  - [x] 9a: LandscapeGuard component — portrait unmounts Canvas entirely
  - [x] 9b: Bilingual portrait overlay (ko + en)
  - [x] 9c: Verified in DevTools Device Mode
- [ ] **Step 10**: Real iPad test
  - [ ] 10a: Measure FPS on actual device (owner needs physical iPad)
  - [ ] 10b: If < 60fps, optimize before gate closure

## Immediate next tasks (order matters)

1. Step 4d — Typographic cover generator (canvas-based fallback)
2. Step 5  — Spine texture generator
3. Step 6  — Aladin API
4. Step 7  — Manual book add (remove DEV_TEST_COVER_URL here)


## Performance baseline (measured 2026-04-10, after landscape rebuild)

Scene: 1 book, 4 meshes, 86 triangles, 8 draw calls

| Environment | FPS | CPU frame | GPU frame |
|---|---|---|---|
| Desktop Chrome, no throttling | 60 | ~2.8ms | ~1.9ms |
| DevTools iPad Air viewport, CPU 4x slow | ~50 | ~15ms | ~3.1ms |

Cover proxy round-trip (first call, no cache):
- Aladin HTTPS cover (66 KB JPEG) → ~900ms total in Vercel production
  - Fetch: ~530ms
  - sharp decode + corner sampling + WebP encode: ~250ms
  - Supabase Storage upload: ~120ms

Cover upload round-trip (Codespaces dev, 200-500 KB JPEG):
- Local processing dominated by sharp: ~250-400ms
- Storage upload: ~100-200ms
- Total: ~500-700ms from POST to JSON response

Baseline will be re-measured after spine generator (Step 5) and
letterbox compositor (Step 4e) add more textures to the scene.

## Key learnings (kept short, used as future debugging tools)

These joined the project's permanent toolkit during Steps 4b and 4c.
Each is phrased so it can be applied to a future situation that *looks
unrelated* but shares the same shape.

- **Step 3a's "one rotation axis at a time"** — when debugging 3D
  rotations, vary one axis only and confirm the visual before touching
  the next. Trying two at once makes debugging impossible.

- **Environment variable values must be inspected with `JSON.stringify`**.
  Plain `console.log` hides leading/trailing whitespace, newlines, or
  literal angle brackets that come from Markdown auto-link formatting.
  The `<https://...>` infection on `.env.local` was invisible until
  stringified. Length comparison against the expected string is also
  cheap and devastatingly effective.

- **The truth source for an external library is `node_modules/<pkg>/**/*.d.ts`,
  not the README**. Documentation can advertise unreleased versions
  (colorthief v3 was on lokeshdhakar.com but only v2 was on npm). When
  in doubt, read the actual installed types. Three places must agree:
  README + `npm view <pkg>` + installed `.d.ts`. If they disagree,
  trust the installed file.

- **The right tool is the simplest tool that fits the problem's
  structure, not the most sophisticated one**. colorthief's MMCQ was
  overkill for book covers, where the background color lives at the
  edges by design. Sampling four corners and averaging beats a
  general-purpose perceptual quantizer because it matches the actual
  data structure. The signal: when a "more advanced" library introduces
  more failure modes than it solves, the problem may have been simpler
  than the library.

- **Long debugging sessions are usually environment, not code**. Of the
  five hurdles in Step 4b — legacy bucket cleanup, RLS reset, env var
  infection, colorthief version hallucination, colorthief Buffer-input
  failure — only one was a code-logic mistake. The other four were
  external environment or external package quirks. When stuck, suspect
  the environment first.

- **Production-like testing closes ambiguity faster than perfect local
  debugging**. The Codespaces TLS issue with `example.com` caused real
  alarm, but Vercel's environment had no such problem and the same
  Aladin URL worked on first try. Push to a preview deployment as soon
  as the local code passes type-check; don't try to make every local
  edge case green before shipping.

- **(NEW, Step 4c) Strict Mode is not the bug, undefended effects are**.
  When useEffect kicks off a side effect that writes to a shared
  resource (DB, server), a per-effect `cancelled` flag only blocks
  React state updates — the in-flight network request still completes.
  The correct defense is de-duplication at the call site: a
  module-level in-flight promise that all callers await. This pattern
  is also what protects against Suspense, streaming, concurrent mount,
  and accidental double-invocation in production. Any future helper
  that "should only happen once per browser session" needs this shape.

- **(NEW, Step 4c) Next.js dev server does not always hot-reload new
  API routes**. Adding `app/api/<x>/route.ts` sometimes requires a
  full `npm run dev` restart for Next.js to register it. If a new
  route returns 404 when the file clearly exists, suspect the dev
  server state before suspecting the code.

- **(NEW, Step 4c) The App Router's "one route.ts per directory" rule
  is silent but absolute**. Placing a second `route.ts` in a directory
  that already has one does not error — the second file is simply
  ignored. When adding a new API route, always create a new directory.

- **(NEW, Step 4c) Client Content-Type is never a security boundary**.
  The shallow validation layer (declared MIME, declared size) is only
  there to fail honest mistakes cheaply. The real boundary is whatever
  actually decodes the bytes — sharp in our case. A `.txt` file with
  `Content-Type: image/png` passed the shallow layer and was correctly
  caught by sharp with `decode_failed`. Any future upload route must
  rely on a decoder for security, not on headers.

- **(NEW, Step 4c) RLS is the source of truth, not application code**.
  Once the `covers_user_insert_own_folder` policy was in place, the
  upload route did not need to verify `path startsWith user_id` in TS.
  The policy enforces it at the database level. Re-implementing the
  check in application code would just add a place for the two
  definitions to drift.

## Known issues (carried over)

- **Next.js 14.2.35 audit vulnerability** — deferred to Phase 1 gate
  closure, known DoS + HTTP smuggling
- **No PWA icons yet** — defer to Phase 4
- **VS Code `@tailwind` rule warning** — resolved by `.vscode/settings.json`
- **Case-sensitivity gotcha** — always match import casing exactly
  (Linux/Vercel)
- **BookModel dimensions are not φ-derived** — current 1.4 × 2.0 × 0.25
  ratio ≠ φ:1. PROJECT_KNOWLEDGE.md §6.1 requires Height:Width = φ:1.
  Defer to Step 4e (letterbox compositor will touch these dimensions).
- **OrbitControls still active on /bookshelf** — Phase 1 dev convenience.
  Replace with custom gesture handlers at Phase 2 start.
- **`drag to inspect · scroll to zoom` hint text** is Phase 1 dev-era
  copy. Phase 2 should change to "tap to open · swipe to browse" once
  gesture handlers replace OrbitControls.

## Known issues (from Step 4b, still open)

- **Next.js "Failed to generate cache key" warning** on every cover-proxy
  response. Harmless — Next.js's internal cache layer trying and failing
  to key on the response. No effect on our output. Investigate during
  Phase 1 gate review.
- **HTTP 502 catch-all maps both DNS failures and upstream HTTP 4xx/5xx**.
  Semantically a GitHub raw 404 ("they answered, just with no") is
  different from `getaddrinfo ENOTFOUND` ("could not even ask"), but
  cover-proxy collapses both to 502. Acceptable for Phase 1; may want
  to differentiate in Step 6 when callers need to distinguish.
- **`error.cause` (the underlying Node-level error) is not propagated**
  in cover-proxy responses. The route returns `{ kind, message }` but
  the deep TLS / DNS / certificate detail stays in server logs only.
- **SSRF defense is not in place** — cover-proxy will fetch any
  http(s) URL it is handed. Phase 1 is safe because URL sources are
  internal (Aladin/Google Books API responses), but Step 6 should add
  an allowlist of known image CDN domains before user-supplied URLs
  become a vector.
- **Codespaces TLS root CA gap** — `https://example.com` fetch fails
  in Codespaces with `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, while picsum
  / Aladin / Vercel all work fine. Local-only quirk; doesn't affect
  production.

## Known issues (new from Step 4c)

- **`/dev/upload` is a scratch page, not a Phase 1 deliverable**.
  It lives at `app/dev/upload/page.tsx` and will be deleted at the
  Phase 1 gate, or replaced by the real BookAddDialog flow in Step 7 —
  whichever comes first. Its styling is intentionally ugly (inline
  styles, no Phi tokens) to discourage anyone from treating it as
  real UI.
- **Anonymous sign-in has no rate limit** — a malicious client can
  mint many anonymous users by clearing cookies between requests.
  Each `auth.users` row is cheap but not free. Phase 2 will add real
  auth + Vercel edge rate limiting; Phase 1 accepts the risk because
  the attack surface is dev-only.
- **Anonymous user cleanup is not automated**. `auth.users` rows with
  `is_anonymous = true` accumulate across dev sessions. Manual cleanup
  during Step 4c debugging via MCP `delete from auth.users where
  is_anonymous = true`. Phase 2 or before Phase 1 gate: add a
  scheduled cleanup for stale anonymous users (e.g., >7 days old with
  no linked identity).
- **`getSession()` vs `getUser()` subtlety** — our server route uses
  `getUser()` for verification (JWT signature checked), while client
  code can use `getSession()` (local cookie parse). Future routes
  must not confuse the two; decision to authorize must always come
  from `getUser()`.
- **Content-addressed storage has no garbage collection**. Each unique
  `{user_id}/{sha1}.webp` stays forever. When Phase 2 adds book
  deletion, dangling Storage objects will accumulate unless deletion
  also removes the object. Track when implementing book deletion.
- **`next.config.js` has a legacy `image.aladin.co.kr` remotePattern**
  left over from Step 4a's direct-loading approach. Can be removed
  during Phase 1 gate review now that the only client-facing cover
  URLs are Supabase CDN.
## Known issues (new from Step 4e)

- **Edge-matched letterbox 재검토 (Phase 2)** — Current letterbox
  fills with a single dominantColor averaged from 4 corners. On
  covers with strongly contrasting top/bottom bands (e.g. Guns Germs
  Steel: white NYT header + dark bottom band), the averaged midtone
  matches neither edge and the "melts into the book" effect is
  weaker. Sample size is 1 — need more covers before deciding whether
  to evolve to edge-matched letterbox (top letterbox samples top row,
  bottom samples bottom row). Revisit at Phase 2 start.
- **Front cover loses PBR lighting** — ShaderMaterial on front face
  doesn't respond to the scene's warm key light. Back/spine still
  PBR-lit so overall tone is preserved. Monitor on a full shelf
  (Phase 2); if discontinuity is visible, port CoverMaterial to
  onBeforeCompile-patched meshStandardMaterial.
- **useCoverTexture.ts deleted** — Replaced by coverPipeline.
  Nothing else referenced it (grep-verified).
- **DEV_TEST_COVER_URL hardcoded in BookshelfScene** — Remove in
  Step 7 when the real add-book flow provides URLs from DB.
## Environment notes

- **Dev**: GitHub Codespaces, Linux, case-sensitive
- **Supabase**: anon key + URL + service_role key all set in Vercel env
  vars (production + preview + dev). Service role added 2026-04-10
  during Step 4b.
- **Supabase Auth**: **anonymous sign-in enabled 2026-04-10** during
  Step 4c (dashboard → Authentication → Providers → Anonymous).
- **`.env.local` discipline**: copy values raw, never inside Markdown
  auto-link `<...>` brackets. The infection happened at least once and
  cost an hour of debugging.
- **Auth providers**: only anonymous sign-in active. Google OAuth +
  email magic link planned for Phase 2 start. Anonymous identities
  can be linked to real ones via `supabase.auth.linkIdentity()`.
- **Real iPad**: still not acquired — owner needs to confirm purchase
  timeline. Phase 1 gate cannot fully close without it.
- **Aladin TTB key**: owner is in the process of registering at
  aladin.co.kr (needed for Step 6).

## Decisions pending

- **Real iPad acquisition** — blocks final Phase 1 gate verification
- **Aladin TTB key registration** — blocks Step 6 (in progress)
- **Custom domain** — safehomepro.co.kr owned but name mismatch. Defer
  to Phase 4. Consider phi-specific domain.
- **Donation recipient organization** — Phase 4 decision
- **Kakao Login integration** — Phase 3 decision
- **Font loading strategy** — Cormorant Garamond (serif) + Pretendard
  (sans-serif) via next/font or self-hosted? Decide at Step 5.
- **Server-side canvas library for Step 4d** — `@napi-rs/canvas`,
  `node-canvas`, or `@vercel/og`-style approach? Decide at Step 4d
  start. Verify Vercel compat first.
- **Anonymous user cleanup strategy** — scheduled function vs manual
  during Phase 1. Decide before Phase 1 gate.
- **Logo and copy finalization** — deferred. Current Φ mark is
  provisional.