# Project Phi — Architecture

> Codebase map. Updated when features change.
> Last updated: 2026-04-11 (Step 4f)

---

## Current state

Phase 1 past halfway. Phi System (`lib/phi/`) is the single source of
truth for design tokens. DB on Phi 1.0 schema. 3D scene renders in
spine-on shelf view with landscape enforcement. Two of three cover
sources live: `/api/cover-proxy` (4b) and `/api/cover-upload` (4c),
sharing a common `processImage()` sharp pipeline. Phase 1 identity
layer runs on Supabase anonymous sign-in.

Step 4f unified the book material: all 3 outward faces share a single
`onBeforeCompile`-patched meshStandardMaterial. Cover slab covers full
W×H; page block inset on 3 non-spine sides. Paper normalMap on page
block reveals horizontal grain under grazing light.

Remaining for Phase 1 gate: Step 4d typographic fallback, Step 5 spine
generator, Step 6 Aladin API, Step 7 manual add, Step 10 iPad FPS.

---

## File tree (current)
phi/
├── .vscode/settings.json
├── app/
│   ├── (features)/bookshelf/page.tsx
│   ├── api/
│   │   ├── cover-proxy/route.ts            # Step 4b
│   │   └── cover-upload/route.ts           # Step 4c
│   │   └── cover-generate/route.ts         # Step 4d
│   ├── dev/upload/page.tsx                 # scratch, delete at gate
│   ├── globals.css
│   ├── layout.tsx                          # AnonymousBootstrap + LandscapeGuard
│   └── page.tsx
├── components/
│   ├── 3d/
│   │   ├── BookModel.tsx                   # unified material (Step 4f)
│   │   ├── BookshelfScene.tsx              # grazing light rig (Step 4f)
│   │   ├── CoverMaterial.tsx               # onBeforeCompile patch (Step 4f)
│   │   └── PerfPanel.tsx
│   ├── auth/AnonymousBootstrap.tsx
│   └── ui/LandscapeGuard.tsx
├── lib/
│   ├── image/
│   │   ├── hash.ts
│   │   ├── fetchRemoteImage.ts
│   │   └── processImage.ts
│   ├── phi/                                # design tokens (single source)
│   │   ├── ratios.ts
│   │   ├── typography.ts
│   │   ├── colors.ts
│   │   ├── spacing.ts
│   │   ├── blocks.ts
│   │   └── constraints.ts
│   ├── supabase/
│   │   ├── client.ts                       # singleton + ensureAnonymousSession
│   │   ├── server.ts                       # async cookie-bound client
│   │   └── admin.ts                        # service_role
│   └── three/
│       ├── materials.ts
│       ├── bookDimensions.ts
│       ├── coverPipeline.ts                # edge-28-pixel sampling (Step 4f)
│       └── paperNormal.ts                  # procedural DataTexture (Step 4f)
│       └── typographicCover.ts             # @napi-rs/canvas renderer (Step 4d)
├── supabase/migrations/                    # see PROJECT_KNOWLEDGE §4
├── public/manifest.json
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json
├── assets/
│   └── fonts/
│       ├── NotoSerifKR-VF.ttf              # Step 4d, traced via outputFileTracingIncludes
│       └── NotoSansKR-VF.ttf               # Step 4d
---

## Components registry

| Component | Path | Type | Purpose |
|---|---|---|---|
| RootLayout | `app/layout.tsx` | Server | Font, PWA meta, AnonymousBootstrap + LandscapeGuard wrap |
| BookshelfScene | `components/3d/BookshelfScene.tsx` | Client | R3F Canvas, spine-on camera, grazing light rig |
| BookModel | `components/3d/BookModel.tsx` | Client | 4 meshes, unified CoverMaterial on front/spine/back, paper normalMap on page block |
| CoverMaterial | `components/3d/CoverMaterial.tsx` | Client | `onBeforeCompile`-patched meshStandardMaterial, 5 uniforms, letterbox shader |
| PerfPanel | `components/3d/PerfPanel.tsx` | Client | Dev-only FPS (r3f-perf) |
| LandscapeGuard | `components/ui/LandscapeGuard.tsx` | Client | Portrait overlay, unmounts children |
| AnonymousBootstrap | `components/auth/AnonymousBootstrap.tsx` | Client | Session bootstrap, exposes `useAnonymousSession()` Context |
| DevUploadPage | `app/dev/upload/page.tsx` | Client | Scratch, delete at gate |

