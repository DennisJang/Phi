# Project Phi — Project Knowledge Base

> This file is the single source of truth for all verified decisions, architecture, and design specifications.
> Last updated: 2026-04-10

---

## 1. Product Definition

**One sentence**: Phi is a free tablet app that lets readers digitally own, display, and record their books as 3D objects. 10% of affiliate revenue is donated to reading-related causes.

**Target user**: iPad / Android tablet users (teens to adults) who treat reading as identity expression and want a beautiful way to own, curate, and share their library — not just consume text.

**Four core value axes**:
- **Ownership** — Every book is a 3D object with an accurately mapped cover. Physical ownership's joy, digital form's infinity.
- **Display** — Shelves can be shared and discovered. Stripe Press-inspired layout with MD Vinyl-level object fidelity.
- **Record** — Each book has a detail page for reader's own reflection, crafted within constrained design tokens.
- **Encouragement** — Free forever. Follower counts hidden. 10% of affiliate revenue donated. No paywalls between reader and reading.

**Guiding philosophy (North Star)**:
> *Consistency builds trust, and trust builds a fanbase.*
> Every design and product decision must answer to this line.

---

## 2. Verified Technical Decisions

### 2.1 Stack
- **Frontend**: Next.js 14 (App Router) + React Three Fiber + TailwindCSS 3
- **Backend**: Supabase (Auth, PostgreSQL, Storage, Edge Functions)
- **Hosting**: Vercel
- **Native wrapper**: Capacitor.js (Phase 4 only)
- **3D format**: Procedural geometry (Phase 1) → GLTF option later if needed
- **Design tool**: Figma (Figma Make available)

### 2.2 Distribution strategy
- Phase 1–3: Web PWA for tablet landscape
- Phase 4: Capacitor wrap → App Store (iOS) + Play Store (Android)
- Phone version: deferred indefinitely (post-Phase 4, independent redesign)

### 2.3 Platform constraint (critical)
- **Tablet landscape only** for Phase 1–4
- Viewport hint: `screen-orientation: landscape`
- Portrait mode shows "Please rotate your device" overlay
- Phone is not a shrunken tablet — it will require independent design when that time comes

### 2.4 Languages
- **Korean (ko) and English (en) only** for Phase 1–4
- All UI strings must be externalized to i18n files from Phase 2 onward
- No hardcoded user-facing strings in components
- Default language: browser detection, user-overridable

---

## 3. Design Language

### 3.1 Two design languages, one philosophy

Phi draws from two references that turn out to share the same soul:

- **Object layer = MD Vinyl** — obsessive tactile detail on the 3D book itself. Museum spotlight on a single artifact.
- **Layout layer = Stripe Press** — vertical stacking (translated to horizontal on tablet landscape), dim-out focus on hover/select, minimal chrome, editorial typography.

These two are not competing — they are two faces of the same philosophy: *one object at a time, everything else recedes*.

### 3.2 Core principles
1. **Object-first, UI-second** — The 3D book is the hero. UI chrome is minimal, translucent, retreats.
2. **Dark canvas, warm objects (default)** — Near-black background, warmly lit objects. Light canvas is an opt-in theme.
3. **Ritual over efficiency** — Deliberate, weighted interactions. Speed is sacrificed for ceremony where it serves emotion.
4. **Ma (間)** — Generous negative space. Emptiness is presence.
5. **Consistency is trust** — Every design token is constrained. No free-form styling anywhere.

### 3.3 Two canvas themes
- **Phi Dark** (default): near-black canvas, warm-lit objects, dominant-color-darkest detail pages
- **Phi Light** (opt-in, Phase 2): cream canvas, warm-lit objects, dominant-color-lightest detail pages
- User preference stored in `profiles.theme_preference`
- Per-page override allowed via `book_pages.theme_override`

### 3.4 Typography
- **Serif** for literary content (headings, quotes, body text in book pages)
- **Sans-serif** for UI chrome (navigation, labels, buttons)
- Never mix more than 2 typefaces per screen
- Scale is golden-ratio based (see §17)

### 3.5 Color tokens (Phi Dark)
```css
/* Background */
--bg-canvas: #0A0A0A;
--bg-surface: #141414;
--bg-elevated: #1A1A1A;
--bg-overlay: #242424;

/* Text */
--text-primary: #F5F0E8;
--text-secondary: #A09888;
--text-tertiary: #6B6156;

/* Accent (warm) */
--accent-gold: #D4A574;
--accent-cream: #F0E6D3;
--accent-ink: #2C1810;

/* Interactive (cool, reserved for action) */
--interactive-primary: #7B9EBF;
--interactive-hover: #9BB8D4;
```

