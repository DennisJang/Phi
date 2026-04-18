/**
 * Public interface of the Aladin source adapter.
 *
 * Callers (API routes, future server utilities) should import only
 * from this entry point. The raw Aladin response shape never leaves
 * this module — consumers work exclusively with BookMetadata.
 *
 * When Phase 2 adds Google Books, lib/google-books/index.ts will
 * expose a structurally identical `searchGoogleBooks(query, options)`
 * function, and the UI can route by user language preference without
 * either source knowing about the other.
 */

import { searchAladinRaw, type AladinClientError } from './client';
import { normalizeAladinItem } from './normalize';
import type { BookMetadata, SourceAttribution } from '@/types/metadata';

export type AladinSearchError = AladinClientError;

/**
 * TTB-required attribution. UI must render this somewhere visible on
 * any screen that shows Aladin-sourced data. Exported as a constant
 * rather than a string literal so it is a single point of truth and
 * easy to grep when policy changes.
 */
export const ALADIN_ATTRIBUTION: SourceAttribution = {
  text: '도서 DB 제공: 알라딘 인터넷서점',
  url: 'https://www.aladin.co.kr',
};

export type AladinSearchResult =
  | {
      ok: true;
      data: {
        items: BookMetadata[];
        totalResults: number;
        attribution: SourceAttribution;
      };
    }
  | {
      ok: false;
      error: AladinSearchError;
    };

export interface SearchAladinOptions {
  maxResults?: number;
  start?: number;
}

/**
 * Search the Aladin OpenAPI for books matching `query` and return
 * normalized BookMetadata results along with TTB attribution.
 *
 * Never throws. All failure modes are routed through the `ok: false`
 * branch.
 */
export async function searchAladin(
  query: string,
  options: SearchAladinOptions = {}
): Promise<AladinSearchResult> {
  const raw = await searchAladinRaw({
    query,
    maxResults: options.maxResults,
    start: options.start,
  });

  if (!raw.ok) {
    return { ok: false, error: raw.error };
  }

  const items = (raw.data.item ?? []).map(normalizeAladinItem);

  return {
    ok: true,
    data: {
      items,
      totalResults: raw.data.totalResults ?? items.length,
      attribution: ALADIN_ATTRIBUTION,
    },
  };
}