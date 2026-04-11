# Project Phi — Decision History

> Historical decisions superseded, contextualized, or simply logged.
> The living Decisions Log in PROJECT_KNOWLEDGE.md §9 keeps only
> principles still in active force. This file is the append-only
> archive for everything else.
> Created 2026-04-11 during prune.

---

## Foundational decisions (2026-03-29 – 2026-04-08)

| Date | Decision | Rationale |
|---|---|---|
| 2026-03-29 | Web app (React) over native (SwiftUI) | Claude produces + tests React instantly; Capacitor wraps later |
| 2026-03-29 | No Instagram API | Basic Display deprecated; Graph API restricted |
| 2026-03-29 | Capacitor for store distribution | Same codebase for web + iOS + Android |
| 2026-04-08 | Next.js pinned at 14.2.35 through Phase 1 | Avoid mid-phase framework upgrade risk |

## Design language lock-in (2026-04-10)

| Decision | Rationale |
|---|---|
| Design language split: MD Vinyl (object) + Stripe Press (layout) | Same philosophy, two faces — not a forced merger |
| Tablet landscape only, phone deferred | Small screen demands independent redesign |
| Korean + English only | Controlled i18n complexity, matches primary market |
| Single main shelf per user + section labels | Chose Instagram's "saved" model over Spotify's "multiple playlists" |
| Follower counts hidden forever | Anti-comparison is core philosophy |
| Shelf save counts shown to owner only, abstracted to others | Motivation without comparison |
| Private shelf by default | Privacy before exposure |
| Cover mapping: dominant color letterbox (Q8-c) | Object-first integration |
| Book thickness fixed, not scaled by page count | Consistency > realism |
| Aladin (ko) + Google Books (en) as only metadata sources | Avoid scraping |
| Book open animation (old Step 5) abandoned | Core is ownership + display, not opening ceremony |
| LLM editing removed entirely | Free app philosophy; template + constrained block editor sufficient |
| No payment processing ever | Revenue from affiliates → 10% donation. Users never pay. |
| Non-replication principle | Observation → inspiration → own recreation is the learning loop |
| Phi System applied across 5 layers | Object, layout, typography, interaction, brand — all bound by φ |

## Phi System implementation (2026-04-10)

| Decision | Rationale |
|---|---|
| `bgCanvas` shifted from `#0A0A0A` to `#1A1612` | Stripe Press warm dark — books feel held, not isolated |
| Shelf camera: yaw 15°, pitch 0° | Visual calibration. Spine dominant, front cover sliver, no top/bottom faces. Pitch 0 preserves vertical silhouette. |
| Phi System Tailwind binding via import | `tailwind.config.ts` imports from `lib/phi/`. No hardcoded tokens. |
| 5 legacy Storage buckets removed, `covers` only | All empty. Photographer + LLM note remnants. |

## Cover pipeline decisions (2026-04-10)

| Decision | Rationale |
|---|---|
| Cover proxy: no in-route cache (pure transformer) | supabase-js `list()` doesn't return user metadata. Caller's DB row is the cache. |
| Removed colorthief, switched to sharp 4-corner sampling | v2 Buffer path failed at runtime. Book covers have edge-dominant backgrounds; 4-corner beats MMCQ on this data shape. |
| Cover proxy caller persists result to `books.cover_image_url` + `cover_dominant_color` | Proxy = transformation service; DB writes = separate concern. |

## Phase 1 identity layer (2026-04-10)

| Decision | Rationale |
|---|---|
| Phase 1 identity: Supabase anonymous sign-in | Step 4c needs `auth.uid()` for RLS; full auth is Phase 2. Anonymous sign-in gives real `auth.users` row. Phase 2 migration via `linkIdentity()`. |
| `ensureAnonymousSession()` module-level in-flight dedup | Strict Mode + Suspense invoke effects multiple times. Per-effect flag only blocks React state; in-flight requests still complete. Module-level promise guarantees exactly one call per tab. |
| Browser Supabase client is singleton | Multiple `createBrowserClient()` instances fragment auth state. `lib/supabase/client.ts` caches first instance. |
| Two-layer upload validation: shallow + sharp decode | Client headers aren't a security boundary. Sharp is the real decoder. Shallow layer fails honest mistakes cheaply. |

