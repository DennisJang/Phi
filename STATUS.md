# Project Phi — Status

> Read this FIRST at the start of every new conversation.
> Updated at the end of each working session by Claude.
> Last updated: 2026-04-10

---

## Current position

- **Phase**: 1 — 3D Object Fidelity
- **Week**: 1 (Day 2 → entering major redesign)
- **Gate target**: Cover auto-mapping from 3 sources + auto spine + Phi System coded + Aladin minimal + manual add minimal + iPad landscape 60fps

## Major pivot completed 2026-04-10

The project underwent a comprehensive redesign session that changed multiple core decisions. The old plan (pure MD Vinyl, book opening animation, LLM editing, paid subscription) has been replaced. All new decisions are logged in PROJECT_KNOWLEDGE.md §9. Key changes:

- Design language: MD Vinyl (object only) + Stripe Press (layout)
- Platform: tablet landscape only, phone deferred
- Languages: ko + en only
- Shelf model: single main shelf with section labels (not multiple playlists)
- Privacy: private by default, follower counts hidden permanently
- Shares: abstracted signals to others ("loved" / "spreading" / "widely loved")
- Cover pipeline: 3 sources (Aladin, upload, typographic generation), dominant color letterbox
- Spine: always auto-generated (author · title · Φ)
- Book open animation: abandoned (was Step 5)
- Editing: template mode + canvas block editor (Phase 3), NO LLM
- Payment: removed entirely, free forever
- Revenue: affiliate only, 10% donated
- Philosophy: Constrained Creativity as viral engine

## Last completed (carried over from old Phase 1)

- [x] Project planning and architecture design
- [x] Tech stack locked: Next.js + R3F + Supabase + Vercel + Capacitor
- [x] Supabase "Phi" project created (Tokyo, trbeccbsjnxdkzxlecvv)
- [x] Old DB schema applied: 7 tables + RLS + indexes + triggers
  - ⚠️ schema will be significantly modified in upcoming migration
- [x] Storage buckets: 6 buckets with RLS policies
- [x] GitHub repo DennisJang/Phi
- [x] Vercel deployment: https://phi-xi-eight.vercel.app
- [x] R3F + Three.js stack installed
- [x] PBR material presets
- [x] Procedural BookModel (4 meshes, spine-hinge origin)
- [x] BookshelfScene with lighting + environment + shadow catcher
- [x] PerfPanel dev-only
- [x] `/bookshelf` route rendering book at 60fps on desktop
- [x] Step 4 (cover UV mapping) initial version

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
- [ ] ~~**Step 5**: Book open animation~~ **ABANDONED 2026-04-10** — app's core is ownership + display, not opening ceremony. Do NOT reimplement.
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
- [ ] **Step 8**: Phi System (§17) codified
  - [ ] 8a: `lib/phi/ratios.ts`
  - [ ] 8b: `lib/phi/typography.ts`
  - [ ] 8c: `lib/phi/colors.ts` (Dark palette only for Phase 1)
  - [ ] 8d: `lib/phi/spacing.ts`
  - [ ] 8e: `lib/phi/constraints.ts` (types only, no editor yet)
- [ ] **Step 9**: Landscape orientation enforcement
  - [ ] 9a: Portrait-mode rotation overlay
  - [ ] 9b: Viewport meta configuration
- [ ] **Step 10**: Real iPad test
  - [ ] 10a: Measure FPS on actual device (owner needs physical iPad)
  - [ ] 10b: If < 60fps, optimize before gate closure

## Immediate next tasks (order matters)

1. **Apply database migration** — drop deprecated tables/columns, create new schema (follows, saved_books, book_pages, notifications, donation_records, profiles updates)
2. **Create `lib/phi/` directory** — ratios, typography, colors (dark), spacing, constraints
3. **Rebuild `/bookshelf` for landscape** — rotate camera for horizontal viewing, add landscape enforcement overlay
4. **Cover pipeline Step 4b** — start with `/api/cover-proxy` route handler + dominant color extraction using sharp
5. **Typographic cover generator** — canvas-based, becomes the fallback for all flows

## Performance baseline (measured 2026-04-08, before redesign)

Scene: 1 book, 4 meshes, 86 triangles, 8 draw calls

| Environment | FPS | CPU frame | GPU frame |
|---|---|---|---|
| Desktop Chrome, no throttling | ~60 | ~3.3ms | ~3.0ms |
| DevTools iPad Air viewport, CPU 4x slow | ~30 | ~18ms | ~5.8ms |

Baseline will be re-measured after landscape rewrite and cover pipeline completion.

## Known issues (carried over)

- **Next.js 14.2.35 audit vulnerability** — deferred to Phase 1 gate closure, known DoS + HTTP smuggling
- **No PWA icons yet** — defer to Phase 4
- **VS Code `@tailwind` rule warning** — cosmetic, no build impact
- **Case-sensitivity gotcha** — always match import casing exactly (Linux/Vercel)

## Known issues (new)

- **`subscription_tier` column in old `profiles` schema** — must be dropped in next migration
- **Old `share_cards` and `photographer_photos` tables** — must be dropped, no longer in plan
- **Current `/bookshelf` scene is camera-portrait-ish** — must be rebuilt for landscape-first viewing
- **No i18n structure yet** — not critical for Phase 1, but all new UI strings should go into a `constants/strings.ts` temporary bucket ready for extraction

## Environment notes

- **Dev**: GitHub Codespaces, Linux, case-sensitive
- **Supabase**: anon key + URL in Vercel env vars; service_role NOT yet added (needed when cover proxy is implemented — add before Step 4b)
- **Auth providers**: not configured yet, OK for Phase 1 (no auth), add Google OAuth at Phase 2 start
- **Real iPad**: still not acquired — owner needs to confirm purchase timeline. Phase 1 gate cannot fully close without it.
- **Aladin TTB key**: owner needs to register at aladin.co.kr (needed for Step 6 — register before that step)

## Decisions pending

- **Real iPad acquisition** — blocks final Phase 1 gate verification
- **Aladin TTB key registration** — blocks Step 6
- **Custom domain** — safehomepro.co.kr owned but name mismatch. Defer to Phase 4. Consider phi-specific domain.
- **Donation recipient organization** — Phase 4 decision
- **Kakao Login integration** — Phase 3 decision (convenience for Korean users, custom OAuth complexity)
- **Font loading strategy** — Cormorant Garamond (serif) + Pretendard (sans-serif) via next/font or self-hosted? Decide at Step 5 (spine typography) when it first matters.
- **Logo and copy finalization** — deferred. Current Φ mark is provisional; detailed brand work happens after Phase 1 gate.