### 3.6 Color tokens (Phi Light) — Phase 2
```css
--bg-canvas: #F5F0E8;
--bg-surface: #EFE8DC;
--bg-elevated: #E8DFCF;
--bg-overlay: #DED3BF;

--text-primary: #1A1410;
--text-secondary: #4A4038;
--text-tertiary: #7A6F63;

--accent-gold: #B8864D;
--accent-cream: #F0E6D3;
--accent-ink: #2C1810;

--interactive-primary: #3D6A8F;
--interactive-hover: #2A5578;
```

### 3.7 Animation
- Easing: `cubic-bezier(0.382, 0, 0.618, 1)` (golden-ratio ease-in-out)
- Durations: `382ms` (fast), `618ms` (default), `1000ms` (slow ceremony)
- Never linear

### 3.8 Touch targets
- Minimum 44px on all tap areas
- Gestural interactions (swipe, pinch) preferred over buttons where possible

---

## 4. Database Schema

### 4.1 Core tables

```sql
-- Users (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,  -- required from Phase 3 onward
  display_name text,
  avatar_url text,
  shelf_visibility text default 'private' 
    check (shelf_visibility in ('private', 'public')),
  theme_preference text default 'dark' 
    check (theme_preference in ('dark', 'light')),
  language_preference text default 'ko' 
    check (language_preference in ('ko', 'en')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Books
create table public.books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  author text,
  isbn text,
  publisher text,
  published_year integer,
  
  -- Cover sourcing
  cover_source text check (cover_source in ('aladin_url', 'user_upload', 'typographic_generated')),
  cover_image_url text,         -- final URL after proxy/upload
  cover_storage_path text,       -- if user_upload
  cover_dominant_color text,     -- hex, extracted server-side
  
  -- Shelf placement
  shelf_order integer,           -- position in the horizontal shelf
  section_label text,            -- optional "post-it" section marker
  is_section_start boolean default false,
  
  -- Metadata
  source text check (source in ('aladin_api', 'manual', 'google_books')),
  total_pages integer,           -- for future display only; thickness is fixed
  metadata jsonb,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Book detail pages (one per book)
create table public.book_pages (
  id uuid primary key default gen_random_uuid(),
  book_id uuid references public.books(id) on delete cascade unique not null,
  
  -- Edit mode: template (fill-in) or canvas (block editor)
  edit_mode text default 'template' 
    check (edit_mode in ('template', 'canvas')),
  
  -- Template preset (when edit_mode = 'template')
  template_preset text 
    check (template_preset in ('classic', 'minimal', 'quote_first', 'essay')),
  
  -- Block-based content (shared by both modes)
  content jsonb,  -- see types/blocks.ts for BookPageContent structure
  
  -- Per-page theme override (null = use user preference)
  theme_override text check (theme_override in ('dark', 'light')),
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Follows (= "save" relationship, Instagram-style)
create table public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  notifications_enabled boolean default false,
  created_at timestamptz default now(),
  unique(follower_id, following_id),
  check (follower_id != following_id)
);

-- Saved books (individual book bookmarking, distinct from following a shelf)
create table public.saved_books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  book_id uuid references public.books(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, book_id)
);

-- Notifications (Phase 3+)
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('new_book', 'updated_page', 'follow')),
  actor_id uuid references public.profiles(id) on delete cascade,
  book_id uuid references public.books(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz default now()
);

-- Donation transparency records (Phase 4, manually entered)
create table public.donation_records (
  id uuid primary key default gen_random_uuid(),
  period_start date not null,
  period_end date not null,
  total_revenue_krw integer not null,
  donation_amount_krw integer not null,
  recipient_organization text not null,
  donated_at timestamptz not null,
  receipt_url text,
  created_at timestamptz default now()
);
```

### 4.2 RLS Policies

**Principle**: RLS enforces the "fairness + anti-comparison" philosophy at the database level.

