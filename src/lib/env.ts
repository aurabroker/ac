/**
 * Zmienne środowiskowe builda.
 * - PREVIEW=1 → budują się drafty (z noindex), robots.txt blokuje wszystko,
 *   `_headers` dostaje `X-Robots-Tag: noindex, nofollow` (preview gałęzi).
 */
export const PREVIEW = process.env.PREVIEW === '1' || process.env.PREVIEW === 'true';
