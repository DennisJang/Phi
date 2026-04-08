# Project Phi — Status

> Read this FIRST at the start of every new conversation.
> Updated at the end of each working session by Claude.
> Last updated: 2026-04-08 (session 2)

---

## Current position

- **Phase**: 1 — Foundation + 3D Core
- **Week**: 1 (Day 2)
- **Gate target**: 3D book renders on iPad Safari, cover UV-mapped, book opens/closes

## Last completed

- [x] Project planning and architecture design
- [x] Instagram API verification → BLOCKED, switched to direct upload model
- [x] Tech stack locked: Next.js + R3F + Supabase + Vercel + Capacitor
- [x] Custom Instructions + Project Knowledge created
- [x] Supabase "Phi" project created (Tokyo, trbeccbsjnxdkzxlecvv)
- [x] DB schema applied: 7 tables + RLS + indexes + triggers
- [x] Storage buckets: 6 buckets with RLS policies
- [x] GitHub repo DennisJang/Phi — boilerplate pushed
- [x] Vercel deployment successful: https://phi-xi-eight.vercel.app
- [x] Landing page live: dark canvas + Φ logo
- [x] **R3F + Three.js stack installed** (three, @react-three/fiber, @react-three/drei, zustand, r3f-perf)
- [x] **PBR material presets** (hardcover/paperback/leather/glass + page block)
- [x] **Procedural BookModel** — 4 meshes (front cover, back cover, spine, page block), origin at spine hinge axis
- [x] **BookshelfScene** — warm key light, cool rim light, hemisphere fill, apartment environment map, shadow catcher plane
- [x] **PerfPanel** — dev-only r3f-perf wrapper, tree-shaken in production
- [x] **`/bookshelf` route** with minimal retreating UI chrome
- [x] **Landing page "Enter the shelf" link** added
- [x] **Verified locally**: book renders correctly in Codespaces dev server, all angles confirmed closed geometry
- [x] **`useCoverTexture` hook** — loads image URL as THREE.Texture with sRGB colorspace, anisotropy 8, automatic dispose on unmount/URL change, race-condition-safe via cancelled flag
- [x] **Front cover UV mapping** — BookModel now accepts `coverImageUrl` prop; textured front face uses white base color to prevent preset tinting; other 3 faces unchanged on preset materials
- [x] **Verified locally on Codespaces** — Picsum test URL (1024x1536) loads and renders sharp; color accurate (sRGB working); texture isolated to front face only; no CORS or dispose warnings
- [x] **Committed to `feat/p1-cover-uv-mapping` branch** — Vercel preview deploy triggered

## Phase 1 Gate progress (6 steps)

- [x] Step 1: R3F Canvas mounted with lighting
- [x] Step 2: Book-like procedural geometry
- [x] Step 3: PBR materials
- [x] Step 4: Cover UV mapping (image texture on front face)
- [ ] Step 5: Book open/close ceremony animation
- [ ] Step 6: Aladin API integration for real book metadata

## Next task queue

1. **iPad Safari 실기 검증 (deferred until device available)** — Preview URL on iPad, confirm 60 FPS, cover sharpness at oblique angles, touch gesture compatibility with OrbitControls.
2. **Texture cache centralization (Step 4.5)** — Add module-level `Map<string, Texture>` inside `useCoverTexture.ts` so identical URLs don't trigger duplicate network requests when multiple books share a cover. ~10 min.
3. **Book open animation (Step 5)** — Front cover rotates around spine hinge axis (0° → ~160°) over 800ms, ease-out from design tokens. Page block fans subtly. Use @react-spring/three or framer-motion-3d — evaluate which is lighter before adding.
4. **Aladin API integration (Step 6)** — Server action or route handler: ISBN/query → {title, author, coverImageUrl}. Cache responses in Supabase. Likely needs cover proxy due to CORS (see Known issues).
5. **Wire Aladin cover URL into useCoverTexture** — Closes the Phase 1 gate loop: real book metadata → real cover on 3D model.