```sql
-- Books: private by default, visible to all only if user opted into public shelf
alter table public.books enable row level security;

create policy "Users manage own books"
  on public.books for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Public shelves readable by all authenticated"
  on public.books for select
  using (user_id in (
    select id from public.profiles where shelf_visibility = 'public'
  ));

-- Book pages: same public/private rule as their books
alter table public.book_pages enable row level security;

create policy "Users manage own book pages"
  on public.book_pages for all
  using (book_id in (select id from public.books where user_id = auth.uid()))
  with check (book_id in (select id from public.books where user_id = auth.uid()));

create policy "Public book pages readable"
  on public.book_pages for select
  using (book_id in (
    select id from public.books 
    where user_id in (select id from public.profiles where shelf_visibility = 'public')
  ));

-- Follows: users see who THEY follow, but NOT who follows them
-- This is the core anti-comparison enforcement
alter table public.follows enable row level security;

create policy "Users see who they follow"
  on public.follows for select
  using (auth.uid() = follower_id);

create policy "Users manage own follows"
  on public.follows for all
  using (auth.uid() = follower_id)
  with check (auth.uid() = follower_id);

-- No policy for "users see who follows them" — intentionally absent
-- Follower counts are aggregated server-side via SECURITY DEFINER functions only

-- Saved books
alter table public.saved_books enable row level security;

create policy "Users manage own saves"
  on public.saved_books for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Profiles: own profile freely, others only if shelf is public
alter table public.profiles enable row level security;

create policy "Users manage own profile"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Public profiles readable"
  on public.profiles for select
  using (shelf_visibility = 'public');

-- Donation records: publicly readable (transparency)
alter table public.donation_records enable row level security;
create policy "Donation records are public" 
  on public.donation_records for select 
  using (true);
```

### 4.3 Server-side aggregation functions

Follower counts are never exposed via direct table access. Instead, `SECURITY DEFINER` functions compute them server-side so that the raw rows are never readable:

```sql
-- Returns abstracted signal, not raw number (see §18)
create or replace function public.get_shelf_signal(target_user_id uuid)
returns text
language plpgsql
security definer
as $$
declare
  follower_count integer;
begin
  select count(*) into follower_count
  from public.follows
  where following_id = target_user_id;
  
  -- Return abstract signal, never raw number, to foreign viewers
  return case
    when follower_count >= 1000 then 'widely_loved'
    when follower_count >= 100 then 'spreading'
    when follower_count >= 10 then 'loved'
    else null
  end;
end;
$$;
```

### 4.4 Key indexes

```sql
create index idx_books_user on public.books(user_id);
create index idx_books_shelf_order on public.books(user_id, shelf_order);
create index idx_books_isbn on public.books(isbn) where isbn is not null;
create index idx_book_pages_book on public.book_pages(book_id);
create index idx_follows_follower on public.follows(follower_id);
create index idx_follows_following on public.follows(following_id);
create index idx_saved_books_user on public.saved_books(user_id);
create index idx_notifications_user_unread 
  on public.notifications(user_id) where read_at is null;
```

---

## 5. External APIs

### 5.1 Aladin Open API (Korean primary source)
- Endpoint: `http://www.aladin.co.kr/ttb/api/`
- Required: TTB key (register at aladin.co.kr)
- Used for: Korean-language book metadata and cover URLs
- Multiple editions: search by title returns multiple ISBNs — user selects their edition
- Cover URLs proxied through `/api/cover-proxy` for HTTPS + caching

### 5.2 Google Books API (English secondary source)
- Endpoint: `https://www.googleapis.com/books/v1/volumes`
- Key: optional for basic usage, recommended for rate limit safety
- Used for: English-language book metadata and covers
- Auto-selected when user's language preference is `en`

### 5.3 Purchase link generation (no API required)
Purchase links are generated deterministically from ISBN, not fetched from APIs:

```
Korean stores (when language=ko):
  Aladin:   https://www.aladin.co.kr/search/wsearchresult.aspx?SearchTarget=All&KeyWord={isbn}
  Kyobo:    https://search.kyobobook.co.kr/search?keyword={isbn}
  YES24:    https://www.yes24.com/Product/Search?query={isbn}
  Coupang:  https://www.coupang.com/np/search?q={isbn}

English stores (when language=en):
  Amazon:   https://www.amazon.com/s?k={isbn}
  B&N:      https://www.barnesandnoble.com/s/{isbn}
  Book Depo: https://www.bookdepository.com/search?searchTerm={isbn}
```

Affiliate codes are appended in Phase 4 after partnership approval — URL structure stays the same.

### 5.4 Blocked / Not used
- **Instagram API**: Basic Display deprecated Dec 2024, Graph API restricted to own account. Never use.
- **Kyobo / YES24 public API**: Do not exist. Scraping is prohibited.
- **Amazon PA-API**: Requires affiliate account with sales history. Phase 4 only.

