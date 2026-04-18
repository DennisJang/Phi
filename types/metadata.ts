/**
 * BookMetadata — source-agnostic representation of a book that is
 * about to enter, but has not yet entered, the Phi system.
 *
 * Why this type exists
 * --------------------
 * Phi ingests book data from multiple external sources: Aladin (Phase
 * 1), Google Books (Phase 2), and manual entry (Phase 2). Each source
 * has its own response shape. If the response shapes leak up into
 * API routes, UI, or DB writes, then every consumer has to know about
 * every source and adding a new source means editing N call sites.
 *
 * BookMetadata is the choke point. Source adapters (lib/aladin/,
 * lib/google-books/, ...) translate their native shapes into this
 * type, and everything downstream — /api/books/create-from-metadata,
 * the add-book UI, Zustand stores — works exclusively in terms of
 * BookMetadata.
 *
 * What belongs here (what the outside world knows about the book)
 * ----------------------------------------------------------------
 * Fields that represent the book's *external identity and shape* —
 * facts any reasonable book data source could provide: title, author,
 * ISBN, publisher, year, cover URL, language, store/info link.
 *
 * What does NOT belong here (what Phi's internal pipeline produces)
 * ----------------------------------------------------------------
 * - cover_storage_path, cover_dominant_color — produced by processImage
 * - spine_storage_path, spine_image_url       — produced by renderSpine
 * - user_id, shelf_order, book_id             — assigned at DB INSERT
 *
 * Mapping to DB CHECK constraints (authoritative — Phi 1.0 schema)
 * ----------------------------------------------------------------
 * BookMetadata.source -> books.source       -> books.cover_source
 * 'aladin'            -> 'aladin_api'       -> 'aladin_url'
 * 'google_books'      -> 'google_books'     -> (Phase 2 migration)
 * 'manual'            -> 'manual'           -> 'user_upload'
 *                                           -> or 'typographic_generated'
 *
 * The mapping lives in /api/books/create-from-metadata, not here.
 */

export type MetadataSource = 'aladin' | 'google_books' | 'manual';

export type BookLanguage = 'ko' | 'en';

export interface BookMetadata {
  /** Where this metadata came from. Drives downstream DB mapping. */
  source: MetadataSource;

  /**
   * Source-specific identifier. For Aladin, the numeric itemId as a
   * string. For Google Books, the volume id. Used to dedupe search
   * results client-side and (future) re-fetch a specific item.
   */
  sourceItemId: string;

  /** 13-digit ISBN if known. null when the source didn't provide one. */
  isbn: string | null;

  title: string;
  author: string;
  publisher: string | null;

  /** 4-digit year only. Source pubDate strings are normalized here. */
  publishedYear: number | null;

  language: BookLanguage;

  /**
   * Remote cover URL as published by the source. Not yet fetched into
   * Phi Storage. /api/books/create-from-metadata is responsible for
   * downloading, processing, and persisting.
   *
   * null means "source had no cover" — for Phase 1 this returns 400;
   * Phase 2 will fall back to typographic generation.
   */
  coverOriginalUrl: string | null;

  /**
   * URL to the source's canonical page for this item. Used by the UI
   * to satisfy Aladin's TTB requirement that the app provide a "view
   * details / buy" link back to aladin.co.kr. Google Books will use
   * its `infoLink` here. null when the source does not provide a
   * direct page link.
   */
  sourceLink: string | null;
}

/**
 * Attribution metadata required by data sources' terms of use.
 *
 * Aladin's OpenAPI terms require the phrase "도서 DB 제공: 알라딘 인터넷서점"
 * (or equivalent) to be displayed near data fetched from their API,
 * along with a link back to aladin.co.kr. Surfacing this as a typed
 * field in the search response forces the UI layer to render it —
 * a dropped attribution would show up as an unused prop during code
 * review rather than as silent non-compliance.
 */
export interface SourceAttribution {
  text: string;
  url: string;
}