## Performance baseline (measured 2026-04-08, session 2)

Scene complexity: 1 book with cover texture (4 meshes, 86 triangles, ~8 draw calls, 16 textures incl. environment map mipmaps)

| Environment | FPS | CPU frame | GPU frame | Notes |
|---|---|---|---|---|
| Desktop Chrome, no throttling | ~60 | ~3.3ms | ~3.0ms | Pre-texture baseline |
| Codespaces forwarded port + DevTools open + perf overlay | ~43 | ~2.3ms | ~5.6ms | Throttled by remote rendering, not representative of native |
| DevTools iPad Air viewport, CPU 4x slowdown | ~30 | ~18ms | ~5.8ms | Worst-case stress simulation |

- Codespaces measurement is UNRELIABLE for iPad prediction — port forwarding adds frame pacing overhead, DevTools Network recording adds CPU load.
- Real iPad testing is the only valid Phase 1 gate check.
- Texture count jump (4 → 16) after HDR envmap fully loaded is expected behavior: `apartment` preset expands into prefiltered cubemap mipmaps.

## Known issues

- Tailwind v3 vs v4: package.json initially had v4, corrected to v3 for PostCSS compatibility
- VS Code shows `@tailwind` unknown rule warning — cosmetic only, no build impact
- No PWA icons yet (icon-192.png, icon-512.png referenced in manifest but not created) — defer to Phase 4
- `npm audit` reports 1 high severity vulnerability in Next 14.2.35 (DoS via Image Optimizer, HTTP smuggling in rewrites). Fix requires Next 16 breaking change. **Deferred to Phase 1 gate closure** to avoid mid-phase framework upgrade risk.
- Case-sensitivity gotcha: file was initially created as `BookShelfScene.tsx` (capital S), renamed to `BookshelfScene.tsx`. Linux/Vercel builds are case-sensitive, Windows/Mac are not — always match imports exactly.
- **Cover aspect ratio mismatch**: Front cover mesh is 1.4:2.0 (0.70), typical book cover image is 2:3 (0.667). Covers with centered text/logos may appear subtly stretched. Deferred until Step 6 — resolve via `texture.repeat`/`offset` for center-crop, or adjust BOOK_WIDTH/HEIGHT constants to 2:3. Picsum landscape test images mask the issue.
- **Aladin image CORS (anticipated)**: `image.aladin.co.kr` may not send `Access-Control-Allow-Origin: *`. If confirmed in Step 6, three options: (a) Next.js `/api/cover-proxy` route, (b) Supabase Storage cache-on-first-fetch, (c) Next Image Optimizer via `next.config.js` remotePatterns. Option (c) is lowest effort.
- **Material preset vs cover texture semantics**: `leather` and `glass` presets currently accept `coverImageUrl` but visually conflict with the texture. Consider restricting cover textures to `hardcover`/`paperback` only, or documenting the limitation. Deferred to post-gate.


## Environment notes

- Supabase anon key + URL set in Vercel env vars (all environments)
- service_role key NOT yet added (needed when server actions are implemented)
- Auth providers not yet configured (Google/Apple OAuth — deferred to Week 2)
- Dev environment: GitHub Codespaces (Linux, case-sensitive filesystem)
- No iPad / Galaxy Tab yet — testing via Chrome DevTools Device Mode only

## Decisions pending

- Serif font loading: Cormorant Garamond via next/font or self-hosted?
- Test devices: Owner needs to confirm iPad model + Galaxy Tab model
- Aladin API key: Owner needs to register at aladin.co.kr (needed Week 3)
- **Custom domain**: safehomepro.co.kr is owned but name mismatch with Phi brand. Decision: defer domain to Phase 4 when brand naming is finalized; consider dedicated brand domain (e.g., phi.app, readphi.com) at that point.
- **Next.js upgrade path**: Stay on 14.2.35 through Phase 1, upgrade at gate closure to address audit vulnerabilities.
