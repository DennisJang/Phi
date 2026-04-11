# Project Phi — Architecture

> Auto-generated codebase map. Updated when features are added/changed.
> Last updated: 2026-04-10 (post Step 4c: user upload pipeline)

---

## Current state

Phase 1 is past the halfway point. The Phi System (`lib/phi/`) is the
single source of truth for all design tokens. The database is on the
Phi 1.0 schema. The 3D scene renders in spine-on shelf view with
portrait-mode orientation enforcement. Two of the three cover sources
are live: `/api/cover-proxy` (Step 4b) for remote URLs and
`/api/cover-upload` (Step 4c) for user-uploaded files. Both share the
same `processImage()` sharp pipeline and return the same response
shape, so downstream consumers can treat them as a single interface.

Phase 1 introduces its first identity layer via Supabase anonymous
sign-in. Every page load mints (or resumes) an anonymous auth.users
row via `AnonymousBootstrap`, giving API routes a real `auth.uid()`
to authorize against and allowing RLS to enforce
`covers/{user_id}/...` isolation on uploads.

What remains for the Phase 1 gate: typographic cover fallback (Step 4d),
letterbox compositor (Step 4e), spine generator (Step 5), Aladin API
integration (Step 6), manual add flow (Step 7), and real iPad FPS
verification (Step 10).

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
│   │   ├── cover-proxy/
│   │   │   └── route.ts                  # Step 4b: remote URL → cover
│   │   └── cover-upload/                 # NEW (Step 4c)
│   │       └── route.ts                  # user upload → cover
│   ├── dev/                              # NEW (Step 4c)
│   │   └── upload/
│   │       └── page.tsx                  # scratch form, delete at gate
│   ├── globals.css                       # @layer base resets only
│   ├── layout.tsx                        # MODIFIED (Step 4c): + AnonymousBootstrap wrap
│   └── page.tsx                          # landing
├── components/
│   ├── 3d/
│   │   ├── BookModel.tsx                 # procedural book geometry
│   │   ├── BookshelfScene.tsx            # spine-on camera composition
│   │   └── PerfPanel.tsx                 # dev-only FPS overlay
│   │   ├── CoverMaterial.tsx             # Step 4e: letterbox shader
│   ├── auth/                             # NEW (Step 4c)
│   │   └── AnonymousBootstrap.tsx        # session bootstrap + Context
│   └── ui/
│       └── LandscapeGuard.tsx            # portrait unmount guard
├── lib/
│   ├── image/
│   │   ├── hash.ts                       # MODIFIED (Step 4c): + hashImageBytes
│   │   ├── fetchRemoteImage.ts           # safe HTTP fetcher (4b)
│   │   └── processImage.ts               # RENAMED from dominantColor.ts (Step 4c)
│   ├── phi/                              # Phi System (single source of truth)
│   │   ├── ratios.ts
│   │   ├── typography.ts
│   │   ├── colors.ts
│   │   ├── spacing.ts
│   │   ├── blocks.ts
│   │   └── constraints.ts
│   ├── supabase/
│   │   ├── client.ts                     # MODIFIED (Step 4c): singleton + ensureAnonymousSession
│   │   ├── server.ts                     # async createClient (cookie-based)
│   │   └── admin.ts                      # service_role client (4b)
│   └── three/
│       ├── materials.ts
│       ├── bookDimensions.ts             # Step 4e: extracted from BookModel
│       └──coverPipeline.ts              # Step 4e: URL → {texture, color, aspect}
├── supabase/
│   └── migrations/
│       ├── 20260410_000000_phi_redesign.sql
│       ├── 20260410_120000_storage_policies_reset.sql   # Step 4b
│       └── 20260410_140000_covers_user_upload_policies.sql  # NEW (Step 4c)
├── public/
│   └── manifest.json
├── .gitignore
├── next.config.js                        # sharp external (Step 4b)
├── package.json                          # sharp dep (Step 4b)
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
| RootLayout | `app/layout.tsx` | Server | Dark canvas, font, PWA meta, AnonymousBootstrap + LandscapeGuard wrap |
| Home | `app/page.tsx` | Server | Landing page with Φ mark and entry link |
| BookshelfPage | `app/(features)/bookshelf/page.tsx` | Server | Shelf route wrapper with retreating chrome |
| BookshelfScene | `components/3d/BookshelfScene.tsx` | Client | R3F Canvas with spine-on camera (15° yaw, 0° pitch) |
| BookModel | `components/3d/BookModel.tsx` | Client | Procedural book (4 meshes, spine hinge origin) |MODIFIED (Step 4e): CoverMaterial injection
| PerfPanel | `components/3d/PerfPanel.tsx` | Client | Dev-only FPS overlay (r3f-perf) |
| LandscapeGuard | `components/ui/LandscapeGuard.tsx` | Client | Portrait-mode overlay, unmounts children entirely |
| **AnonymousBootstrap** | `components/auth/AnonymousBootstrap.tsx` | Client | **Session bootstrap on first mount; exposes `useAnonymousSession()` Context to descendants** |
| **DevUploadPage** | `app/dev/upload/page.tsx` | Client | **Scratch form for 4c verification; delete at Phase 1 gate** |
 CoverMaterial + bookDimensions

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
| `/dev/upload` | Client | `app/dev/upload/page.tsx` — **scratch form, delete at gate** |

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
| Path | Method | Runtime | Auth | Purpose |
|---|---|---|---|---|
| `/api/cover-proxy` | GET | nodejs | none (public) | Fetch remote image URL, validate, sharp → WebP, four-corner dominant color, upload to `covers` bucket root via service_role, return public URL + metadata |
| `/api/cover-upload` | POST | nodejs | **`getUser()` required** | Accept multipart file upload, validate, sharp → WebP, four-corner dominant color, upload to `covers/{user_id}/...` via cookie-bound client (RLS-enforced), return public URL + metadata |

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

