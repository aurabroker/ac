// Formularz kontaktowy: wysyłka fetch → /api/kontakt, błędy przy polach, stan „wysłano”.
// Bez JS formularz działa zwykłym POST-em; ta warstwa tylko go ulepsza. Ładuje ją na żądanie ContactForm.astro.
// Konfigurator wpisuje podsumowanie do pola [data-cform-config] i wysyła zdarzenie `cform-config`;
// z innej strony przekazuje je przez sessionStorage (klucz niżej).

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
      const data = Object.fromEntries(new FormData(form).entries());
      data.consent = (form.elements.namedItem('consent') as HTMLInputElement).checked ? 'on' : '';
      try {
        const res = await fetch(form.action, {
          method: 'POST',
          headers: { 'content-type': 'application/json', accept: 'application/json' },
          body: JSON.stringify(data),
        });
        const body = (await res.json().catch(() => ({}))) as { ok?: boolean; errors?: Errors };
        if (res.ok && body.ok) {
          showDone(root, form);
          return;
        }
        setErrors(form, body.errors ?? { form: 'Nie udało się wysłać wiadomości. Spróbuj ponownie albo zadzwoń: +48 500 502 702.' });
      } catch {
        setErrors(form, { form: 'Brak połączenia. Spróbuj ponownie albo zadzwoń: +48 500 502 702.' });
      } finally {
        if (button) button.disabled = false;
        if (label) label.textContent = original;
      }
    });
  }
}
