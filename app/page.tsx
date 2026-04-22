import Link from 'next/link';
import { HeroQuote } from '@/components/hero/HeroQuote';

/**
 * Landing page — the entry to Phi.
 *
 * A deliberately sparse screen: the Φ mark, a tagline, and a single
 * doorway. "Object-first, UI-second" applied at the smallest possible
 * surface. Everything warms on engagement; nothing shouts.
 *
 * See PROJECT_KNOWLEDGE.md §3.2 "Core principles".
 */
export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-phi-loose">
      {/* Warm spotlight glow — subtle radial behind the title */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full opacity-[0.04] pointer-events-none bg-[radial-gradient(circle,#D4A574_0%,transparent_70%)]"
        aria-hidden="true"
      />

      {/* Logo mark */}
      <div className="relative z-10 flex flex-col items-center gap-10">
        {/* Phi symbol — serif, large, warm */}
        <h1 className="text-[120px] font-serif leading-none tracking-tight text-accent-gold">
          Φ
        </h1>

        {/* Tagline */}
        <p className="text-text-secondary text-lg tracking-widest uppercase font-sans">
          Your Digital Bookshelf
        </p>

        {/* Enter link — retreating, warms on hover */}
        <Link
          href="/bookshelf"
          className="mt-6 px-6 py-2 rounded-full text-sm font-sans tracking-[0.2em] uppercase border border-text-tertiary text-text-tertiary hover:border-accent-gold hover:text-accent-gold transition-colors duration-phi-fast"
        >
          Enter the shelf
        </Link>

        {/* Daily heading quote — deterministic per anonymous id */}
        <HeroQuote />
      </div>
    </main>
  );
}