## Cover pipeline contracts

Both `/api/cover-proxy` and `/api/cover-upload` return the same shape
so downstream code can handle all sources uniformly.

**Success (HTTP 200):**
```json
{
  "ok": true,
  "data": {
    "url": "https://...supabase.co/storage/v1/object/public/covers/...",
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

### `/api/cover-proxy` (Step 4b) — remote URL input

```
GET /api/cover-proxy?url={encoded-source-url}
```

Error kinds: `missing_url` (400), `invalid_url` (400), `invalid_scheme` (400),
`invalid_content_type` (415), `too_large` (413), `timeout` (504),
`upstream_status` (502), `network` (502), `decode_failed` (422),
`metadata_missing` (422), `color_extraction_failed` (422),
`encode_failed` (422), `storage_upload_failed` (500).

Storage path: `{sha1(sourceUrl)}.webp` at bucket root, written with
service_role (RLS bypassed). Idempotent via upsert.

### `/api/cover-upload` (Step 4c) — user file input

```
POST /api/cover-upload
Content-Type: multipart/form-data
Body field: file
```

Error kinds: `unauthenticated` (401), `invalid_form_data` (400),
`missing_file` (400), `empty_file` (400), `too_large` (413),
`invalid_content_type` (415), `read_failed` (400), plus the full
`processImage` error set (`decode_failed`, `metadata_missing`,
`color_extraction_failed`, `encode_failed` — all 422),
`storage_upload_failed` (500).

Storage path: `{user_id}/{sha1(fileBytes)}.webp` under the uploader's
folder, written via the cookie-bound server client so
`covers_user_insert_own_folder` RLS enforces isolation. Idempotent
via upsert.

Validation is two-layered: shallow (declared MIME in allowlist,
declared size ≤ 5MB) to fail honest mistakes cheaply, and deep
(sharp decode via `processImage`) as the real security boundary.
Client Content-Type is never trusted on its own.

**Caller responsibility (both routes):** persist the returned `url`,
`dominantColor`, `width`, `height` to the `books` row. No in-route
cache.

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

---

## 3D pipeline status

| Stage | Location | Status |
|---|---|---|
| Procedural book geometry | `components/3d/BookModel.tsx` | Done |
| PBR materials (4 presets) | `lib/three/materials.ts` | Done |
| Lighting + environment | `components/3d/BookshelfScene.tsx` | Done |
| Cover texture loading (legacy URL→Texture) | `lib/three/useCoverTexture.ts` | Done (Step 4a) |
| Cover proxy + dominant color | `app/api/cover-proxy/route.ts` | Done (Step 4b) |
| Safe remote fetcher | `lib/image/fetchRemoteImage.ts` | Done (Step 4b) |
| Shared image processing | `lib/image/processImage.ts` | Done (Step 4b, renamed 4c) |
| **User upload pipeline** | `app/api/cover-upload/route.ts` | **Done (Step 4c)** |
| Typographic cover generator | (Step 4d) | Not started |
| Letterbox compositor | (Step 4e) | Done (Step 4e)
| Spine generator | (Step 5) | Not started |
| Cover pipeline adapter | `lib/three/coverPipeline.ts` | Done (Step 4e) |
| Letterbox shader | `components/3d/CoverMaterial.tsx` | Done (Step 4e) |

---

## Identity & auth status

| Layer | Status | Notes |
|---|---|---|
| Anonymous sign-in | **Done (Step 4c)** | Dashboard toggle + `ensureAnonymousSession()` helper + `AnonymousBootstrap` component |
| Email magic link | Planned (Phase 2) | — |
| Google OAuth | Planned (Phase 2) | — |
| Apple Sign In | Planned (Phase 4) | Required for iOS App Store |
| Username system | Planned (Phase 3) | — |
| linkIdentity migration | Planned (Phase 2 start) | Links anonymous → real identity so Phase 1 data persists |

**Session flow:**
```
Page load
  ↓
