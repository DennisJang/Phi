# Project Phi — Architecture

> Auto-generated codebase map. Updated when features are added/changed.
> Last updated: 2026-04-10 (post Step 3a: landscape rebuild)

---

## Current state

Phase 1 foundation is laid. The Phi System (`lib/phi/`) is codified as
the single source of truth for all design tokens. The database is on
the Phi 1.0 schema. The 3D scene renders in spine-on shelf view with
portrait-mode orientation enforcement.

What remains for the Phase 1 gate: cover pipeline (Step 4), spine
generator (Step 5), Aladin API integration (Step 6), manual add flow
(Step 7), and real iPad FPS verification (Step 10).

---

## File tree (current, actual)phi/
├── .vscode/
│   └── settings.json                     # Tailwind linter config
├── app/
│   ├── (features)/
│   │   └── bookshelf/
│   │       └── page.tsx                  # horizontal shelf route
│   ├── globals.css                       # @layer base resets only
│   ├── layout.tsx                        # LandscapeGuard wrapper
│   └── page.tsx                          # landing
├── components/
│   ├── 3d/
│   │   ├── BookModel.tsx                 # procedural book geometry
│   │   ├── BookshelfScene.tsx            # spine-on camera composition
│   │   └── PerfPanel.tsx                 # dev-only FPS overlay
│   └── ui/
│       └── LandscapeGuard.tsx            # portrait unmount guard
├── lib/
│   ├── phi/                              # Phi System (single source of truth)
│   │   ├── ratios.ts                     # φ constants + SHELF_YAW_RAD
│   │   ├── typography.ts                 # 5 roles, 2 typefaces
│   │   ├── colors.ts                     # PHI_DARK palette
│   │   ├── spacing.ts                    # 3-step scale
│   │   ├── blocks.ts                     # 7 block types + BookPageContent
│   │   └── constraints.ts                # exhaustive editor manifest
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   └── three/
│       ├── materials.ts
│       └── useCoverTexture.ts
├── supabase/
│   └── migrations/
│       └── 20260410_000000_phi_redesign.sql
├── public/
│   └── manifest.json
├── .gitignore
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts                    # imports from lib/phi/
└── tsconfig.json

## File tree (planned, Phase 1 target)phi/
├── app/
│   ├── (features)/
│   │   ├── bookshelf/
│   │   │   └── page.tsx              # horizontal shelf (own)
│   │   └── book/
│   │       └── new/
│   │           ├── page.tsx          # add book: search or manual
│   │           ├── search/
│   │           │   └── page.tsx      # Aladin search + edition selector
│   │           └── manual/
│   │               └── page.tsx      # manual entry form
│   ├── api/
│   │   ├── cover-proxy/
│   │   │   └── route.ts              # proxy + dominant color extraction
│   │   └── aladin/
│   │       └── search/
│   │           └── route.ts          # Aladin search proxy
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── 3d/
│   │   ├── BookModel.tsx
│   │   ├── BookshelfScene.tsx
│   │   ├── CoverMaterial.tsx         # NEW: letterbox compositor material
│   │   ├── SpineMaterial.tsx         # NEW: auto-generated spine texture
│   │   └── PerfPanel.tsx
│   ├── ui/
│   │   ├── LandscapeGuard.tsx
│   │   └── BookAddDialog.tsx         # NEW: Phase 1 end
│   └── icons/
│       └── PhiLogo.tsx               # NEW: Φ mark
├── lib/
│   ├── phi/                          # (done)
│   ├── supabase/
│   ├── three/
│   │   ├── materials.ts
│   │   ├── useCoverTexture.ts
│   │   ├── coverPipeline.ts          # NEW: letterbox compositor
│   │   ├── spineGenerator.ts         # NEW: canvas spine texture
│   │   └── typographicCover.ts       # NEW: fallback cover generator
│   ├── aladin/
│   │   └── client.ts                 # NEW: typed Aladin API wrapper
│   └── image/
│       └── dominantColor.ts          # NEW: server-side sharp extraction
├── types/
│   ├── book.ts                       # NEW
│   └── phi.ts                        # NEW
├── stores/
│   └── useBookStore.ts               # NEW (minimal in Phase 1)
├── public/
│   └── manifest.json
└── supabase/
└── migrations/
└── 20260410_000000_phi_redesign.sql

---

## Components registry (current)

| Component | Path | Type | Purpose |
|---|---|---|---|
| RootLayout | `app/layout.tsx` | Server | Dark canvas, font, PWA meta, LandscapeGuard wrap |
| Home | `app/page.tsx` | Server | Landing page with Φ mark and entry link |
| BookshelfPage | `app/(features)/bookshelf/page.tsx` | Server | Shelf route wrapper with retreating chrome |
| BookshelfScene | `components/3d/BookshelfScene.tsx` | Client | R3F Canvas with spine-on camera (15° yaw, 0° pitch) |
| BookModel | `components/3d/BookModel.tsx` | Client | Procedural book (4 meshes, spine hinge origin) |
| PerfPanel | `components/3d/PerfPanel.tsx` | Client | Dev-only FPS overlay (r3f-perf) |
| LandscapeGuard | `components/ui/LandscapeGuard.tsx` | Client | Portrait-mode overlay, unmounts children entirely |

