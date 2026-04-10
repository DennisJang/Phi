# Project Phi — Architecture

> Auto-generated codebase map. Updated when features are added/changed.
> Last updated: 2026-04-10 (post Step 4b: cover proxy)

---

## Current state

Phase 1 is past the halfway point. The Phi System (`lib/phi/`) is the
single source of truth for all design tokens. The database is on the
Phi 1.0 schema. The 3D scene renders in spine-on shelf view with
portrait-mode orientation enforcement. The cover-processing pipeline
(Step 4b) is live in production at `/api/cover-proxy`: it fetches a
remote URL, decodes via sharp, samples a four-corner dominant color,
WebP-encodes, and uploads to the `covers` bucket.

What remains for the Phase 1 gate: typographic cover fallback (Step 4d),
user-upload path (Step 4c), letterbox compositor (Step 4e), spine
generator (Step 5), Aladin API integration (Step 6), manual add flow
(Step 7), and real iPad FPS verification (Step 10).

---

## File tree (current, actual)

```
phi/
├── .vscode/
│   └── settings.json                     # Tailwind linter config
├── app/
│   ├── (features)/
│   │   └── bookshelf/
│   │       └── page.tsx                  # horizontal shelf route
│   ├── api/
│   │   └── cover-proxy/
│   │       └── route.ts                  # NEW (Step 4b): cover processor
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
│   ├── image/                            # NEW (Step 4b)
│   │   ├── hash.ts                       # SHA-1 cache key from URL
│   │   ├── fetchRemoteImage.ts           # safe HTTP fetcher (validation)
│   │   └── dominantColor.ts              # sharp four-corner sampler
│   ├── phi/                              # Phi System (single source of truth)
│   │   ├── ratios.ts                     # φ constants + SHELF_YAW_RAD
│   │   ├── typography.ts                 # 5 roles, 2 typefaces
│   │   ├── colors.ts                     # PHI_DARK palette
│   │   ├── spacing.ts                    # 3-step scale
│   │   ├── blocks.ts                     # 7 block types + BookPageContent
│   │   └── constraints.ts                # exhaustive editor manifest
│   ├── supabase/
│   │   ├── client.ts                     # browser client (anon)
│   │   ├── server.ts                     # server client (anon, cookie-based)
│   │   └── admin.ts                      # NEW (Step 4b): service_role client
│   └── three/
│       ├── materials.ts
│       └── useCoverTexture.ts
├── supabase/
│   └── migrations/
│       ├── 20260410_000000_phi_redesign.sql
│       └── 20260410_120000_storage_policies_reset.sql   # NEW (Step 4b)
├── public/
│   └── manifest.json
├── .gitignore
├── next.config.js                        # MODIFIED (Step 4b): sharp external
├── package.json                          # MODIFIED (Step 4b): + sharp
├── postcss.config.js
├── tailwind.config.ts                    # imports from lib/phi/
└── tsconfig.json
```

## File tree (planned, Phase 1 target additions)

```
phi/
├── app/
│   ├── (features)/
│   │   └── book/
│   │       └── new/
│   │           ├── page.tsx              # add book: search or manual
│   │           ├── search/
│   │           │   └── page.tsx          # Aladin search + edition selector
│   │           └── manual/
│   │               └── page.tsx          # manual entry form
│   └── api/
│       └── aladin/
│           └── search/
│               └── route.ts              # Aladin search proxy
├── components/
│   ├── 3d/
│   │   ├── CoverMaterial.tsx             # letterbox compositor material
│   │   └── SpineMaterial.tsx             # auto-generated spine texture
│   ├── ui/
│   │   └── BookAddDialog.tsx             # Phase 1 minimal book add
│   └── icons/
│       └── PhiLogo.tsx                   # Φ mark
├── lib/
│   ├── image/
│   │   ├── typographicCover.ts           # Step 4d fallback generator
│   │   └── letterboxCompositor.ts        # Step 4e
│   ├── three/
│   │   ├── coverPipeline.ts              # ties processed cover → R3F texture
│   │   └── spineGenerator.ts             # Step 5
│   └── aladin/
│       └── client.ts                     # Step 6 typed wrapper
├── types/
│   ├── book.ts                           # Step 6 (Aladin response shape)
│   └── phi.ts
└── stores/
    └── useBookStore.ts                   # minimal Phase 1
```

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
| Path | Method | Runtime | Purpose |
|---|---|---|---|
| `/api/cover-proxy` | GET | nodejs (forced) | Fetch a remote image URL, validate, sharp → WebP, four-corner dominant color, upload to `covers` bucket, return public URL + metadata |