<AnonymousBootstrap> mounts (client, outside LandscapeGuard)
  ↓
ensureAnonymousSession():
  - Returns cached result if tab already has one
  - Returns in-flight promise if a call is already running
  - Otherwise: getSession() → if none, signInAnonymously()
  ↓
auth.users row (is_anonymous=true) + JWT + cookie
  ↓
Context value { status: 'ready', userId, isAnonymous } exposed to tree
  ↓
Consumers read via useAnonymousSession() hook
```

**In-flight dedup rationale:** React Strict Mode (dev), Suspense, and
streaming can invoke effects more than once before the first call
resolves. Without dedup, each invocation would mint a separate
anonymous user row. The module-level in-flight promise guarantees
exactly one `signInAnonymously()` call per browser tab session.

---

## Image pipeline (shared by 4b and 4c)

```
Input (URL or file bytes)
        │
        ▼
┌─────────────────────────┐
│ fetchRemoteImage()  (4b)│
│      OR                 │
│ file.arrayBuffer()  (4c)│
└─────────┬───────────────┘
          │ Buffer
          ▼
┌─────────────────────────┐
│ processImage()          │  Shared sharp pipeline
│ - sharp.metadata()      │  (lib/image/processImage.ts)
│ - resize 4×4 + raw      │
│ - corner-pixel average  │
│ - sharp.webp(quality:85)│
│ → ProcessedImage        │
└─────────┬───────────────┘
          │ {webpBuffer, dominantColor, width, height}
          ▼
┌─────────────────────────┐
│ Supabase Storage upload │
│  4b: createAdminClient  │  → covers/{sha1(url)}.webp
│      (service_role,     │     (RLS bypassed)
│       RLS bypassed)     │
│  4c: createServerClient │  → covers/{user_id}/{sha1(bytes)}.webp
│      (cookie-bound,     │     (RLS enforced)
│       RLS enforced)     │
└─────────┬───────────────┘
          │
          ▼
   { url, dominantColor, width, height }