## Components registry (planned, Phase 1 target additions)

| Component | Path | Type | Purpose |
|---|---|---|---|
| PhiLogo | `components/icons/PhiLogo.tsx` | Server | Φ mark reused across UI |
| CoverMaterial | `components/3d/CoverMaterial.tsx` | Client | Applies letterbox-composited texture to front cover mesh |
| SpineMaterial | `components/3d/SpineMaterial.tsx` | Client | Applies auto-generated spine texture |
| BookAddDialog | `components/ui/BookAddDialog.tsx` | Client | Phase 1 minimal book add entry point |

---

## Routes

### Current
| Path | Type | Component |
|---|---|---|
| `/` | Server | `app/page.tsx` — landing with Φ mark |
| `/bookshelf` | Server | `app/(features)/bookshelf/page.tsx` — shelf view |

### Planned (Phase 1 target)
| Path | Type | Purpose |
|---|---|---|
| `/book/new` | Server | Add book entry point |
| `/book/new/search` | Server | Aladin search + edition select |
| `/book/new/manual` | Server | Manual entry form |

### Planned (Phase 2+)
| Path | Type | Purpose |
|---|---|---|
| `/book/[bookId]` | Server | Book detail page (template mode) |
| `/book/[bookId]/edit` | Server | Edit book page |
| `/u/[username]` | Server | Public shelf |
| `/u/[username]/book/[bookId]` | Server | Public book detail |
| `/about/donations` | Server | Transparency page (Phase 4) |

---

## API routes

### Current
None.

### Planned (Phase 1)
| Path | Method | Purpose |
|---|---|---|
| `/api/cover-proxy` | GET | Fetch image URL, cache to Storage, return processed URL + dominant color |
| `/api/aladin/search` | GET | Proxy Aladin search API (hides TTB key) |

### Planned (Phase 2+)
| Path | Method | Purpose |
|---|---|---|
| `/api/google-books/search` | GET | English book search |
| `/api/shelf-signal` | GET | Returns abstracted shelf signal for a username |

---

## Design system status

| Layer | Location | Status |
|---|---|---|
| Ratios (φ constants + SHELF_YAW_RAD) | `lib/phi/ratios.ts` | Done |
| Typography scale | `lib/phi/typography.ts` | Done |
| Color tokens (Phi Dark) | `lib/phi/colors.ts` | Done |
| Spacing scale | `lib/phi/spacing.ts` | Done |
| Block type definitions | `lib/phi/blocks.ts` | Done |
| Constraint manifest | `lib/phi/constraints.ts` | Done |
| Tailwind tokens | `tailwind.config.ts` | Done — imports PHI_DARK directly |
| Phi Light palette | `lib/phi/colors.ts` | Not started (Phase 2) |

**Token binding discipline**: `tailwind.config.ts` imports `PHI_DARK`,
`DURATION_MS`, `PHI_EASING`, and `SPACING_PX` directly from `lib/phi/`.
No design value is hardcoded in the Tailwind config. CSS variables in
`globals.css` have been removed entirely; pseudo-element styles
(`::selection`, `::-webkit-scrollbar-thumb`) use Tailwind's `@apply`
directive to reference the same tokens.

---

## 3D pipeline status

| Stage | Location | Status |
|---|---|---|
| Procedural book geometry | `components/3d/BookModel.tsx` | Done |
| PBR materials (4 presets) | `lib/three/materials.ts` | Done |
| Lighting + environment | `components/3d/BookshelfScene.tsx` | Done (landscape rebuild, spine-on view) |
| Cover texture loading | `lib/three/useCoverTexture.ts` | Done (legacy Step 4a) |
| Cover proxy + dominant color | `app/api/cover-proxy/route.ts` | Not started (Step 4b) |
| Letterbox compositor | `lib/three/coverPipeline.ts` | Not started (Step 4e) |
| Typographic cover generator | `lib/three/typographicCover.ts` | Not started (Step 4d) |
| Spine generator | `lib/three/spineGenerator.ts` | Not started (Step 5) |

**Scene composition (current)**: Book in base pose (no model-side
rotation). Camera positioned on a horizontal arc around the book center
at yaw = 15° (`SHELF_YAW_RAD`), pitch = 0°. This produces the Stripe
Press 3/4 silhouette: spine dominant, front cover edge as a perspective
sliver, top and bottom faces never visible. OrbitControls target is the
book center `[BOOK_DIMENSIONS.width / 2, 0, 0]`, not the origin, so
inspection drags rotate around the book center rather than the spine
hinge.

---

## Supabase connection

| Context | Module | Method |
|---|---|---|
| Browser | `lib/supabase/client.ts` | `createBrowserClient()` |
| Server | `lib/supabase/server.ts` | `createServerClient()` with cookies |

Service role key: **not yet added** to Vercel env vars. Required before
Step 4b (cover proxy) begins, since dominant color extraction and
Storage writes need elevated access.

---

## Database schema status

