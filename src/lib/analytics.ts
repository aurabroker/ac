/**
 * Google Analytics 4 — konfiguracja (decyzja właściciela 5.11.2026: przywrócenie usługi GA4 ze starej strony).
 *
 * Tryb zgody „podstawowy” (Consent Mode v2, basic): skrypt Google ładujemy dopiero po kliknięciu
 * „Zgadzam się” w banerze (src/components/ConsentBanner.astro, logika: src/scripts/consent.ts).
 * Bez zgody przeglądarka nie łączy się z Google. Zgoda dotyczy tylko statystyk (analytics_storage);
 * ad_storage, ad_user_data i ad_personalization zostają „denied”.
 *
 * Zmiana zakresu (np. reklamy, remarketing) = nowa wersja zgody (CONSENT_VERSION), aktualizacja
 * polityki prywatności i CSP w public/_headers.
 */
export const GA4_ID = 'G-GDEW6G7KB0';

/** Klucz w localStorage z wyborem odwiedzającego. */
export const CONSENT_KEY = 'aura-consent';

/** Podnieś, gdy zmienia się zakres zgody — wtedy baner pokaże się ponownie wszystkim. */
export const CONSENT_VERSION = 1;

/** Po tylu dniach pytamy ponownie (także po odmowie). */
export const CONSENT_MAX_AGE_DAYS = 365;