## Geometry + material redesigns (2026-04-11)

| Decision | Rationale |
|---|---|
| Book thickness decoupled from φ formula | §6.1 `width × 1/φ²` = 0.535 read as a brick under 15° yaw camera. Now `BASE_SCALE × 0.25 = 0.350`. Height:width = φ:1 preserved. |
| Front cover ShaderMaterial (letterbox), back/spine meshStandardMaterial (Stehttps://markdown.kr/?lang=ko#p 4e) | Single-draw letterbox composite. Tradeoff: front loses PBR scene lighting; back + spine retain it. |
| `dominantColor` recomputed client-side (4-corner sampling, Step 4e) | Server value not yet persisted until Step 7. Same algorithm as server → free regression signal later. |
| **Step 4f: unified CoverMaterial via `onBeforeCompile` on meshStandardMaterial** | All 3 faces (front/spine/back) share the same patched material class. Front gets texture + letterbox, spine + back get solid `coverBaseColor`. Restores PBR response on all faces. |
| **Step 4f: single `coverBaseColor` (edge 28-pixel average, center 4×4 excluded)** | Replaced 2-color top/bottom strategy. Stripe Press books don't have top/bottom bands — they have a single cover base with image on top. luminance-min spine trick polished. |
| **Step 4f: cover slab covers full `W × H`, page block inset on 3 non-spine sides** | Previous `COVER_SLAB_WIDTH = W - COVER_THICKNESS` left page block flush with spine, protruding only at fore-edge. Correct Stripe Press silhouette requires page block visible at top, bottom, and fore-edge. |
| **Step 4f: procedural paper normalMap on page block** | Runtime DataTexture, module singleton, zero asset bundle impact. Reveals Stripe Press horizontal grain under grazing light. |
| **Step 4f: BookshelfScene grazing light rig** | Lowered key light (y=6 → y=2), added horizontal rim light (y=0.3), capped Environment intensity to 0.25. Previous top-down + full-strength environment washed normalMap out of existence. |

## Step 4d closed (2026-04-11)

| Decision | Rationale |
|---|---|
| Renderer: `@napi-rs/canvas` | Stripe Press serif typography needs precise font metrics. Vercel iad1 prebuilt binary verified on PR preview. |
| Fonts: Noto Serif KR + Noto Sans KR variable, in `assets/fonts/` (NOT `public/`) | `outputFileTracingIncludes` scopes 33MB to `/api/cover-generate` only. Other functions stay slim. |
| `serverComponentsExternalPackages` includes `@napi-rs/canvas` | Native binary, must not be webpack-bundled. Same pattern as `sharp`. |
| Deterministic seed: `sha1(title|author) → HSL` (Hue full, Sat 35-50%, Lum 18-28%) | Same input → same PNG → same SHA1 → Storage dedup. Warm dark range matches Stripe Press tone. |
| `/api/cover-generate` reuses `processImage()` via railway-oriented `Result` handling | Identical post-processing as 4b/4c. Errors propagated as `ProcessImageError` discriminated union, not flattened. |
| RLS path `covers/{user_id}/{sha1}.webp` | Same as 4c. `covers_user_insert_own_folder` policy enforced. |
| Step 4d-4 (dev tab Generate section) **skipped** | BookModel substitution (option B) gave faster feedback loop than dev tab. dev/upload stays as-is until Step 7 deletion. |
| **4d closure visual verification** | Image 1: front face letterbox + 데미안 글자 정상. Image 2: spine + back wine tone, paper normalMap fore-edge OK (4f no regression). Image 4 + final: page block top = cream `#F0E6D3` confirmed, paper normalMap intact. Step 4f no regression. |

**Deferred from 4d (logged in LEARNINGS)**:
- Letterbox color mismatch: client `coverPipeline.ts` 4-corner sampling produces pink/lilac instead of wine `#4B203E` for typographic covers. Vignette + sampling-region averaging breaks the "edge solid color" assumption that 4-corner is built on. Phase 2: cover pipeline unification.
- CJK short titles ("데미안" 3 chars) under-fill the safe area at fixed 96px. Dynamic title sizing for short CJK deferred.
- NotoSerifKR variable-font weight 700 axis rendering acceptable but not verified rigorous.