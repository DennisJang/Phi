'use client';

/**
 * LandscapeGuard — enforces tablet landscape orientation.
 *
 * Why this is an identity declaration, not just a UX hint:
 * Phi is a tablet-landscape-only experience through Phase 4. A portrait
 * phone or portrait tablet is not a degraded Phi — it is *not* Phi. This
 * component unmounts the children entirely when orientation is portrait,
 * which means the 3D Canvas stops rendering too. No wasted GPU cycles on
 * a view Phi doesn't support.
 *
 * Bilingual copy is intentional. This single component is exempted from
 * the Phase 2 i18n system — showing both languages at once is a brand
 * statement: "Phi speaks ko and en simultaneously."
 *
 * See PROJECT_KNOWLEDGE.md §2.3 "Platform constraint" and §20.1.
 */

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

interface LandscapeGuardProps {
  children: ReactNode;
}

export function LandscapeGuard({ children }: LandscapeGuardProps) {
  // Start as `null` (unknown) to avoid hydration mismatch — the server
  // cannot know the viewport orientation. Once mounted, we resolve it.
  const [isLandscape, setIsLandscape] = useState<boolean | null>(null);

  useEffect(() => {
    const query = window.matchMedia('(orientation: landscape)');

    const update = () => setIsLandscape(query.matches);
    update();

// Safari <14 uses the legacy addListener API (deprecated but still
    // typed). Modern browsers use addEventListener. Try modern first.
    if (query.addEventListener) {
      query.addEventListener('change', update);
      return () => query.removeEventListener('change', update);
    } else {
      query.addListener(update);
      return () => query.removeListener(update);
    }
  }, []);

  // Before orientation is resolved (SSR and first client paint),
  // render nothing. This is a one-frame blank, imperceptible in practice.
  if (isLandscape === null) {
    return null;
  }

  // Portrait: unmount children entirely. The Canvas will be torn down.
  if (!isLandscape) {
    return <PortraitOverlay />;
  }

  return <>{children}</>;
}

/**
 * Fullscreen portrait-mode message. Bilingual by design.
 */
function PortraitOverlay() {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-canvas text-text-primary"
      role="alert"
      aria-live="polite"
    >
      {/* Φ mark — inline SVG to avoid font-loading delay on rotate */}
      <div
        className="font-serif text-[96px] leading-none text-accent-gold"
        aria-hidden="true"
      >
        Φ
      </div>

      <div className="mt-phi-loose flex flex-col items-center gap-phi-regular">
        <p className="font-serif text-[20px] text-text-primary">
          기기를 가로로 돌려주세요
        </p>
        <p className="font-serif text-[20px] text-text-secondary">
          Please rotate your device
        </p>
      </div>
    </div>
  );
}