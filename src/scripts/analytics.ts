/**
 * Wspólny stan zgody i wysyłka zdarzeń GA4. Zdarzenia wysyłamy WYŁĄCZNIE po udzieleniu zgody —
 * nic nie trafia do kolejki dataLayer wcześniej (żeby nie wysłać danych sprzed zgody po jej udzieleniu).
 */
import { GA4_ID } from '../lib/analytics.ts';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

let granted = false;
let loaded = false;

export function initGtag(): void {
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') {
    // gtag.js oczekuje obiektu `arguments`, nie tablicy
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments);
    };
  }
  window.gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
  });
}

/** Ładuje gtag.js po aktywacji strony (prerender nie liczy się jako odsłona). */
function load(): void {
  if (loaded) return;
  loaded = true;
  const go = () => {
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
    document.head.appendChild(s);
    window.gtag('js', new Date());
    window.gtag('config', GA4_ID);
  };
  const doc = document as Document & { prerendering?: boolean };
  if (doc.prerendering) document.addEventListener('prerenderingchange', go, { once: true });
  else go();
}

export function grant(): void {
  granted = true;
  (window as unknown as Record<string, unknown>)[`ga-disable-${GA4_ID}`] = false;
  window.gtag('consent', 'update', { analytics_storage: 'granted' });
  load();
}

export function revoke(): void {
  const wasGranted = granted || loaded;
  granted = false;
  window.gtag('consent', 'update', { analytics_storage: 'denied' });
  if (!wasGranted) return;
  // gtag.js już działa na tej stronie — wyłącz go i usuń jego pliki cookie
  (window as unknown as Record<string, unknown>)[`ga-disable-${GA4_ID}`] = true;
  const host = location.hostname;
  const domains = ['', host, `.${host}`, `.${host.replace(/^www\./, '')}`];
  for (const c of document.cookie.split(';')) {
    const name = c.split('=')[0]?.trim();
    if (!name || !/^_ga(_|$)/.test(name)) continue;
    for (const d of domains) {
      document.cookie = `${name}=; Max-Age=0; path=/${d ? `; domain=${d}` : ''}`;
    }
  }
}

/** Zdarzenie GA4 — tylko przy udzielonej zgodzie. */
export function track(name: string, params: Record<string, string | number> = {}): void {
  if (!granted) return;
  window.gtag('event', name, params);
}
