# Project Phi — Architecture

> Auto-generated codebase map. Updated when features are added/changed.
> Last updated: 2026-04-10 (post-redesign)

---

## Current state

The codebase currently reflects the pre-redesign Phase 1 (before 2026-04-10 pivot). The sections below marked "PLANNED" describe the target structure after the redesign migration is applied.

---

## File tree (current, actual)

```
phi/
├── app/
│   ├── (features)/
│   │   └── bookshelf/
│   │       └── page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── 3d/
│       ├── BookModel.tsx
│       ├── BookshelfScene.tsx
│       └── PerfPanel.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   └── three/
│       └── materials.ts
├── public/
│   └── manifest.json
├── .gitignore
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json
```

## File tree (planned, Phase 1 target)

```
phi/
├── app/
│   ├── (features)/
│   │   ├── bookshelf/
│   │   │   └── page.tsx              # horizontal shelf (own)
│   │   └── book/
│   │       ├── new/
│   │       │   ├── page.tsx          # add book: search or manual
│   │       │   ├── search/
│   │       │   │   └── page.tsx      # Aladin search + edition selector
│   │       │   └── manual/
│   │       │       └── page.tsx      # manual entry form
│   │       └── [bookId]/
│   │           └── page.tsx          # book detail (Phase 2)
│   ├── api/
│   │   ├── cover-proxy/
│   │   │   └── route.ts              # proxy + dominant color extraction
│   │   └── aladin/
│   │       └── search/
│   │           └── route.ts          # Aladin search proxy
│   ├── globals.css
│   ├── layout.tsx                    # + landscape enforcement
│   └── page.tsx
├── components/
│   ├── 3d/
│   │   ├── BookModel.tsx
│   │   ├── BookshelfScene.tsx        # rebuilt for landscape horizontal
│   │   ├── CoverMaterial.tsx         # NEW: cover texture + dominant color compositor
│   │   ├── SpineMaterial.tsx         # NEW: auto-generated spine texture
│   │   └── PerfPanel.tsx
│   ├── ui/
│   │   ├── LandscapeGuard.tsx        # NEW: portrait overlay
│   │   └── BookAddDialog.tsx         # NEW: Phase 1 end
│   └── icons/
│       └── PhiLogo.tsx               # NEW
├── lib/
│   ├── phi/                          # NEW: golden ratio design system
│   │   ├── ratios.ts
│   │   ├── typography.ts
│   │   ├── colors.ts
│   │   ├── blocks.ts                 # (defined, not yet used)
│   │   ├── spacing.ts
│   │   └── constraints.ts
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── three/
│   │   ├── materials.ts
│   │   ├── coverPipeline.ts          # NEW: letterbox compositor
│   │   ├── spineGenerator.ts         # NEW: canvas spine texture
│   │   └── typographicCover.ts       # NEW: fallback cover generator
│   ├── aladin/
│   │   └── client.ts                 # NEW: typed Aladin API wrapper
│   └── image/
│       └── dominantColor.ts          # NEW: server-side sharp extraction
├── types/
│   ├── book.ts                       # NEW
│   ├── blocks.ts                     # NEW
│   └── phi.ts                        # NEW
├── stores/
│   └── useBookStore.ts               # NEW (minimal in Phase 1)
├── public/
│   └── manifest.json
├── supabase/
│   └── migrations/
│       └── 20260410_000000_phi_redesign.sql  # NEW: full redesign migration
└── [config files unchanged]
```

## Components registry (current)

| Component | Path | Type | Purpose |
|---|---|---|---|
| RootLayout | `app/layout.tsx` | Server | Dark canvas, font, PWA meta |
| Home | `app/page.tsx` | Server | Landing, link to `/bookshelf` |
| BookshelfPage | `app/(features)/bookshelf/page.tsx` | Server | Route wrapper |
| BookshelfScene | `components/3d/BookshelfScene.tsx` | Client | R3F Canvas, lights, env, controls |
| BookModel | `components/3d/BookModel.tsx` | Client | Procedural book (4 meshes) |
| PerfPanel | `components/3d/PerfPanel.tsx` | Client | Dev-only FPS overlay |

## Components registry (planned, Phase 1 target additions)

