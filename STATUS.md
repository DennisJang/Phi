# Project Phi — Status

> Read this FIRST at the start of every new conversation.
> Updated at the end of each working session by Claude.
> Last updated: 2026-04-08

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

## Phase 1 Gate progress (6 steps)

- [x] Step 1: R3F Canvas mounted with lighting
- [x] Step 2: Book-like procedural geometry
- [x] Step 3: PBR materials
- [ ] Step 4: Cover UV mapping (image texture on front face)
- [ ] Step 5: Book open/close ceremony animation
- [ ] Step 6: Aladin API integration for real book metadata

## Next task queue

1. **Cover UV mapping** — Load an image URL as a THREE.Texture, apply to front cover mesh only (other faces keep preset material). Handle loading/error states.
2. **Cover texture caching** — Once UV mapping works, route texture loads through a centralized cache to avoid re-downloading when switching between books.
3. **Book open animation** — Cover rotates around spine hinge axis (0° → ~160°), ceremony speed 800ms, ease-out curve from design tokens. Page block reacts with subtle fan.
4. **Aladin API integration** — Server action or route handler that takes ISBN/query, returns {title, author, coverImageUrl}. Cache responses.
5. **Wire Aladin cover URL into UV mapper** — Close the loop: real book → real cover on 3D model.

## Performance baseline (measured 2026-04-08)

Scene complexity: 1 book (4 meshes, 86 triangles, 8 draw calls)

| Environment | FPS | CPU frame | GPU frame | Notes |
|---|---|---|---|---|
| Desktop Chrome, no throttling | ~60 | ~3.3ms | ~3.0ms | Healthy headroom |
| DevTools iPad Air viewport, CPU 4x slowdown | ~30 | ~18ms | ~5.8ms | Stress simulation only |

- Desktop 60fps with 13ms CPU headroom suggests real iPad Air (M1) will comfortably hit 60fps
- CPU 4x throttling is more severe than actual iPad Air; treat as worst-case, not target
- Real iPad testing still required at Phase 1 gate closure

## Known issues

- Tailwind v3 vs v4: package.json initially had v4, corrected to v3 for PostCSS compatibility
- VS Code shows `@tailwind` unknown rule warning — cosmetic only, no build impact
- No PWA icons yet (icon-192.png, icon-512.png referenced in manifest but not created) — defer to Phase 4
- `npm audit` reports 1 high severity vulnerability in Next 14.2.35 (DoS via Image Optimizer, HTTP smuggling in rewrites). Fix requires Next 16 breaking change. **Deferred to Phase 1 gate closure** to avoid mid-phase framework upgrade risk.
- Case-sensitivity gotcha: file was initially created as `BookShelfScene.tsx` (capital S), renamed to `BookshelfScene.tsx`. Linux/Vercel builds are case-sensitive, Windows/Mac are not — always match imports exactly.

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