---

## Routes

### Current
| Path | Purpose |
|---|---|
| `/` | Landing |
| `/bookshelf` | Shelf view |
| `/dev/upload` | Scratch (delete at gate) |

### Planned (Phase 1 remainder)
`/book/new` · `/book/new/search` · `/book/new/manual`

### Planned (Phase 2+)
`/book/[bookId]` · `/book/[bookId]/edit` · `/u/[username]` · `/u/[username]/book/[bookId]` · `/about/donations`

---

## API routes

Contracts live in each route's JSDoc header. This table is the map.

| Path | Method | Auth | Purpose |
|---|---|---|---|
| `/api/cover-proxy` | GET | none | Remote URL → sharp WebP → `covers/{sha1}.webp` via service_role |
| `/api/cover-upload` | POST | `getUser()` | Multipart upload → sharp WebP → `covers/{user_id}/{sha1}.webp` via cookie-bound client (RLS enforced) |
| `/api/cover-generate` | POST | `getUser()` | JSON `{title,author,language}` → @napi-rs/canvas PNG → sharp WebP → `covers/{user_id}/{sha1}.webp` (RLS enforced) |

Both return `{ ok, data: { url, dominantColor, width, height } }` on
success. Caller persists to `books` row.

### Planned
`/api/aladin/search` (Step 6) · `/api/google-books/search` (Phase 2) · `/api/shelf-signal` (Phase 2)

---

## 3D pipeline status (Step 4f)

| Stage | Location | Status |
|---|---|---|
| Procedural geometry | `components/3d/BookModel.tsx` | Done (4f redesign) |
| PBR materials | `lib/three/materials.ts` | Done |
| Lighting + environment | `components/3d/BookshelfScene.tsx` | Done (4f grazing rig) |
| Cover proxy (URL source) | `app/api/cover-proxy/route.ts` | Done (4b) |
| Cover upload (file source) | `app/api/cover-upload/route.ts` | Done (4c) |
| Shared sharp pipeline | `lib/image/processImage.ts` | Done |
| Client cover adapter | `lib/three/coverPipeline.ts` | Done (4f: edge-28-pixel) |
| Unified CoverMaterial | `components/3d/CoverMaterial.tsx` | Done (4f) |
| Paper normalMap | `lib/three/paperNormal.ts` | Done (4f) |
| Typographic cover fallback | `lib/three/typographicCover.ts` + `app/api/cover-generate/route.ts` | Done (4d) |
| Spine generator | (Step 5) | Not started |
| Font assets | `assets/fonts/` via `outputFileTracingIncludes` | Done (4d) |

### Step 4f material architecture

All 3 outward faces use the same `CoverMaterial` class, differing only
in `face` prop + uniforms:

- `face="front"` + `uHasTexture=1` → letterbox with `uCoverBaseColor` fill
- `face="spine"` or `"back"` + `uHasTexture=0` → solid `uCoverBaseColor`

One patched `meshStandardMaterial` instance → all faces receive PBR
scene lighting. Page block stays plain `meshStandardMaterial` + paper
normalMap.

### Geometry layout (Step 4f)

Cover slab dimensions: full `W × H × COVER_THICKNESS`.
Page block: `(W - COVER_THICKNESS - PAGE_INSET) × (H - 2·PAGE_INSET) × (T - 2·COVER_THICKNESS)`.
Result: page block visible at top, bottom, and fore-edge; flush at spine.

