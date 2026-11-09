// Formularz kontaktowy: wysyłka fetch → /api/kontakt, błędy przy polach, stan „wysłano”.
// Bez JS formularz działa zwykłym POST-em; ta warstwa tylko go ulepsza. Ładuje ją na żądanie ContactForm.astro.
// Konfigurator wpisuje podsumowanie do pola [data-cform-config] i wysyła zdarzenie `cform-config`;
// z innej strony przekazuje je przez sessionStorage (klucz niżej).
// Po udanej wysyłce: zdarzenie GA4 generate_lead (wysyłane tylko przy zgodzie — src/scripts/analytics.ts).
// Ochrona przed spamem: Cloudflare Turnstile (src/lib/turnstile.ts) — widżet renderowany w [data-turnstile] przy
// pierwszym fokusie; token (cf-turnstile-response) sprawdza /api/kontakt. Token jest jednorazowy: reset po każdej próbie.

import { track } from './analytics.ts';
import { TURNSTILE_ACTION, TURNSTILE_SCRIPT, TURNSTILE_SITEKEY } from '../lib/turnstile.ts';

interface Turnstile {
  render(el: HTMLElement, opts: Record<string, unknown>): string;
  reset(id?: string): void;
  getResponse(id?: string): string | undefined;
}
declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

const TS_FIELD = 'cf-turnstile-response';
const TS_WAIT_MS = 8000;
let tsLoad: Promise<Turnstile | null> | null = null;

function loadTurnstile(): Promise<Turnstile | null> {
  tsLoad ??= new Promise((resolve) => {
    if (window.turnstile) return resolve(window.turnstile);
    const s = document.createElement('script');
    s.src = TURNSTILE_SCRIPT;
    s.async = true;
    s.onload = () => resolve(window.turnstile ?? null);
    s.onerror = () => resolve(null); // np. bloker treści
    document.head.appendChild(s);
  });
  return tsLoad;
}

/** Token Turnstile; czeka do TS_WAIT_MS, aż niewidoczne sprawdzenie się zakończy. */
async function turnstileToken(ts: Turnstile | null, id: string | undefined): Promise<string> {
  if (!ts || id === undefined) return '';
  const end = Date.now() + TS_WAIT_MS;
  let token = ts.getResponse(id) ?? '';
  while (!token && Date.now() < end) {
    await new Promise((r) => setTimeout(r, 250));
    token = ts.getResponse(id) ?? '';
  }
  return token;
}

const CONFIG_KEY = 'aura-config-handoff';

type Errors = Record<string, string>;

function setErrors(form: HTMLFormElement, errors: Errors) {
  form.querySelectorAll<HTMLElement>('[data-err]').forEach((el) => (el.textContent = ''));
  form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
  let first: HTMLElement | null = null;
  for (const [field, message] of Object.entries(errors)) {
    const out = form.querySelector<HTMLElement>(`[data-err="${field}"]`);
    if (out) out.textContent = message;
    const input = form.querySelector<HTMLElement>(`[name="${field}"]`);
    if (input) {
      input.setAttribute('aria-invalid', 'true');
      first ??= input;
    }
  }
  first?.focus();
}

function validate(form: HTMLFormElement): Errors {
  const v = (n: string) => (form.elements.namedItem(n) as HTMLInputElement | null)?.value.trim() ?? '';
  const errors: Errors = {};
  if (v('name').length < 2) errors.name = 'Podaj imię i nazwisko.';
  if (!/^[^\s@<>()[\],;:"]+@[^\s@<>()[\],;:"]+\.[a-z]{2,}$/i.test(v('email'))) errors.email = 'Podaj poprawny adres e-mail.';
  if (v('message').length < 10) errors.message = 'Opisz krótko, w czym możemy pomóc (min. 10 znaków).';
  if (!(form.elements.namedItem('consent') as HTMLInputElement | null)?.checked) errors.consent = 'Zaznacz prośbę o kontakt.';
  return errors;
}

function showDone(root: HTMLElement, form: HTMLFormElement) {
  const done = root.querySelector<HTMLElement>('[data-cform-done]');
  form.hidden = true;
  if (done) {
    done.hidden = false;
    done.focus();
  }
  const status = root.querySelector<HTMLElement>('[data-cform-status]');
  if (status) status.textContent = 'Wiadomość wysłana.';
  try {
    sessionStorage.removeItem(CONFIG_KEY);
  } catch {
    /* brak sessionStorage */
  }
}

