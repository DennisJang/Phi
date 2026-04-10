# Project Phi — Status

> Read this FIRST at the start of every new conversation.
> Updated at the end of each working session by Claude.
> Last updated: 2026-04-10 (post Step 4b: cover proxy)

---

## Current position

- **Phase**: 1 — 3D Object Fidelity
- **Week**: 1 (Day 2, four PRs merged into main today)
- **Gate target**: Cover auto-mapping from 3 sources + auto spine + Phi System coded + Aladin minimal + manual add minimal + iPad landscape 60fps

## Sessions completed today (2026-04-10)

Four feature branches were merged to main in one working day:

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
  - [x] **4b**: `/api/cover-proxy` + dominant color extraction **(DONE 2026-04-10)**
  - [ ] 4c: User upload → Supabase Storage → texture pipeline
  - [ ] 4d: Typographic generation fallback (canvas-based)
  - [ ] 4e: Letterbox compositor (offscreen canvas)
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

1. **Step 4d** — Typographic cover generator (canvas-based fallback)
   - Pure server-side canvas (`@napi-rs/canvas` or similar) — verify Vercel compat
   - Renders title (serif, center) + author (sans, bottom) on dominant color background
   - Golden-ratio layout with generous margins
   - Returns same `{ url, dominantColor, width, height }` shape as cover-proxy
2. **Step 4c** — User upload path → Supabase Storage → texture pipeline
   - Authenticated upload policy on `covers` bucket (upload to `{user_id}/...` folder)
   - Form with MIME + size validation client-side
   - Pipes through same processing as cover-proxy (sharp, four-corner color)
3. **Step 4e** — Letterbox compositor
   - Takes processed cover + dominant color → composites on book front face
   - Visual verification of "cover melts into book surface" effect
4. **Step 5** — Spine texture generator
5. **Step 6** — Aladin API integration (requires TTB key registration first)

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
- Local Codespaces is comparable when network conditions allow

Baseline will be re-measured after spine generator (Step 5) and
letterbox compositor (Step 4e) add more textures to the scene.

## Key learnings (kept short, used as future debugging tools)

These joined the project's permanent toolkit during Step 4b. Each is
phrased so it can be applied to a future situation that *looks
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

## Known issues (new from Step 4b)

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
  Fine for production but worth surfacing during dev when debugging
  upstream issues.
- **SSRF defense is not in place** — cover-proxy will fetch any
  http(s) URL it is handed. Phase 1 is safe because URL sources are
  internal (Aladin/Google Books API responses), but Step 6 should add
  an allowlist of known image CDN domains before user-supplied URLs
  become a vector.
- **Codespaces TLS root CA gap** — `https://example.com` fetch fails
  in Codespaces with `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, while picsum
  / Aladin / Vercel all work fine. Local-only quirk; doesn't affect
  production. If a future fetch starts failing locally, run
  `sudo update-ca-certificates` before assuming a code bug.

## Environment notes

- **Dev**: GitHub Codespaces, Linux, case-sensitive
- **Supabase**: anon key + URL + service_role key all set in Vercel env
  vars (production + preview + dev). Service role added 2026-04-10
  during Step 4b.
- **`.env.local` discipline**: copy values raw, never inside Markdown
  auto-link `<...>` brackets. The infection happened at least once and
  cost an hour of debugging.
- **Auth providers**: not configured yet, OK for Phase 1 (no auth), add
  Google OAuth at Phase 2 start
- **Real iPad**: still not acquired — owner needs to confirm purchase
  timeline. Phase 1 gate cannot fully close without it.
- **Aladin TTB key**: owner needs to register at aladin.co.kr (needed
  for Step 6 — register before that step)

## Decisions pending

- **Real iPad acquisition** — blocks final Phase 1 gate verification
- **Aladin TTB key registration** — blocks Step 6
- **Custom domain** — safehomepro.co.kr owned but name mismatch. Defer
  to Phase 4. Consider phi-specific domain.
- **Donation recipient organization** — Phase 4 decision
- **Kakao Login integration** — Phase 3 decision
- **Font loading strategy** — Cormorant Garamond (serif) + Pretendard
  (sans-serif) via next/font or self-hosted? Decide at Step 5.
- **Server-side canvas library for Step 4d** — `@napi-rs/canvas`,
  `node-canvas`, or `@vercel/og`-style approach? Decide at Step 4d
  start. Verify Vercel compat first.
- **Logo and copy finalization** — deferred. Current Φ mark is
  provisional.