---

## 6. 3D Specifications

### 6.1 Book geometry (procedural)
- Base: 4-mesh group (front cover, back cover, spine, page block)
- Origin: at the spine hinge axis (for any future rotation)
- Dimensions (all derived from golden ratio):
  - Height : Width = φ : 1
  - Thickness = Width × (1/φ²) ≈ Width × 0.382
  - Thickness is **fixed** regardless of page count (consistency over realism)

### 6.2 Cover mapping pipeline (Phase 1 core)
Three sources, one pipeline:

**Source A — Aladin URL**
1. Aladin returns cover URL
2. `/api/cover-proxy` fetches, caches to Supabase Storage, returns HTTPS URL
3. Server-side extracts dominant color (sharp or canvas API)
4. Client loads as THREE.Texture
5. Composited with dominant-color letterbox in offscreen canvas
6. Uploaded as final texture

**Source B — User upload**
1. User selects image file
2. Validated (MIME, size, dimensions)
3. Uploaded to Supabase Storage under `covers/{user_id}/{book_id}.webp`
4. Same pipeline as Source A from step 3 onward

**Source C — Typographic generation (fallback)**
1. No cover available, or user chooses generated style
2. Canvas API renders: title (serif, center) + author (sans, bottom) on dominant-color background
3. Golden-ratio layout with generous margins
4. Uploaded as final texture

### 6.3 Spine auto-generation (all books)
Spine texture is **always generated**, never fetched. Layout:
```
[Author (sans, small)] ... [Title (serif, large)] ... [Φ (logo, small)]
```
- Width-constrained layout with ellipsis for long titles
- Uses Phi theme colors (varies by dark/light preference)

### 6.4 Back cover
- Phase 1: solid dominant color + small Φ watermark
- Phase 2+: could show book summary, TBD

### 6.5 Performance targets
- 60 FPS on iPad Air (2022+) Safari, landscape orientation
- Single book scene: < 50ms initial load
- Full shelf (20 books): < 200ms initial load, 60 FPS maintained
- Texture budget: 1024×1024 max per cover (aggressive for mobile)

### 6.6 LOD strategy (Phase 2)
- Focused book (detail page): full 1024² texture, all materials
- Shelf view: 256² thumbnail textures, simplified materials
- Transition: 300ms lerp when camera distance crosses threshold

---

## 7. 90-Day Roadmap

| Phase | Days | Focus | Gate |
|---|---|---|---|
| **1** | 1–30 | 3D object fidelity | Cover mapping (3 sources) + auto spine + Phi System coded + Aladin minimal + manual add minimal + iPad 60fps landscape |
| **2** | 31–55 | Shelf + detail page | Horizontal shelf with dim-out, post-it sections, template mode book pages, Phi Light theme, Google Books (en), i18n structure, Google OAuth + email magic link |
| **3** | 56–75 | Display + sharing + canvas mode | `/u/{username}` public shelves, follow/save, abstracted signals, per-book & per-shelf share links, notification toggle, **canvas mode block editor** |
| **4** | 76–90 | Native + affiliate + transparency | Capacitor iOS/Android, Apple Sign In, affiliate codes, donation transparency page, store submission, phone version discussion starts |

### Phase rules
- Feature freeze at Day 70
- No new features after Phase 3 gate
- Phase 4 is packaging, polish, and business integration only
- Each gate must pass before next phase begins
- **Constrained Creativity (§18) must govern every Phase 3 editor decision**

---

## 8. File Structure (target, evolving)

```
phi/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── callback/
│   ├── (features)/
│   │   ├── bookshelf/           # own shelf
│   │   ├── book/
│   │   │   ├── new/             # add book (search + manual)
│   │   │   │   ├── search/
│   │   │   │   └── manual/
│   │   │   └── [bookId]/        # book detail
│   │   │       └── edit/        # template | canvas mode
│   │   └── u/
│   │       └── [username]/      # public shelf
│   │           └── book/
│   │               └── [bookId]/  # public book detail
│   ├── api/
│   │   ├── cover-proxy/
│   │   ├── aladin/
│   │   ├── google-books/
│   │   └── shelf-signal/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── 3d/
│   │   ├── BookModel.tsx
│   │   ├── BookshelfScene.tsx
│   │   ├── CoverMaterial.tsx
│   │   ├── SpineMaterial.tsx
│   │   └── PerfPanel.tsx
│   ├── editor/
│   │   ├── BlockEditor.tsx
│   │   ├── TemplateRenderer.tsx
│   │   └── blocks/
│   ├── ui/
│   └── icons/
├── lib/
│   ├── phi/                     # golden ratio design system
│   │   ├── ratios.ts
│   │   ├── typography.ts
│   │   ├── colors.ts
│   │   ├── blocks.ts
│   │   ├── spacing.ts
│   │   └── constraints.ts
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── three/
│   │   ├── materials.ts
│   │   ├── coverPipeline.ts
│   │   └── spineGenerator.ts
│   ├── aladin/
│   ├── google-books/
│   └── purchase-links/
├── stores/                       # Zustand
│   ├── useBookStore.ts
│   ├── useShelfStore.ts
│   └── useUIStore.ts
├── types/
│   ├── book.ts
│   ├── blocks.ts
│   └── phi.ts
└── public/
```

