import Link from 'next/link';
import { BookshelfScene } from '@/components/3d/BookshelfScene';

/**
 * Bookshelf page — hosts the 3D shelf view.
 *
 * Background is delegated to app/layout.tsx's <body class="bg-canvas">.
 * This page only controls its own layout (full viewport, overflow hidden)
 * and the retreating chrome layer above the canvas.
 *
 * See PROJECT_KNOWLEDGE.md §3.2 "Object-first, UI-second".
 */
export default function BookshelfPage() {
  return (
    <main className="relative w-screen h-screen overflow-hidden">
      {/* The 3D canvas fills the viewport */}
      <div className="absolute inset-0">
        <BookshelfScene />
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