'use client';

import { type CSSProperties, useEffect, useState } from 'react';
import { getTodayQuote, type Quote } from '@/lib/phi/quotes';
import { getOrCreateAnonId } from '@/lib/phi/anonId';
import { FONT_FAMILY, FONT_SIZE_PX, LINE_HEIGHT } from '@/lib/phi/typography';

// Option B: client-only render. The first paint is blank for one
// frame; this is preferable to an SSR/CSR quote mismatch since the
// landing hero is not LCP-critical (the 3D shelf is).

const originalStyle: CSSProperties = {
  fontFamily: FONT_FAMILY.serif,
  fontSize: `${FONT_SIZE_PX.heading}px`,
  lineHeight: `${LINE_HEIGHT.heading}px`,
};

const koreanStyle: CSSProperties = {
  fontFamily: FONT_FAMILY.serif,
  fontSize: `${FONT_SIZE_PX.body}px`,
  lineHeight: `${LINE_HEIGHT.body}px`,
};

const captionStyle: CSSProperties = {
  fontFamily: FONT_FAMILY.sans,
  fontSize: `${FONT_SIZE_PX.caption}px`,
  lineHeight: `${LINE_HEIGHT.caption}px`,
};

export function HeroQuote() {
  const [quote, setQuote] = useState<Quote | null>(null);

  useEffect(() => {
    setQuote(getTodayQuote(getOrCreateAnonId()));
  }, []);

  if (!quote) return null;

  return (
    <figure className="flex flex-col items-center gap-phi-regular max-w-2xl text-center">
      <blockquote
        lang={quote.originalLang}
        style={originalStyle}
        className="text-text-primary"
      >
        {quote.original}
      </blockquote>
      <p lang="ko" style={koreanStyle} className="text-text-secondary">
        {quote.korean}
      </p>
      <figcaption
        style={captionStyle}
        className="text-text-tertiary tracking-widest uppercase"
      >
        — {quote.author}
        {quote.source ? <span>, {quote.source}</span> : null}
      </figcaption>
    </figure>
  );
}