| Component | Path | Type | Purpose |
|---|---|---|---|
| LandscapeGuard | `components/ui/LandscapeGuard.tsx` | Client | Portrait mode rotation overlay |
| PhiLogo | `components/icons/PhiLogo.tsx` | Server | Φ mark reused across UI |
| CoverMaterial | `components/3d/CoverMaterial.tsx` | Client | Applies letterbox-composited texture to front cover mesh |
| SpineMaterial | `components/3d/SpineMaterial.tsx` | Client | Applies auto-generated spine texture |
| BookAddDialog | `components/ui/BookAddDialog.tsx` | Client | Phase 1 minimal book add entry point |

## Routes

### Current
| Path | Type | Component |
|---|---|---|
| `/` | Server | `app/page.tsx` |
| `/bookshelf` | Server | `app/(features)/bookshelf/page.tsx` |

### Planned (Phase 1 target)
| Path | Type | Purpose |
|---|---|---|
| `/` | Server | Landing |
| `/bookshelf` | Server | Own horizontal shelf |
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

## Supabase connection

| Context | Module | Method |
|---|---|---|
| Browser | `lib/supabase/client.ts` | `createBrowserClient()` |
| Server | `lib/supabase/server.ts` | `createServerClient()` with cookies |

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
- `sharp` — server-side image processing for dominant color extraction (Edge Function compatible alternative may be needed: `@napi-rs/canvas` or `canvas`)

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

## Database schema status

**Status**: Old schema applied to Supabase dev project. Major migration pending.

### Old tables (will be dropped or modified)
| Table | Action |
|---|---|
| `profiles` | Modify: drop `subscription_tier`, add new fields |
| `books` | Modify: add shelf_order, section_label, cover_source, cover_dominant_color, drop shelf_position, material_preset, reading_status, current_page |
| `reading_sessions` | Drop |
| `notes` | Drop |
| `photographers` | Drop |
| `photographer_photos` | Drop |
| `share_cards` | Drop |

### New tables (to be created)
| Table | Purpose |
|---|---|
| `book_pages` | One detail page per book, template or canvas |
| `follows` | Follow relationships, anti-comparison RLS |
| `saved_books` | Individual book bookmarks |
| `notifications` | Phase 3+ notification queue |
| `donation_records` | Phase 4 transparency ledger |

### New server-side functions
| Function | Purpose |
|---|---|
| `get_shelf_signal(user_id)` | Returns abstracted signal ("loved" / "spreading" / "widely_loved" / null) instead of raw follower count |

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

## Design system status

| Layer | Location | Status |
|---|---|---|
| Ratios (φ constants) | `lib/phi/ratios.ts` | Not yet created |
| Typography scale | `lib/phi/typography.ts` | Not yet created |
| Color tokens | `lib/phi/colors.ts` | Not yet created |
| Block types | `lib/phi/blocks.ts` | Not yet created |
| Spacing scale | `lib/phi/spacing.ts` | Not yet created |
| Constraint enum | `lib/phi/constraints.ts` | Not yet created |
| Tailwind tokens | `tailwind.config.ts` | Partial, needs update to reference `lib/phi/colors.ts` |

## 3D pipeline status

| Stage | Location | Status |
|---|---|---|
| Procedural book geometry | `components/3d/BookModel.tsx` | Done |
| PBR materials (4 presets) | `lib/three/materials.ts` | Done |
| Lighting + environment | `components/3d/BookshelfScene.tsx` | Done (portrait camera, needs landscape rebuild) |
| Cover texture loading | `hooks/useCoverTexture.ts` | Done (legacy, Step 4a) |
| Cover proxy + dominant color | `app/api/cover-proxy/route.ts` | Not started (Step 4b) |
| Letterbox compositor | `lib/three/coverPipeline.ts` | Not started (Step 4e) |
| Typographic cover generator | `lib/three/typographicCover.ts` | Not started (Step 4d) |
| Spine generator | `lib/three/spineGenerator.ts` | Not started (Step 5) |

## Known tech debt

- `/bookshelf` camera is positioned for portrait-ish desktop view, needs landscape rebuild
- `material_preset` on books table is unused (will be dropped)
- No error boundaries around `<Canvas>`
- No i18n structure yet — temporary `constants/strings.ts` should be introduced as new UI lands to avoid hardcoded strings
- Auth not yet integrated — `/bookshelf` is currently anonymous
