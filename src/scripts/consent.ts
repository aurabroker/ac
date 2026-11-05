/**
 * Baner zgody na statystyki (src/components/ConsentBanner.astro) i zdarzenia GA4 z interakcji.
 * Bez JS baner i przycisk w stopce zostają ukryte, a GA4 się nie ładuje.
 *
 * Zdarzenia (tylko po zgodzie): click_to_call (link tel:), cta_click (link do /kontakt/),
 * faq_open (rozwinięcie pytania w FAQ). generate_lead wysyła formularz (src/scripts/contact-form.ts).
 */
import { CONSENT_KEY, CONSENT_MAX_AGE_DAYS, CONSENT_VERSION } from '../lib/analytics.ts';
import { grant, initGtag, revoke, track } from './analytics.ts';

type Choice = 'granted' | 'denied';
interface Stored {
  v: number;
  choice: Choice;
  ts: number;
}

function readChoice(): Choice | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Partial<Stored>;
    if (s.v !== CONSENT_VERSION || (s.choice !== 'granted' && s.choice !== 'denied') || typeof s.ts !== 'number') return null;
    if (Date.now() - s.ts > CONSENT_MAX_AGE_DAYS * 864e5) return null;
    return s.choice;
  } catch {
    return null;
  }
}

function saveChoice(choice: Choice): void {
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ v: CONSENT_VERSION, choice, ts: Date.now() } satisfies Stored));
  } catch {
    /* tryb prywatny / zablokowany storage — wybór obowiązuje do końca wizyty na tej stronie */
  }
}

const text = (el: Element) => (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 100);

function init(): void {
  const banner = document.querySelector<HTMLElement>('[data-consent]');
  if (!banner) return;
  initGtag();

  const show = () => {
    banner.hidden = false;
    banner.querySelector<HTMLButtonElement>('[data-consent-accept]')?.focus({ preventScroll: true });
  };
  const hide = () => {
    banner.hidden = true;
  };
  const decide = (choice: Choice) => {
    saveChoice(choice);
    if (choice === 'granted') grant();
    else revoke();
    hide();
  };

  banner.querySelector('[data-consent-accept]')?.addEventListener('click', () => decide('granted'));
  banner.querySelector('[data-consent-reject]')?.addEventListener('click', () => decide('denied'));
  for (const b of document.querySelectorAll<HTMLButtonElement>('[data-consent-open]')) {
    b.hidden = false;
    b.addEventListener('click', show);
  }

  const choice = readChoice();
  if (choice === 'granted') grant();
  else if (choice === null) banner.hidden = false; // bez przenoszenia fokusu przy wejściu na stronę

  document.addEventListener('click', (e) => {
    const t = e.target as Element | null;
    const link = t?.closest<HTMLAnchorElement>('a[href]');
    if (link) {
      const href = link.getAttribute('href') ?? '';
      if (href.startsWith('tel:')) track('click_to_call', { cta: text(link) });
      else if (href.startsWith('/kontakt/')) track('cta_click', { cta: text(link), link_url: href });
      return;
    }
    const summary = t?.closest('summary');
    const details = summary?.parentElement;
    if (summary && details instanceof HTMLDetailsElement && details.classList.contains('faq__item') && !details.open) {
      track('faq_open', { question: text(summary) });
    }
  });
}

init();