### Planned (Phase 1)
| Path | Method | Purpose |
|---|---|---|
| `/api/aladin/search` | GET | Proxy Aladin search API (hides TTB key) |

### Planned (Phase 2+)
| Path | Method | Purpose |
|---|---|---|
| `/api/google-books/search` | GET | English book search |
| `/api/shelf-signal` | GET | Returns abstracted shelf signal for a username |

---

## Cover proxy contract (Step 4b)

```
GET /api/cover-proxy?url={encoded-source-url}
```

**Success (HTTP 200):**
```json
{
  "ok": true,
  "data": {
    "url": "https://...supabase.co/storage/v1/object/public/covers/{sha1}.webp",
    "dominantColor": "#RRGGBB",
    "width": 500,
    "height": 593
  }
}
```

**Error (HTTP 4xx/5xx):**
```json
{ "ok": false, "error": { "kind": "...", "message": "..." } }
```

**Error kinds and HTTP status mapping:**

| `kind`                  | HTTP | When                                                  |
|-------------------------|------|-------------------------------------------------------|
| `missing_url`           | 400  | `?url=` query parameter absent                        |
| `invalid_url`           | 400  | `new URL()` throws                                    |
| `invalid_scheme`        | 400  | URL is not http: or https:                            |
| `invalid_content_type`  | 415  | Upstream returned non-image/* content                 |
| `too_large`             | 413  | Upstream content > 5 MB                               |
| `timeout`               | 504  | Fetch exceeded 10 s                                   |
| `upstream_status`       | 502  | Upstream returned non-2xx HTTP status                 |
| `network`               | 502  | DNS, TLS, connection, or other transport-level error  |
| `decode_failed`         | 422  | sharp could not parse the image bytes                 |
| `metadata_missing`      | 422  | sharp returned without width/height                   |
| `color_extraction_failed` | 422 | corner sampling failed unexpectedly                   |
| `encode_failed`         | 422  | sharp WebP conversion failed                          |
| `storage_upload_failed` | 500  | Supabase Storage upload error                         |

**Caller responsibility:** the route is a pure transformer. Callers
must persist the returned `url`, `dominantColor`, `width`, `height` to
their own `books` row. There is no in-route cache.

**Idempotency:** the storage path is `{sha1(sourceUrl)}.webp`, and
upload uses `upsert: true`. Same source URL → same key → same public
URL → safe to retry.

**Cold start:** sharp adds ~250 ms to first invocation per Vercel
serverless instance. Subsequent calls in the same container are fast.

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
| Lighting + environment | `components/3d/BookshelfScene.tsx` | Done |
| Cover texture loading (legacy URL→Texture) | `lib/three/useCoverTexture.ts` | Done (Step 4a) |
| Cover proxy + dominant color | `app/api/cover-proxy/route.ts` | **Done (Step 4b)** |
| Safe remote fetcher | `lib/image/fetchRemoteImage.ts` | **Done (Step 4b)** |
| Image processing (sharp + four-corner color) | `lib/image/dominantColor.ts` | **Done (Step 4b)** |
| User upload pipeline | (Step 4c) | Not started |
| Typographic cover generator | (Step 4d) | Not started |
| Letterbox compositor | (Step 4e) | Not started |
| Spine generator | (Step 5) | Not started |

**Scene composition (current)**: Book in base pose (no model-side
rotation). Camera positioned on a horizontal arc around the book
center at yaw = 15° (`SHELF_YAW_RAD`), pitch = 0°. This produces the
Stripe Press 3/4 silhouette: spine dominant, front cover edge as a
perspective sliver, top and bottom faces never visible. OrbitControls
target is the book center `[BOOK_DIMENSIONS.width / 2, 0, 0]`, not the
origin, so inspection drags rotate around the book center rather than
the spine hinge.

---

## Cover proxy pipeline (Step 4b)

```
GET /api/cover-proxy?url=...
        │
        ▼
┌─────────────────────────┐
│ route.ts                │  Orchestrator
│ - Validate ?url=        │
│ - Build cache key       │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│ fetchRemoteImage()      │  Safe HTTP fetch
│ - URL parse + scheme    │
│ - 10s timeout           │
│ - Content-Type check    │
│ - 5MB size cap          │
│ → Buffer or tagged err  │
└─────────┬───────────────┘
          │ Buffer
          ▼
┌─────────────────────────┐
│ processImage()          │  sharp pipeline
│ - sharp.metadata()      │
│ - resize 4×4 + raw      │
│ - corner-pixel average  │
│ - sharp.webp(quality:85)│
│ → ProcessedImage        │
└─────────┬───────────────┘
          │ {webpBuffer, dominantColor, width, height}
          ▼
┌─────────────────────────┐
│ createAdminClient()     │  service_role Supabase
│ .storage.upload()       │  upsert: true
│   covers/{sha1}.webp    │  cacheControl: 1y
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│ getPublicUrl()          │
│ → Return JSON           │
└─────────────────────────┘
```

**Pure functions, tagged error unions, no shared mutable state.** Each
file has one job. Each function returns `{ ok: true, data } | { ok:
false, error }`, never throws across module boundaries. Errors carry
machine-readable `kind` for HTTP mapping.

---

## Supabase connection

| Context | Module | Method | Use |
|---|---|---|---|
| Browser | `lib/supabase/client.ts` | `createBrowserClient()` | Future client-side queries |
| Server (with cookies) | `lib/supabase/server.ts` | `createServerClient()` | Server Components, user-context queries |
| **Admin (no cookies, full access)** | `lib/supabase/admin.ts` | `createAdminClient()` | API routes only — bypasses RLS |

**Admin client discipline**: Never imported by any client-side or
shared-render code. Used only inside `app/api/**/route.ts` files.
Constructed per-request (factory, not singleton) to avoid worker-thread
state leaks. `persistSession: false` to skip session machinery entirely.

---

## Database schema status

**Status**: Phi 1.0 schema applied to Supabase dev project (2026-04-10).
Storage policies reset 2026-04-10 (Step 4b).

### Tables (current, applied)

| Table | Rows | RLS | Notes |
|---|---|---|---|
| `profiles` | 0 | ✓ | display_name, shelf_visibility, theme_preference, language_preference |
| `books` | 0 | ✓ | source CHECK: aladin_api/manual/google_books |
| `book_pages` | 0 | ✓ | one per book, edit_mode template/canvas |
| `follows` | 0 | ✓ | anti-comparison RLS — no "see who follows you" policy |
| `saved_books` | 0 | ✓ | individual book bookmarks |
| `notifications` | 0 | ✓ | Phase 3+ queue |
| `donation_records` | 0 | ✓ | Phase 4 transparency ledger, publicly readable |

### Storage buckets

| Bucket | Public | Limit | MIME types | Notes |
|---|---|---|---|---|
| `covers` | ✓ | 5 MB | image/jpeg, image/png, image/webp | Created 2026-04-10. Single RLS policy: `covers_public_read`. Writes go via service_role from `/api/cover-proxy`. |

5 legacy buckets (`uploads`, `photos`, `thumbnails`, `notes`, `share-cards`)
were removed during Step 4b cleanup along with their 7 RLS policies.

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
| `supabase/migrations/20260410_120000_storage_policies_reset.sql` | 2026-04-10 | Drop 7 legacy storage RLS policies, add `covers_public_read`. Note: legacy bucket DELETE is blocked by `storage.protect_delete()`; the buckets themselves were removed via the Supabase dashboard. |

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
- **`sharp@^0.33`** (added Step 4b — server-side image processing)

### Dependencies removed
- `colorthief@2.7.0` — installed and then uninstalled during Step 4b.
  v2's Buffer-input path failed at runtime in our Node environment.
  Replaced with sharp's four-corner sampling, which has zero extra
  dependencies and matches book cover background structure.

### Dependencies to add (Phase 1 remaining)
- A server-side canvas library for Step 4d (typographic cover generator).
  Candidates: `@napi-rs/canvas`, `@vercel/og`, or `node-canvas`. Verify
  Vercel serverless compat first.

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

### `next.config.js` notes (Step 4b)

`experimental.serverComponentsExternalPackages: ['sharp']` is required
because sharp is a native binary that webpack cannot bundle. This tells
Next.js to leave sharp imports as external `require()` calls resolved
from `node_modules` at runtime.

---

## Infrastructure

| Service | Project | ID | Region |
|---|---|---|---|
| Supabase | Phi | `trbeccbsjnxdkzxlecvv` | ap-northeast-1 (Tokyo) |
| Vercel | phi | `prj_6QvsdRh0vK4kYmAOyKT63yIIvCWX` | iad1 |
| GitHub | DennisJang/Phi | — | — |

## Production URLs

- **Web (dev)**: https://phi-xi-eight.vercel.app
- **Cover proxy** (dev): https://phi-xi-eight.vercel.app/api/cover-proxy
- **Supabase API**: https://trbeccbsjnxdkzxlecvv.supabase.co
- **Custom domain**: none (deferred to Phase 4)

---

## Known tech debt

- `BookModel` dimensions (1.4 × 2.0 × 0.25) are not φ-derived. Should
  be height:width = φ:1 per PROJECT_KNOWLEDGE.md §6.1. Defer to Step 4e
  (letterbox compositor will touch these dimensions).
- No error boundaries around `<Canvas>` — add when cover pipeline
  reaches the 3D scene (Step 4e onward).
- No i18n structure yet — `constants/strings.ts` temporary bucket
  should be introduced as new UI lands; full `next-intl` integration at
  Phase 2 start.
- Auth not yet integrated — `/bookshelf` is currently anonymous, and
  `/api/cover-proxy` has no caller authentication (Phase 1 acceptable
  because the endpoint is public-by-design and pure-transform; revisit
  in Phase 2 with rate limiting at the Vercel edge).
- `OrbitControls` on `/bookshelf` is a Phase 1 dev convenience; Phase 2
  replaces with gesture handlers for tablet-native interaction.
- "drag to inspect · scroll to zoom" hint text on `/bookshelf` is
  dev-era copy. Update to "tap to open · swipe to browse" when gesture
  handlers replace OrbitControls.
- `LandscapeGuard` bilingual copy is hardcoded — permanent exception
  from the Phase 2 i18n system by design (brand statement: "Phi speaks
  ko and en simultaneously").
- No `types/` directory yet. `BookPageContent` and block types live in
  `lib/phi/blocks.ts`, which is fine, but `types/book.ts` will be needed
  at Step 6 (Aladin API response shape).
- **Cover proxy: Next.js "Failed to generate cache key" warning**
  fires on every response. Harmless. Investigate at Phase 1 gate
  review.
- **Cover proxy: HTTP 502 collapses two semantically different cases**
  (DNS/TLS failure vs upstream HTTP 4xx). Acceptable for Phase 1.
  Differentiate in Step 6 if Aladin search needs to distinguish
  "image missing" from "network error".
- **Cover proxy: `error.cause` is dropped from responses.** Server
  logs preserve it; clients only see `kind` + short message. Surface
  it in dev mode if Step 4c upload diagnostics need it.
- **Cover proxy: SSRF undefended.** Phase 1 internal-source assumption
  holds. Step 6 must add an allowlist of image CDN domains
  (`image.aladin.co.kr`, `books.google.com`, etc.) before any
  user-supplied URL can reach this route.
- **`image.aladin.co.kr` remotePattern in `next.config.js`** is a
  legacy from when client code loaded Aladin URLs directly. With the
  new proxy pipeline, only the Supabase CDN hostname is needed on the
  client. Remove during Phase 1 gate review.