### Lighting rig (Step 4f)

- hemisphereLight 0.15 (was 0.3)
- Key directionalLight at `[4, 2, 3]` intensity 2.8 (was `[5, 6, 3]` intensity 2.5)
- Grazing rim at `[6, 0.3, 0]` intensity 1.6 (new)
- Cool fill at `[-3, 1, -2]` intensity 0.3
- Environment apartment, `environmentIntensity={0.25}` (was default 1.0)

Without this rebalance the paper normalMap is completely washed out
by all-angle environment light. See `LEARNINGS.md` §"normalMap needs
grazing light".

---

## Design system

Single source of truth: `lib/phi/`. `tailwind.config.ts` imports
directly — no hardcoded tokens. Phi Light palette not started (Phase 2).

---

## Identity & auth

- **Active**: Anonymous sign-in (Step 4c). `ensureAnonymousSession()`
  module-level in-flight dedup. Real `auth.users` rows with
  `is_anonymous=true`.
- **Planned Phase 2**: Email magic link, Google OAuth, `linkIdentity()`
  migration for Phase 1 data preservation.
- **Planned Phase 4**: Apple Sign In (iOS App Store requirement).

---

## Supabase clients

| Context | Module | Notes |
|---|---|---|
| Browser | `lib/supabase/client.ts` | Singleton since 4c |
| Server (cookies) | `lib/supabase/server.ts` | `async createClient()`. Use `getUser()` for auth decisions, never `getSession()` |
| Admin | `lib/supabase/admin.ts` | service_role. Factory, not singleton. `persistSession: false`. Never imported by shared-render code. |

---

## Database

Full schema in `supabase/migrations/`. Tables: `profiles`, `books`,
`book_pages`, `follows`, `saved_books`, `notifications`,
`donation_records`. All RLS-enabled. Storage: `covers` bucket only,
two write paths (service_role root, RLS-enforced `{user_id}/`).
SECURITY DEFINER function `get_shelf_signal(uuid)`.

Policy summary (covers bucket): `covers_public_read` (SELECT),
`covers_user_insert_own_folder` / `_update_` / `_delete_` (scoped by
`storage.foldername(name)[1] = auth.uid()::text`).

---

## Infrastructure

| Service | Project | ID |
|---|---|---|
| Supabase | Phi | `trbeccbsjnxdkzxlecvv` (Tokyo) |
| Vercel | phi | `prj_6QvsdRh0vK4kYmAOyKT63yIIvCWX` (iad1) |
| GitHub | DennisJang/Phi | — |

Dev URL: `https://phi-xi-eight.vercel.app`
Supabase API: `https://trbeccbsjnxdkzxlecvv.supabase.co`
Custom domain: deferred to Phase 4.

---

## Installed packages

Runtime: `next@14.2.35`, `react@18.3.1`, `@supabase/supabase-js@2.100.1`,
`@supabase/ssr@0.9.0`, `three@0.169.0`, `@react-three/fiber@8.17.10`,
`@react-three/drei@9.114.0`, `zustand@5.0.1`, `sharp@^0.33`,
`@napi-rs/canvas@^0.1` (Step 4d), `zod@^3` (Step 4d).

Dev: `typescript@5.7.0`, `tailwindcss@3.4.0`, `r3f-perf@7.2.3`,
type packages.


Phase 2+: `next-intl`, `framer-motion`.

---

## Tech debt (active only — deferred issues live in LEARNINGS.md)

- `BookModel` thickness `BASE_SCALE × 0.25` is visual calibration, not
  φ-derived. Documented exception in PROJECT_KNOWLEDGE §9.
- No error boundaries around `<Canvas>`.
- No i18n structure yet — Phase 2 start.
- OrbitControls on `/bookshelf` is dev convenience — replace at Phase 2.
- "drag to inspect · scroll to zoom" hint is dev-era copy.
- No `types/` directory yet — needed at Step 6.