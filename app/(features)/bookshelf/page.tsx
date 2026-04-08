import Link from 'next/link';
import { BookshelfScene } from '@/components/3d/BookshelfScene';

export default function BookshelfPage() {
  return (
    <main className="relative w-screen h-screen overflow-hidden bg-bg-primary">
      {/* The 3D canvas fills the viewport */}
      <div className="absolute inset-0">
        <BookshelfScene />
      </div>

      {/* Minimal retreating chrome — top-left: back link */}
      <nav className="absolute top-lg left-lg z-10">
        <Link
          href="/"
          className="text-text-tertiary hover:text-text-secondary transition-colors font-sans text-sm tracking-wider uppercase"
        >
          ← Φ
        </Link>
      </nav>

      {/* Minimal retreating chrome — bottom-center: hint */}
      <div className="absolute bottom-lg left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <p className="text-text-tertiary text-xs tracking-[0.3em] uppercase font-sans">
          drag to inspect · scroll to zoom
        </p>
      </div>
    </main>
  );
}