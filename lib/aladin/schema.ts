/**
 * Zod schemas for Aladin OpenAPI responses.
 *
 * We validate the outer envelope and the shape of each `item`. Fields
 * we don't use (mallType, mileage, customerReviewRank, etc.) are left
 * unvalidated — zod's default is to strip unknown keys.
 *
 * Aladin occasionally returns a different shape on error (a top-level
 * errorCode + errorMessage rather than `item`). The envelope below is
 * lenient enough to parse both; the client layer distinguishes error
 * vs success after parsing.
 */

import { z } from 'zod';

/** A single search result item. */
export const AladinItemSchema = z.object({
  title: z.string(),
  author: z.string(),
  publisher: z.string().optional().default(''),
  pubDate: z.string().optional().default(''),
  isbn13: z.string().optional().default(''),
  isbn: z.string().optional().default(''),
  itemId: z.number(),
  cover: z.string().optional().default(''),
  categoryName: z.string().optional().default(''),
  description: z.string().optional().default(''),
  /** Canonical Aladin product page URL. Used for TTB store links. */
  link: z.string().optional().default(''),
});
export type AladinItem = z.infer<typeof AladinItemSchema>;

/**
 * Search response envelope. `item` may be missing on error; `errorCode`
 * may be present on error. We validate both possibilities loosely.
 */
export const AladinSearchResponseSchema = z.object({
  totalResults: z.number().optional(),
  startIndex: z.number().optional(),
  itemsPerPage: z.number().optional(),
  query: z.string().optional(),
  item: z.array(AladinItemSchema).optional(),
  errorCode: z.number().optional(),
  errorMessage: z.string().optional(),
});
export type AladinSearchResponse = z.infer<typeof AladinSearchResponseSchema>;