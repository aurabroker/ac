/**
 * Słownik (/slownik/): filtrowanie haseł na bieżąco. Bez polskich znaków i wielkości liter
 * („udzial wlasny” = „Udział własny”), każde słowo zapytania musi wystąpić w haśle, nazwie angielskiej
 * lub definicji. Litery A–Z bez wyników są wyszarzone; licznik w regionie role="status".
 */
const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ł/g, 'l')
    .replace(/\s+/g, ' ');

const plural = (n: number) => {
  const d = n % 10;
  const t = n % 100;
  return n === 1 ? 'hasło' : d >= 2 && d <= 4 && (t < 12 || t > 14) ? 'hasła' : 'haseł';
};

const box = document.querySelector<HTMLElement>('[data-gl-search]');
const input = box?.querySelector<HTMLInputElement>('[data-gl-input]');
if (box && input) {
  const count = box.querySelector<HTMLElement>('[data-gl-count]');
  const empty = document.querySelector<HTMLElement>('[data-gl-empty]');
  const items = Array.from(document.querySelectorAll<HTMLElement>('[data-gl-item]')).map((el) => ({ el, text: norm(el.textContent ?? '') }));
  const groups = Array.from(document.querySelectorAll<HTMLElement>('[data-gl-group]'));
  const letters = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-gl-letter]'));
  let timer = 0;

  const run = () => {
    const words = norm(input.value).trim().split(' ').filter(Boolean);
    let n = 0;
    for (const it of items) {
      const ok = words.every((w) => it.text.includes(w));
      it.el.hidden = !ok;
      if (ok) n++;
    }
    for (const g of groups) {
      const any = !!g.querySelector('[data-gl-item]:not([hidden])');
      g.hidden = !any;
      const a = letters.find((l) => l.dataset.glLetter === g.dataset.glGroup);
      if (a) {
        if (any) {
          a.removeAttribute('aria-disabled');
          a.removeAttribute('tabindex');
        } else {
          a.setAttribute('aria-disabled', 'true');
          a.setAttribute('tabindex', '-1');
        }
      }
    }
    if (empty) empty.hidden = n > 0;
    window.clearTimeout(timer);
    const text = words.length ? `Znaleziono: ${n} ${plural(n)} z ${items.length}` : `${items.length} ${plural(items.length)} A–Z`;
    // licznik (i komunikat czytnika) po krótkiej pauzie w pisaniu — bez komunikatu na każdą literę
    timer = window.setTimeout(() => count && (count.textContent = text), words.length ? 250 : 0);
  };

  input.addEventListener('input', run);
  // licznik początkowy wpisujemy, zanim pole stanie się widoczne (bez komunikatu czytnika przy wczytaniu)
  if (count) count.textContent = `${items.length} ${plural(items.length)} A–Z`;
  if (input.value) run();
  box.hidden = false;
}
