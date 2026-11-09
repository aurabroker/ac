/**
 * Cloudflare Turnstile — ochrona formularza kontaktowego przed spamem (9.11.2026).
 *
 * Widżet „aura-web formularz” (konto Cloudflare aura-web), domeny: auraconsulting.pl, aura-web-2s1.pages.dev
 * (z subdomenami — podglądy Pages). Tryb „managed” + appearance „interaction-only”: zwykle niewidoczny,
 * pole do kliknięcia pokazuje tylko przy podejrzanym ruchu.
 *
 * Klucz witryny jest publiczny. Klucz tajny: zmienna TURNSTILE_SECRET_KEY w Cloudflare Pages (Production i Preview);
 * weryfikacja w functions/api/kontakt.js (siteverify, action = TURNSTILE_ACTION, dozwolony hostname).
 * Skrypt ładuje src/scripts/contact-form.ts przy pierwszym fokusie w formularzu. CSP: public/_headers
 * (script-src i frame-src https://challenges.cloudflare.com).
 */
export const TURNSTILE_SITEKEY = '0x4AAAAAAF6OQRa447426-FB';
export const TURNSTILE_ACTION = 'kontakt';
export const TURNSTILE_SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
