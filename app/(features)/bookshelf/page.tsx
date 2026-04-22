import Link from 'next/link';
import { BookshelfScene } from '@/components/3d/BookshelfScene';
import { createClient } from '@/lib/supabase/server';
import { createServerRepositories } from '@/lib/repository/server';
import type { Book } from '@/types/book';

/**
 * Bookshelf page — hosts the 3D shelf view.
 *
 * Server Component: fetches the authenticated user's books in
 * shelf_order and passes them to BookshelfScene as a prop.
 *
 * RLS enforces user_id scoping at the database level; the explicit
 * .eq('user_id', user.id) is defense-in-depth and expresses
 * application intent alongside the policy. See §11.3.
 *
 * Empty states:
 *  - user === null (pre-AnonymousBootstrap hydration): renders empty
 *    shelf. Client-side anon sign-in completes on subsequent load.
 *  - books.length === 0 (new user, no books yet): renders empty shelf.
 *    Add-book affordance lands in Step 7 / Phase 2.
 *
 * Background is delegated to app/layout.tsx's <body class="bg-canvas">.
 * This page only controls its own layout and the retreating chrome
 * layer above the canvas.
 *
 * See PROJECT_KNOWLEDGE.md §3.2 "Object-first, UI-second".
 */
export default async function BookshelfPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let books: Book[] = [];
  if (user) {
    const { books: booksRepo } = await createServerRepositories();
    try {
      books = await booksRepo.findByUser(user.id);
    } catch (err) {
      console.error('[bookshelf] fetch failed:', err);
    }
  }

  return (
    <main className="relative w-screen h-screen overflow-hidden">
      {/* The 3D canvas fills the viewport */}
      <div className="absolute inset-0">
        <BookshelfScene books={books} />
      </div>

      {/* Minimal retreating chrome — top-left: back link */}
      <nav className="absolute top-6 left-6 z-10">
        <Link
          href="/"
          className="text-text-tertiary hover:text-text-secondary transition-colors duration-phi-fast font-sans text-sm tracking-wider uppercase"
        >
          ← Φ
        </Link>
      </nav>

      {/* Minimal retreating chrome — bottom-center: hint */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <p className="text-text-tertiary text-xs tracking-[0.3em] uppercase font-sans">
          drag to inspect · scroll to zoom
        </p>
      </div>
    </main>
  );
}