function applyConfig(root: HTMLElement, summary: string) {
  const field = root.querySelector<HTMLInputElement>('[data-cform-config]');
  const note = root.querySelector<HTMLElement>('[data-config-note]');
  const message = root.querySelector<HTMLTextAreaElement>('[name="message"]');
  if (field) field.value = summary;
  if (note) note.hidden = !summary;
  if (summary && message && !message.value.trim()) message.value = 'Proszę o analizę programu według konfiguracji z konfiguratora.';
}

export function initContactForms() {
  for (const root of document.querySelectorAll<HTMLElement>('[data-cform]')) {
    if (root.dataset.ready) continue;
    root.dataset.ready = '1';
    const form = root.querySelector<HTMLFormElement>('form');
    if (!form) continue;
    form.noValidate = true; // walidacja przy polach zamiast dymków przeglądarki
    const t = form.querySelector<HTMLInputElement>('[data-cform-t]');
    if (t && !t.value) t.value = String(Date.now());

    // konfiguracja z konfiguratora na tej stronie albo przekazana z innej strony
    const config = root.querySelector<HTMLInputElement>('[data-cform-config]');
    let pending = config?.value ?? '';
    try {
      pending ||= sessionStorage.getItem(CONFIG_KEY) ?? '';
    } catch {
      /* brak sessionStorage */
    }
    if (pending) applyConfig(root, pending);
    root.addEventListener('cform-config', () => applyConfig(root, config?.value ?? ''));

    // Turnstile: render od razu po załadowaniu warstwy JS (zwykle przy pierwszym fokusie), żeby token był gotowy
    let widgetId: string | undefined;
    const box = form.querySelector<HTMLElement>('[data-turnstile]');
    const tsReady: Promise<Turnstile | null> = box
      ? loadTurnstile().then((ts) => {
          if (ts) {
            widgetId = ts.render(box, {
              sitekey: TURNSTILE_SITEKEY,
              action: TURNSTILE_ACTION,
              appearance: 'interaction-only',
              size: 'flexible',
              theme: 'light',
              language: 'pl',
              'refresh-expired': 'auto',
            });
          }
          return ts;
        })
      : Promise.resolve(null);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errors = validate(form);
      if (Object.keys(errors).length) {
        setErrors(form, errors);
        return;
      }
      setErrors(form, {});
      const button = form.querySelector<HTMLButtonElement>('[data-cform-submit]');
      const label = button?.querySelector<HTMLElement>('[data-label]');
      const original = label?.textContent ?? '';
      if (button) button.disabled = true;
      if (label) label.textContent = 'Wysyłanie…';
      const ts = await tsReady;
      const token = await turnstileToken(ts, widgetId);
      if (box && !token) {
        if (button) button.disabled = false;
        if (label) label.textContent = original;
        setErrors(form, {
          form: ts
            ? 'Trwa sprawdzanie zabezpieczenia przed spamem. Jeśli nad przyciskiem widać pole do zaznaczenia, zaznacz je i wyślij ponownie.'
            : 'Nie udało się wczytać zabezpieczenia przed spamem (może je blokować rozszerzenie przeglądarki). Spróbuj ponownie albo zadzwoń: +48 500 502 702.',
        });
        return;
      }
      const data = Object.fromEntries(new FormData(form).entries());
      data.consent = (form.elements.namedItem('consent') as HTMLInputElement).checked ? 'on' : '';
      if (token) data[TS_FIELD] = token;
      try {
        const res = await fetch(form.action, {
          method: 'POST',
          headers: { 'content-type': 'application/json', accept: 'application/json' },
          body: JSON.stringify(data),
        });
        const body = (await res.json().catch(() => ({}))) as { ok?: boolean; errors?: Errors };
        if (res.ok && body.ok) {
          showDone(root, form);
          track('generate_lead', { form: 'kontakt' });
          return;
        }
        setErrors(form, body.errors ?? { form: 'Nie udało się wysłać wiadomości. Spróbuj ponownie albo zadzwoń: +48 500 502 702.' });
      } catch {
        setErrors(form, { form: 'Brak połączenia. Spróbuj ponownie albo zadzwoń: +48 500 502 702.' });
      } finally {
        if (button) button.disabled = false;
        if (label) label.textContent = original;
        if (ts && widgetId !== undefined) ts.reset(widgetId); // token jednorazowy — nowy na kolejną próbę
      }
    });
  }
}
