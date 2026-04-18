/**
 * Normalize an Aladin item into the source-agnostic BookMetadata shape.
 *
 * Decisions
 * ---------
 * 1. ISBN preference: isbn13 > isbn > null. ISBN-13 is the modern
 *    standard and Aladin provides it for virtually all current books.
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
 *    by the API terms.
 */

import type { AladinItem } from './schema';
import type { BookMetadata, BookLanguage } from '@/types/metadata';

export function normalizeAladinItem(item: AladinItem): BookMetadata {
  const rawIsbn = (item.isbn13?.trim() || item.isbn?.trim() || '').replace(/[- ]/g, '');
  const isbn = rawIsbn.length >= 10 ? rawIsbn : null;

  return {
    source: 'aladin',
    sourceItemId: String(item.itemId),
    isbn,
    title: item.title.trim(),
    author: cleanAuthor(item.author),
    publisher: item.publisher.trim() || null,
    publishedYear: parseYear(item.pubDate),
    language: inferLanguage(item.categoryName),
    coverOriginalUrl: item.cover.trim() || null,
    sourceLink: item.link.trim() || null,
  };
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