```

**Single shared transformer, two orchestrators.** The sharp pipeline
is identical; only the input source and storage path strategy differ.

---

## Supabase connection

| Context | Module | Method | Use |
|---|---|---|---|
| Browser | `lib/supabase/client.ts` | `createClient()` (singleton) | Client components; `ensureAnonymousSession()` bootstrap |
| Server (with cookies) | `lib/supabase/server.ts` | `createClient()` (async) | Server Components, user-context API routes (`/api/cover-upload`) |
| Admin (no cookies, full access) | `lib/supabase/admin.ts` | `createAdminClient()` | Service_role-only API routes (`/api/cover-proxy`) |

**Admin client discipline**: Never imported by any client-side or
shared-render code. Used only inside routes that must bypass RLS.
Constructed per-request (factory, not singleton). `persistSession: false`.

**Browser client discipline**: Singleton since Step 4c. All client
components must go through `createClient()` from `lib/supabase/client.ts`
to share the same session state. Never construct `createBrowserClient`
directly from component code.

**Server client discipline**: `createClient()` in `lib/supabase/server.ts`
is **async** (awaits `cookies()`). API routes must `await createClient()`
before using it. For auth decisions, always use `supabase.auth.getUser()`
(not `getSession()`) — `getUser()` verifies the JWT signature with
Supabase, while `getSession()` only parses the local cookie.

---

## Database schema status

**Status**: Phi 1.0 schema applied to Supabase dev project (2026-04-10).
Storage policies reset 2026-04-10 (Step 4b). User upload policies
added 2026-04-10 (Step 4c).

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

### Auth

- Supabase Auth **anonymous sign-in enabled** (2026-04-10, Step 4c)
- `auth.users` rows with `is_anonymous = true` are created by
  `ensureAnonymousSession()` from the browser client. RLS treats
  them identically to real authenticated users.

### Storage buckets

| Bucket | Public | Limit | MIME types | Notes |
|---|---|---|---|---|
| `covers` | ✓ | 5 MB | image/jpeg, image/png, image/webp | Two write paths coexist: (a) `{sha1}.webp` at bucket root via service_role from `/api/cover-proxy`; (b) `{user_id}/{sha1}.webp` via cookie-bound client from `/api/cover-upload`, RLS-enforced. |

### Storage RLS policies (covers bucket)

| Policy | Command | Role | Predicate |
|---|---|---|---|
| `covers_public_read` | SELECT | public | always |
| `covers_user_insert_own_folder` | INSERT | authenticated | `(storage.foldername(name))[1] = auth.uid()::text` |
| `covers_user_update_own_folder` | UPDATE | authenticated | same (using + with check) |
| `covers_user_delete_own_folder` | DELETE | authenticated | same |

`service_role` bypasses all of the above, which is why `/api/cover-proxy`
can continue writing `{sha1}.webp` at bucket root without matching
any of the user-scoped policies.

### Server-side functions

| Function | Purpose |
|---|---|
| `public.get_shelf_signal(uuid) → text` | SECURITY DEFINER. Returns abstracted signal instead of raw follower count. |

### Migrations

| File | Applied | Summary |
|---|---|---|
| `supabase/migrations/20260410_000000_phi_redesign.sql` | 2026-04-10 | Full redesign — drop 5 deprecated tables, reshape profiles and books, create 5 new tables, rewrite 12 RLS policies, add get_shelf_signal function, create 8 indexes |
| `supabase/migrations/20260410_120000_storage_policies_reset.sql` | 2026-04-10 | Drop 7 legacy storage RLS policies, add `covers_public_read`. |
| `supabase/migrations/20260410_140000_covers_user_upload_policies.sql` | 2026-04-10 | Add 3 storage RLS policies for user-scoped uploads: `covers_user_insert_own_folder`, `covers_user_update_own_folder`, `covers_user_delete_own_folder`. |

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
- `sharp@^0.33` (Step 4b, server-side image processing)

No new runtime dependencies added in Step 4c — reuses `@supabase/ssr`
(already installed), `sharp` (already installed), and Node `crypto`.

### Dependencies to add (Phase 1 remaining)
- A server-side canvas library for Step 4d. Candidates:
  `@napi-rs/canvas`, `@vercel/og`, or `node-canvas`.

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
- **Cover upload** (dev): https://phi-xi-eight.vercel.app/api/cover-upload
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
- Auth: only anonymous sign-in active. Real auth + rate limiting
  comes in Phase 2.
- `OrbitControls` on `/bookshelf` is a Phase 1 dev convenience.
- "drag to inspect · scroll to zoom" hint text on `/bookshelf` is
  dev-era copy.
- `LandscapeGuard` bilingual copy is hardcoded — permanent exception
  from the Phase 2 i18n system by design.
- No `types/` directory yet. `types/book.ts` will be needed at
  Step 6 (Aladin API response shape).
- **Cover proxy: Next.js "Failed to generate cache key" warning**
  fires on every response. Harmless.
- **Cover proxy: HTTP 502 collapses two semantically different cases**.
- **Cover proxy: `error.cause` is dropped from responses.**
- **Cover proxy: SSRF undefended.** Phase 1 internal-source assumption
  holds. Step 6 must add an allowlist before any user-supplied URL
  can reach this route.
- **`image.aladin.co.kr` remotePattern in `next.config.js`** is a
  legacy from Step 4a. Remove during Phase 1 gate review.
- **(Step 4c) `/dev/upload` scratch page** must be deleted at the
  Phase 1 gate or replaced by the real BookAddDialog flow.
- **(Step 4c) Anonymous users have no cleanup strategy** — rows
  accumulate. Add scheduled cleanup before Phase 1 gate.
- **(Step 4c) Anonymous sign-in has no rate limit** — Phase 2 will
  add edge rate limiting.
- **(Step 4c) Content-addressed storage has no GC** — dangling
  Storage objects will accumulate when Phase 2 adds book deletion.
  Wire deletion to Storage removal at that time.