---

## 9. Decisions Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-03-29 | Web app (React) over native (SwiftUI) | Claude produces + tests React instantly; Capacitor wraps later |
| 2026-03-29 | No Instagram API | Deprecated Basic Display; restricted Graph API |
| 2026-03-29 | Capacitor for store distribution | Same codebase for web + iOS + Android |
| 2026-04-08 | Next.js pinned at 14.2.35 through Phase 1 | Avoid mid-phase framework upgrade risk |
| 2026-04-10 | Design language split: MD Vinyl (object) + Stripe Press (layout) | Same philosophy, two faces — not a forced merger |
| 2026-04-10 | Tablet landscape only, phone deferred | Small screen demands independent redesign, not shrunken tablet |
| 2026-04-10 | Korean + English only | Controlled i18n complexity, matches primary market |
| 2026-04-10 | Single main shelf per user + section labels | Chose Instagram's "saved" model over Spotify's "multiple playlists" |
| 2026-04-10 | Follower counts hidden forever | Anti-comparison is core philosophy; prevents reading from becoming performative |
| 2026-04-10 | Shelf save counts shown to owner only, abstracted signals to others | Motivation without comparison |
| 2026-04-10 | Private shelf by default | Privacy before exposure, user opts into public |
| 2026-04-10 | Cover mapping: dominant color letterbox (Q8-c) | Object-first integration, covers "melt into" the book surface |
| 2026-04-10 | Book thickness fixed, not scaled by page count | Consistency > realism, simpler shelf layout math |
| 2026-04-10 | Aladin (ko) + Google Books (en) as only metadata sources | Avoid scraping (Kyobo, YES24); use deterministic URL for purchase links instead |
| 2026-04-10 | Book open animation (Step 5) abandoned | App's core is ownership + display, not opening ceremony |
| 2026-04-10 | LLM editing removed entirely | Free app philosophy; template + constrained block editor sufficient |
| 2026-04-10 | No payment processing ever | Revenue only from affiliates → Phi → 10% donation. Users never pay. |
| 2026-04-10 | Constrained Creativity as viral engine | "Same constraints, different results" — consistency builds trust and fanbase |
| 2026-04-10 | Non-replication principle | No template-copy feature; observe → inspire → recreate is the learning loop |
| 2026-04-10 | Phi System (golden ratio) applied across 5 layers | Object, layout, typography, interaction, brand — all bound by φ |

---

## 10. Development Workflow Rules

### 10.1 Git strategy
- **Main branch**: `main` — always deployable, auto-deploys to Vercel production
- **Feature branches**: `feat/{phase}-{feature}` (e.g., `feat/p1-cover-pipeline`)
- **Fix branches**: `fix/{issue}`
- **Commit format**: Conventional Commits
- **PR rule**: All merges via PR, no direct pushes to main
- **Deploy previews**: Every PR gets a Vercel preview URL

### 10.2 Environment separation
- **Dev**: Supabase project `Phi` (current, will remain for dev)
- **Prod**: separate Supabase project created at Phase 4
- **Keys**: `.env.local` git-ignored, Vercel env vars for production
- Service role key never on client

### 10.3 Code review workflow
```
Claude writes → pushes to feature branch
  → Vercel preview auto-deploys
  → Owner tests (currently DevTools device mode, real iPad from Phase 2)
  → Owner approves or requests changes
  → Merge to main → auto production deploy
```

