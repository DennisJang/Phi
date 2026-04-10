# Project Phi — Status

> Read this FIRST at the start of every new conversation.
> Updated at the end of each working session by Claude.
> Last updated: 2026-04-10

---

## Current position

- **Phase**: 1 — 3D Object Fidelity
- **Week**: 1 (Day 2, three PRs merged into main today)
- **Gate target**: Cover auto-mapping from 3 sources + auto spine + Phi System coded + Aladin minimal + manual add minimal + iPad landscape 60fps

## Sessions completed today (2026-04-10)

Three feature branches were merged to main in one working day:

1. **feat/p1-phi-system** — codified the Phi System under `lib/phi/`
   (ratios, typography, colors, spacing, blocks, constraints). Six files,
   single source of truth for every ratio, color, and block type in the app.

2. **feat/p1-db-redesign** — applied the full redesign migration to the
   Supabase dev project. Dropped 5 deprecated tables, reshaped profiles
   and books, created 5 new tables, rewrote 12 RLS policies, added the
   get_shelf_signal SECURITY DEFINER function, created 8 indexes.

3. **feat/p1-landscape-rebuild** — LandscapeGuard + spine-on shelf view +
   full Tailwind integration with PHI_DARK + warm background adoption
   + legacy token cleanup.

## Last completed (carried over from old Phase 1)

- [x] Project planning and architecture design
- [x] Tech stack locked: Next.js + R3F + Supabase + Vercel + Capacitor
- [x] Supabase "Phi" project created (Tokyo, trbeccbsjnxdkzxlecvv)
- [x] DB schema applied: Phi 1.0 redesign (2026-04-10)
- [x] Storage buckets: 6 buckets with RLS policies
- [x] GitHub repo DennisJang/Phi
- [x] Vercel deployment: https://phi-xi-eight.vercel.app
- [x] R3F + Three.js stack installed
- [x] PBR material presets
- [x] Procedural BookModel (4 meshes, spine-hinge origin)
- [x] BookshelfScene with warm lighting + environment + shadow catcher
- [x] PerfPanel dev-only

## Phase 1 Gate progress (new definition)

- [x] **Step 1**: R3F Canvas + lighting (done)
- [x] **Step 2**: Procedural book geometry (done)
- [x] **Step 3**: PBR materials (done)
- [ ] **Step 4**: Cover mapping pipeline — THREE SOURCES
  - [x] 4a: URL → Texture loading (done, legacy)
  - [ ] 4b: `/api/cover-proxy` + dominant color extraction (server-side)
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

1. **Step 4b** — `/api/cover-proxy` route handler
   - Server-side fetch of remote cover image
   - Validation: MIME, size, Content-Type
   - Write to Supabase Storage `covers/` bucket
   - Extract dominant color server-side (sharp or alternative)
   - Return `{ url, dominantColor, width, height }`
   - Add service_role key to Vercel env before this step
2. **Step 4d** — Typographic cover generator (canvas-based fallback)
3. **Step 4e** — Letterbox compositor (dominant color + cover texture)
4. **Step 5** — Spine texture generator
5. **Step 6** — Aladin API integration (requires TTB key registration first)

## Performance baseline (measured 2026-04-10, after landscape rebuild)

Scene: 1 book, 4 meshes, 86 triangles, 8 draw calls

| Environment | FPS | CPU frame | GPU frame |
|---|---|---|---|
| Desktop Chrome, no throttling | 60 | ~2.8ms | ~1.9ms |
| DevTools iPad Air viewport, CPU 4x slow | ~50 | ~15ms | ~3.1ms |

The spine-on camera composition is slightly cheaper than the old
cover-front composition because less of the cover mesh is in the
rasterizer's visible region.

Baseline will be re-measured after cover pipeline (Step 4) and spine
generator (Step 5) add more textures to the scene.

## Known issues (carried over)

- **Next.js 14.2.35 audit vulnerability** — deferred to Phase 1 gate closure, known DoS + HTTP smuggling
- **No PWA icons yet** — defer to Phase 4
- **VS Code `@tailwind` rule warning** — resolved by `.vscode/settings.json`
- **Case-sensitivity gotcha** — always match import casing exactly (Linux/Vercel)

## Known issues (new)

- **BookModel dimensions are not φ-derived** — current 1.4 × 2.0 × 0.25
  ratio ≠ φ:1. PROJECT_KNOWLEDGE.md §6.1 requires Height:Width = φ:1.
  Defer to Step 4 (cover pipeline will touch these dimensions anyway).
- **OrbitControls still active on /bookshelf** — Phase 1 dev convenience.
  Replace with custom gesture handlers at Phase 2 start.
- **`drag to inspect · scroll to zoom` hint text** is Phase 1 dev-era
  copy. Phase 2 should change to "tap to open · swipe to browse" once
  gesture handlers replace OrbitControls.

## Environment notes

- **Dev**: GitHub Codespaces, Linux, case-sensitive
- **Supabase**: anon key + URL in Vercel env vars; service_role NOT yet
  added (needed when cover proxy is implemented — add before Step 4b)
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
- **Logo and copy finalization** — deferred. Current Φ mark is
  provisional.