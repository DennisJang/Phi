/**
 * Normalize an Aladin item into the source-agnostic BookMetadata shape.
 *
 * Decisions
 * ---------
 * 1. ISBN preference: isbn13 > isbn > null. ISBN-13 is the modern
 *    standard and Aladin provides it for virtually all current books.
 *    Aladin returns internal product codes (e.g. "SET99999") in the
 *    isbn field for bundled/set products; we accept only canonical
 *    10- or 13-digit strings after stripping hyphens/spaces.
 * 2. Author cleanup: Aladin authors frequently look like
 *    "홍길동 (지은이), 김철수 (옮긴이)". We strip any "(…)" annotations
 *    but preserve the comma-separated names. Filtering to primary
 *    author only is a Phase 2 concern.
 * 3. pubDate → year: Aladin returns "YYYY-MM-DD" (or occasionally just
 *    "YYYY"). We extract the leading 4-digit year via regex.
 * 4. Language: Aladin is a Korean retailer and categorizes foreign-
 *    language books under categoryName prefix "외국도서>…". For Phase 1
 *    MVP we map "외국도서" to 'en' and everything else to 'ko'.
 *    Korean *translations* of foreign works sit under "국내도서" which
 *    correctly maps to 'ko' — the reader holds a Korean-language copy.
 * 5. Cover URL: taken verbatim. The create-from-metadata route fetches
 *    it via fetchRemoteImage when the user picks this item.
 * 6. Source link: Aladin's `link` field points at the product page,
 *    which doubles as the TTB "view details / buy" target required
 *    by the API terms. Aladin TTB was XML-first and still emits
 *    HTML-encoded ampersands (&amp;) inside JSON responses — we
 *    reverse the entity encoding at the normalization boundary so
 *    downstream consumers get a browser-ready URL.
 */

import type { AladinItem } from './schema';
import type { BookMetadata, BookLanguage } from '@/types/metadata';

export function normalizeAladinItem(item: AladinItem): BookMetadata {
  return {
    source: 'aladin',
    sourceItemId: String(item.itemId),
    isbn: normalizeIsbn(item.isbn13 ?? item.isbn),
    title: item.title.trim(),
    author: cleanAuthor(item.author),
    publisher: item.publisher.trim() || null,
    publishedYear: parseYear(item.pubDate),
    language: inferLanguage(item.categoryName),
    coverOriginalUrl: item.cover.trim() || null,
    sourceLink: decodeHtmlEntities(item.link.trim()) || null,
  };
}

/**
 * Accept only canonical ISBN-10 or ISBN-13 digit strings after stripping
 * hyphens and spaces. Rejects Aladin's internal set-product codes like
 * "SET12345678" which fail the digits-only test. Returns null for anything
 * non-conforming; downstream consumers treat isbn as optional.
 */
function normalizeIsbn(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const stripped = raw.trim().replace(/[- ]/g, '');
  return /^\d{10}(\d{3})?$/.test(stripped) ? stripped : null;
}

/**
 * Reverse HTML entity encoding that Aladin TTB leaves in JSON-serialized
 * URLs. Scope is intentionally narrow: only the five entities Aladin is
 * known to emit. A general-purpose HTML decoder would be overkill and
 * would introduce a dependency for a one-regex problem.
 */
function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function cleanAuthor(raw: string): string {
  const stripped = raw.replace(/\s*\([^)]*\)/g, '').trim();
  const normalized = stripped.replace(/\s+/g, ' ');
  return normalized || raw.trim();
}

function parseYear(pubDate: string): number | null {
  const match = /^(\d{4})/.exec(pubDate.trim());
  if (!match) return null;
  const year = parseInt(match[1], 10);
  if (!Number.isFinite(year) || year < 1000 || year > 3000) return null;
  return year;
}

function inferLanguage(categoryName: string): BookLanguage {
  return categoryName.startsWith('외국도서') ? 'en' : 'ko';
}