### 10.4 Testing priorities
- **Primary**: iPad Safari landscape (real device, from Phase 2)
- **Secondary**: Android Chrome landscape
- **Dev only**: Desktop Chrome (never optimize for desktop at tablet's expense)
- **Lighthouse**: run at each Phase gate, targets Perf > 80, A11y > 90

### 10.5 File editing discipline
- Use `create_file` / `str_replace` only, never `sed` (learned from past corruption incident)
- Filename casing must be exact (Linux case-sensitivity bit us before)
- Always view before editing after any previous edit

---

## 11. Supabase Operational Rules

### 11.1 Migration discipline
- All schema changes via SQL migration files
- Naming: `YYYYMMDD_HHMMSS_{description}.sql`
- Never modify production DB via dashboard
- Test on dev project first, then apply to prod
- Keep migrations in `/supabase/migrations/`

### 11.2 Storage bucket structure
```
supabase-storage/
├── covers/              # Book covers (public, CDN-cached)
│   └── {user_id}/{book_id}.webp
├── avatars/             # User avatars (public)
│   └── {user_id}.webp
├── uploads/             # User-uploaded raw images (private)
│   └── {user_id}/{upload_id}.{ext}
└── generated/           # Server-generated textures (public, cached)
    └── covers/{book_id}.webp
    └── spines/{book_id}.webp
```

### 11.3 RLS checklist for every new table
1. `alter table ... enable row level security;`
2. Default deny (automatic when RLS is on with no policies)
3. Add SELECT policy
4. Add INSERT with `with check`
5. Add UPDATE with both `using` and `with check`
6. Add DELETE (or omit for append-only tables)
7. Test as anon → fail. Test as user → see own data only.

### 11.4 Edge Function conventions
- Naming: `kebab-case`
- Runtime: Deno
- Max execution: 10s user-facing, 60s background
- Input validation with Zod
- Return `{ data, error }` JSON

---

## 12. Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Components | PascalCase | `BookModel.tsx`, `BlockEditor.tsx` |
| Utilities | camelCase | `coverPipeline.ts`, `spineGenerator.ts` |
| Hooks | camelCase + `use` | `useBookStore.ts`, `useCoverTexture.ts` |
| CSS | Tailwind utilities | — |
| DB tables | snake_case plural | `book_pages`, `saved_books` |
| DB columns | snake_case | `cover_dominant_color` |
| API routes | kebab-case | `/api/cover-proxy` |
| Env vars | SCREAMING_SNAKE | `NEXT_PUBLIC_SUPABASE_URL` |
| Zustand stores | camelCase + `use` | `useBookStore` |
| TS types | PascalCase | `Book`, `BookPageContent`, `Block` |
| i18n keys | dot.notation | `shelf.empty.message` |

---

## 13. Security Checklist

- [ ] Supabase anon key: client-side, scoped by RLS
- [ ] Supabase service_role: server-side only, never client-exposed
- [ ] All user file uploads: MIME + size validated before Storage
- [ ] Image proxy: validate Content-Type, max size, timeout
- [ ] Share URLs: no sensitive data in query params
- [ ] CORS: Vercel handles, Supabase scoped to Phi domain
- [ ] Auth: Supabase Auth with Google (Phase 2), Apple (Phase 4)
- [ ] User text sanitization: all book page content sanitized before render
- [ ] Rate limiting: Supabase Edge Functions + Vercel functions built-in
- [ ] RLS audited at every Phase gate

---

## 14. Component Architecture Patterns

### 14.1 Server vs Client split
- **Server** (default): page layouts, data fetching, static UI
- **Client** (`'use client'`): R3F Canvas, interactive forms, editors, animations

### 14.2 Data flow
```
Supabase → Server Component → props → Client Component
                                    → Zustand store
                                    → R3F scene

User action → Zustand (optimistic) → Server Action → Supabase
            → on error: Zustand rollback + toast
```

### 14.3 Zustand stores (domain-split, never one big store)
- `useBookStore` — books, shelf positions, add/edit
- `useShelfStore` — viewport, camera, focus state
- `useEditorStore` — block editor state (Phase 3)
- `useUIStore` — modals, navigation, sidebar

### 14.4 Error boundaries
- Wrap every R3F `<Canvas>` in an error boundary
- User-facing errors: warm Korean/English text
- Dev errors: full trace in console + Edge Function logs

---

## 15. Authentication Strategy

### 15.1 Phase-by-phase
| Phase | Auth |
|---|---|
| 1 | None (anonymous access, focus on 3D) |
| 2 | Google OAuth + email magic link |
| 3 | + username system (required on first login) |
| 4 | + Apple Sign In (mandatory for iOS App Store) |

### 15.2 Username rules (from Phase 3)
- Lowercase alphanumeric + underscore, 3–20 chars
- Unique across all users
- Used in public URL: `/u/{username}`
- Set once, changeable with throttle (1 change per 30 days)

### 15.3 Session persistence
- Supabase Auth handles token refresh
- Server Components use `@supabase/ssr` cookie-based session
- Client Components use browser client from the same package

---

## 16. Revenue & Donation Model

### 16.1 What Phi does NOT do
- **No payment processing** — users never pay Phi directly
- **No subscriptions**
- **No ads**
- **No premium tiers**
- **No in-app purchases**
- **No data sale**

### 16.2 What Phi DOES (Phase 4+)
- **Affiliate links** on "내 서재로 들이기" (Bring to my shelf) widget
- Partners: Aladin TTB Partners (KR), Coupang Partners (KR), Amazon Associates (EN)
- Revenue flows: partner dashboard → Phi business account (monthly)

### 16.3 Donation pipeline
```
Monthly cycle:
  1. Owner checks partner dashboards
  2. Sums total affiliate revenue
  3. Calculates 10% donation amount
  4. Donates to reading-related organization
  5. Logs to public.donation_records
  6. Published on transparency page
```

### 16.4 Recipient organization
- TBD in Phase 4
- Candidates: 작은도서관 지원 사업, 느린학습자 독서 프로그램, 책읽는사회문화재단
- Criteria: aligned with reading encouragement, transparent operations

### 16.5 Transparency page (Phase 4)
- Public route: `/about/donations`
- Shows all donation records with receipts
- No aggregation tricks — every won accounted for

---

## 17. Phi System (Golden Ratio)

> Phi (φ ≈ 1.618) is the app's name, brand, and design DNA.
> Every meaningful ratio in Phi should derive from φ.

### 17.1 Mathematical constants

```typescript
export const PHI = 1.6180339887;       // golden ratio
export const PHI_INV = 0.6180339887;   // 1/φ
export const PHI_INV_SQ = 0.3819660113; // 1/φ²
export const PHI_INV_CUBE = 0.2360679775; // 1/φ³
```

### 17.2 Five layers of application

**Object layer**
- Book height : width = φ : 1
- Book thickness = width × (1/φ²)
- Cover text safe area = cover width × (1/φ³) on each side

**Layout layer**
- Shelf view: each book's visible width = screen width × (1/φ²) ≈ 38.2%
  - Result: ~2.6 books visible at once (partial edge suggests "more")
- Book detail page: 3D book (38.2%) | text content (61.8%)
- Text column max width: container / φ

**Typography layer**
- Type scale (modular, ratio = φ):
  - `micro`:   10px  (16 × 1/φ)
  - `body`:    16px  (base)
  - `heading`: 26px  (16 × φ)
  - `title`:   42px  (16 × φ²)
  - `display`: 68px  (16 × φ³)
- Line height: font-size × 1.618 / 2 ≈ font-size × 0.809

**Interaction layer**
- Animation durations:
  - `fast`:     382ms  (1000 × 1/φ² × 1)
  - `default`:  618ms  (1000 × 1/φ)
  - `slow`:    1000ms  (1s baseline)
- Easing: `cubic-bezier(0.382, 0, 0.618, 1)` — golden ease-in-out

**Brand layer**
- Logo Φ is the core mark
- App icon: Φ inside golden spiral
- Splash: spiral unfurls to reveal Φ (Phase 2+)

### 17.3 Enforcement via code
All five layers are codified in `lib/phi/`:
```
lib/phi/
├── ratios.ts       # mathematical constants
├── typography.ts   # type scale
├── colors.ts       # palette for dark + light
├── blocks.ts       # block type definitions
├── spacing.ts      # spacing scale
└── constraints.ts  # exhaustive enum of what editors may produce
```

The editor UI reads directly from these files. Any value not in these files cannot appear in user content.

---

## 18. Constrained Creativity — Phi's Viral Engine

> *"Constraints create fairness, fairness creates comparability, comparability creates virality."*

### 18.1 Core principle

Complete freedom in creation tools produces wildly varied results and low sharing — users feel their work is "just ok." Constrained creativity produces normalized-upward results and high sharing — users can *prove* they did more with the same tools than anyone else.

Phi's editing system (template mode + canvas mode) must embody this principle: **same tools, different results**.

### 18.2 Constraint boundaries

**Allowed:**
- Block types (7): heading, paragraph, quote, image, divider, spacer, purchase_widget
- Typography roles (5): display, title, heading, body, caption
- Color palette: Phi Dark (8 colors) + Phi Light (8 colors)
- Alignment (3): left, center, right
- Spacing scale (3): tight (1/φ²), regular (1/φ), loose (1)
- Image aspect ratios (3): 1:1, φ:1, 1:φ

**Forbidden everywhere in user content:**
- Free font selection
- Arbitrary color values
- Arbitrary font sizes
- Pixel-level positioning
- Custom CSS
- External embeds

### 18.3 Floor vs ceiling

**Floor (guaranteed):** Even a careless user produces "Phi-looking" results. This is the *trust guarantee* — no one will be embarrassed by their Phi pages.

**Ceiling (unlimited):** A skilled user with design sense will produce *stunning* results from the same constraints. The skill shows in choices of *whitespace, rhythm, contrast, block order* — invisible design taste, not surface decoration.

This gap is where virality lives. Everyone competes on the same field; the winners are visibly better in a way that others can learn from.

### 18.4 Non-replication principle

**Do not add features that let users copy another user's page as a template.**

Why this matters:
- Observation → inspiration → own recreation is the core learning loop
- Easy replication cheapens the skill gap (= kills virality)
- Each page should feel hand-crafted, not templated-from-others
- The struggle to recreate builds attachment to Phi itself

**Exception**: Phi's own preset templates (classic, minimal, quote-first, essay) are shared starting points. They are not user-owned, so no one "owns" an aesthetic.

### 18.5 Implementation discipline

Before adding any editor feature, check:
1. Does this widen the floor? (good)
2. Does this raise the ceiling? (good)
3. Does this remove a constraint? (stop — reconsider)
4. Does this make replication easier? (stop — reconsider)

Every editor PR must answer these four questions in its description.

---

## 19. Internationalization (i18n)

### 19.1 Languages
- Korean (`ko`) — primary market
- English (`en`) — secondary, also for public shelf sharing beyond Korea
- No other languages in Phase 1–4

### 19.2 Library
- `next-intl` (integrated from Phase 2)
- All strings in `/messages/{locale}.json`
- No hardcoded user-facing strings from Phase 2 onward

### 19.3 Detection & override
- Initial: browser `Accept-Language` header
- Override: stored in `profiles.language_preference`
- User can switch anytime from settings
- Same content, two languages — one user account

### 19.4 Content that is per-language
- UI chrome (all labels, buttons, messages)
- Search source (Aladin for ko, Google Books for en)
- Purchase link widget (KR stores for ko, US/global for en)
- Error messages and toasts

### 19.5 Content that is user-generated
- Book titles, authors, user notes — stored as-is, not translated
- User writes in their own language; viewers see what was written
- No auto-translation

---

## 20. Horizontal Tablet Layout Rules

### 20.1 Orientation enforcement
- `meta[name=viewport]` with `orientation=landscape` hint
- CSS `@media (orientation: portrait)` shows "Please rotate your device" overlay
- No UI designed for portrait until Phase 4+ phone discussion

### 20.2 Target viewports (Phase 1–4)
- iPad Pro 13" M4: 2064×2752 (landscape: 2752×2064, ratio ≈ 1.33)
- iPad Air 11": 1640×2360 (landscape: 2360×1640, ratio ≈ 1.44)
- Galaxy Tab S9+: 1752×2800 (landscape: 2800×1752, ratio ≈ 1.60)
- Design baseline: **2560×1600** (close to average, close to φ×1000)

### 20.3 Horizontal layout primitives

**Shelf view (Stripe Press horizontal translation)**
- Books arranged left-to-right on an invisible shelf line
- Camera slightly elevated, looking down at ~15°
- Horizontal scroll: trackpad, swipe, arrow keys
- Hovered/focused book brightens, others dim to ~30%
- Left sidebar (narrow, post-it markers) shows section labels

**Detail page (golden-ratio horizontal split)**
- Left 38.2%: 3D book (rotatable, not openable)
- Right 61.8%: text content area
  - Template mode: fixed layout, user fills text fields
  - Canvas mode: block editor, user arranges blocks

**Public shelf (`/u/{username}`)**
- Same horizontal shelf layout as own shelf
- No edit affordances
- Save button (= follow) in top-right

### 20.4 Phone deferral
- Phone version is NOT a scaled-down tablet
- When Phase 4 closes, decide whether to start phone as independent redesign
- Until then, phone users see "Phi is tablet-only for now" message
