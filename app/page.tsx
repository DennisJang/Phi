export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-md">
      {/* Warm spotlight glow — subtle radial behind the title */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full opacity-[0.04] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #D4A574 0%, transparent 70%)',
        }}
      />

      {/* Logo mark */}
      <div className="relative z-10 flex flex-col items-center gap-xl">
        {/* Phi symbol — serif, large, warm */}
        <h1
          className="text-[120px] font-serif leading-none tracking-tight"
          style={{ color: 'var(--accent-warm)' }}
        >
          Φ
        </h1>

        {/* Tagline */}
        <p className="text-text-secondary text-lg tracking-widest uppercase font-sans">
          Your Digital Bookshelf
        </p>

        {/* Status pill */}
        <div
          className="mt-lg px-lg py-sm rounded-full text-sm font-sans"
          style={{
            border: '1px solid var(--text-tertiary)',
            color: 'var(--text-tertiary)',
          }}
        >
          Phase 1 — Foundation
        </div>
      </div>
    </main>
  );
}
