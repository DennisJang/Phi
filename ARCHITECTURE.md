# Project Phi — Architecture

> Auto-generated codebase map. Updated when features are added/changed.
> Last updated: 2026-04-08

---

## File tree

```
phi/
├── app/
│   ├── (features)/
│   │   └── bookshelf/
│   │       └── page.tsx         # 3D scene route (Server Component wrapper)
│   ├── globals.css              # Tailwind directives + CSS custom properties
│   ├── layout.tsx               # Root layout: dark canvas, Inter font, viewport
│   └── page.tsx                 # Landing page: Φ logo + "Enter the shelf" link
├── components/
│   └── 3d/
│       ├── BookModel.tsx        # Procedural book geometry (4 meshes grouped)
│       ├── BookshelfScene.tsx   # Canvas + lighting + environment + controls
│       └── PerfPanel.tsx        # r3f-perf dev overlay (prod tree-shaken)
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Browser Supabase client
│   │   └── server.ts            # Server Supabase client (cookies)
│   └── three/
│       └── materials.ts         # PBR material presets (4 covers + page block)
├── public/
│   └── manifest.json            # PWA manifest
├── .gitignore
├── next.config.js               # Image domains: Supabase Storage, Aladin
├── package.json                 # Next 14, R3F, Three, Supabase, Tailwind 3
├── postcss.config.js
├── tailwind.config.ts           # Design tokens
└── tsconfig.json                # Strict mode, path alias @/*
```

## Components registry

| Component | Path | Type | Purpose |
|---|---|---|---|
| RootLayout | `app/layout.tsx` | Server | Dark canvas, font loading, PWA meta |
| Home | `app/page.tsx` | Server | Landing page, link to `/bookshelf` |
| BookshelfPage | `app/(features)/bookshelf/page.tsx` | Server | Route wrapper for 3D scene |
| BookshelfScene | `components/3d/BookshelfScene.tsx` | Client | R3F Canvas, lights, env, controls |
| BookModel | `components/3d/BookModel.tsx` | Client | Procedural book (4 meshes) |
| PerfPanel | `components/3d/PerfPanel.tsx` | Client | Dev-only FPS/drawcall overlay |

## 3D asset / material registry

| Asset | Path | Purpose |
|---|---|---|
| MATERIAL_PRESETS | `lib/three/materials.ts` | PBR configs: hardcover, paperback, leather, glass |
| PAGE_BLOCK_MATERIAL | `lib/three/materials.ts` | Aged paper material for page mesh |
| BOOK_DIMENSIONS | `components/3d/BookModel.tsx` | Exported constants for shelf layout math |

## Routes

| Path | Type | Component |
|---|---|---|
| `/` | Server | `app/page.tsx` |
| `/bookshelf` | Server | `app/(features)/bookshelf/page.tsx` |

## API routes

None yet.

## Supabase connection

| Context | Module | Method |
|---|---|---|
| Browser (Client Components) | `lib/supabase/client.ts` | `createBrowserClient()` |
| Server (Server Components, Actions) | `lib/supabase/server.ts` | `createServerClient()` with cookies |

## Installed packages

### Dependencies
- `next@14.2.35` — Framework
- `react@18.3.1` / `react-dom@18.3.1` — UI
- `@supabase/supabase-js@2.100.1` — Supabase client
- `@supabase/ssr@0.9.0` — Supabase SSR helpers
- `three@0.169.0` — 3D engine
- `@react-three/fiber@8.17.10` — React renderer for Three.js
- `@react-three/drei@9.114.0` — R3F helpers (Environment, OrbitControls, etc.)
- `zustand@5.0.1` — Client state management

### Dev dependencies
- `typescript@5.7.0` — Type checking
- `tailwindcss@3.4.0` — Styling
- `postcss@8.5.8` / `autoprefixer@10.4.27` — CSS processing
- `@types/react@18.3.12` / `@types/react-dom@18.3.1` — React types (matched to React 18)
- `@types/three@0.169.0` — Three.js types
- `@types/node@25.5.0` — Node types
- `r3f-perf@7.2.3` — Dev-only FPS overlay

## Scene composition (current)

```
<Canvas shadows dpr={[1,2]} camera={fov:35, pos:[3,2,4]}>
  <hemisphereLight warm-sky/cool-ground 0.3 />
  <directionalLight key top-right warm castShadow intensity=2.5 />
  <directionalLight rim left-back cool intensity=0.4 />
  <Environment preset="apartment" />
  <BookModel preset="hardcover" />
  <mesh shadowCatcher floor at y=-1.1 />
  <OrbitControls minDist=2 maxDist=10 target=[0.7,0,0] />
  <PerfPanel dev-only />
</Canvas>
```

## Infrastructure

| Service | Project | ID | Region |
|---|---|---|---|
| Supabase | Phi | `trbeccbsjnxdkzxlecvv` | ap-northeast-1 (Tokyo) |
| Vercel | phi | `prj_6QvsdRh0vK4kYmAOyKT63yIIvCWX` | iad1 (Washington) |
| GitHub | DennisJang/Phi | — | — |

## Production URLs

- **Web**: https://phi-xi-eight.vercel.app
- **Supabase API**: https://trbeccbsjnxdkzxlecvv.supabase.co
- **Custom domain**: none (deferred to Phase 4)