**Status**: Phi 1.0 schema applied to Supabase dev project (2026-04-10).

### Tables (current, applied)

| Table | Rows | RLS | Notes |
|---|---|---|---|
| `profiles` | 0 | ✓ | display_name, shelf_visibility, theme_preference, language_preference |
| `books` | 0 | ✓ | reshape complete; source CHECK: aladin_api/manual/google_books |
| `book_pages` | 0 | ✓ | one per book, edit_mode template/canvas |
| `follows` | 0 | ✓ | anti-comparison RLS — no "see who follows you" policy |
| `saved_books` | 0 | ✓ | individual book bookmarks |
| `notifications` | 0 | ✓ | Phase 3+ queue |
| `donation_records` | 0 | ✓ | Phase 4 transparency ledger, publicly readable |

### Server-side functions

| Function | Purpose |
|---|---|
| `public.get_shelf_signal(uuid) → text` | SECURITY DEFINER. Returns abstracted signal (`loved` / `spreading` / `widely_loved` / null) instead of raw follower count. Anti-comparison enforced at query layer. Executable by anon and authenticated roles only. |

### Indexes

Eight `idx_*` indexes cover the expected query patterns:
`idx_books_user`, `idx_books_shelf_order`, `idx_books_isbn` (partial
where isbn is not null), `idx_book_pages_book`, `idx_follows_follower`,
`idx_follows_following`, `idx_saved_books_user`,
`idx_notifications_user_unread` (partial where read_at is null).

### Migrations

| File | Applied | Summary |
|---|---|---|
| `supabase/migrations/20260410_000000_phi_redesign.sql` | 2026-04-10 | Full redesign — drop 5 deprecated tables, reshape profiles and books, create 5 new tables, rewrite 12 RLS policies, add get_shelf_signal function, create 8 indexes |

---

## Installed packages

### Dependencies (current)
- `next@14.2.35`
- `react@18.3.1` / `react-dom@18.3.1`
- `@supabase/supabase-js@2.100.1`
- `@supabase/ssr@0.9.0`
- `three@0.169.0`
- `@react-three/fiber@8.17.10`
- `@react-three/drei@9.114.0`
- `zustand@5.0.1`

### Dependencies to add (Phase 1)
- `sharp` — server-side image processing for dominant color extraction
  (Edge Function compatibility check may require `@napi-rs/canvas` or
  `canvas` as alternative)

### Dependencies to add (Phase 2+)
- `next-intl` — i18n (Phase 2)
- `framer-motion` — animations (Phase 2)
- `@supabase/auth-ui-react` — auth UI helpers (Phase 2, optional)

### Dev dependencies (current)
- `typescript@5.7.0`
- `tailwindcss@3.4.0`
- `postcss@8.5.8` / `autoprefixer@10.4.27`
- `@types/react@18.3.12` / `@types/react-dom@18.3.1`
- `@types/three@0.169.0`
- `@types/node@25.5.0`
- `r3f-perf@7.2.3`

### Dev environment config
- `.vscode/settings.json` — ignores `css.lint.unknownAtRules` so that
  `@tailwind` and `@apply` directives don't trip the built-in CSS
  linter. Includes Tailwind language hints for `.tsx` files to enable
  future IntelliSense extension support.

---

## Infrastructure

| Service | Project | ID | Region |
|---|---|---|---|
| Supabase | Phi | `trbeccbsjnxdkzxlecvv` | ap-northeast-1 (Tokyo) |
| Vercel | phi | `prj_6QvsdRh0vK4kYmAOyKT63yIIvCWX` | iad1 |
| GitHub | DennisJang/Phi | — | — |

## Production URLs

- **Web (dev)**: https://phi-xi-eight.vercel.app
- **Supabase API**: https://trbeccbsjnxdkzxlecvv.supabase.co
- **Custom domain**: none (deferred to Phase 4)

---

## Known tech debt

- `BookModel` dimensions (1.4 × 2.0 × 0.25) are not φ-derived. Should
  be height:width = φ:1 per PROJECT_KNOWLEDGE.md §6.1. Defer to Step 4
  since the cover pipeline will touch these dimensions anyway.
- No error boundaries around `<Canvas>` — add when cover pipeline lands.
- No i18n structure yet — `constants/strings.ts` temporary bucket should
  be introduced as new UI lands; full `next-intl` integration at
  Phase 2 start.
- Auth not yet integrated — `/bookshelf` is currently anonymous.
- `OrbitControls` on `/bookshelf` is a Phase 1 dev convenience; Phase 2
  replaces with gesture handlers for tablet-native interaction.
- "drag to inspect · scroll to zoom" hint text on `/bookshelf` is
  dev-era copy. Update to "tap to open · swipe to browse" when gesture
  handlers replace OrbitControls.
- `LandscapeGuard` bilingual copy is hardcoded — permanent exception
  from the Phase 2 i18n system by design (brand statement: "Phi speaks
  ko and en simultaneously").
- No `types/` directory yet. `BookPageContent` and block types live in
  `lib/phi/blocks.ts` which is fine, but `types/book.ts` will be needed
  at Step 6 (Aladin API response shape).