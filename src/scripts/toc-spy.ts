/**
 * Spis treści (≥ 1280 px, przyklejony): bieżąca sekcja (aria-current="location") i linia postępu czytania.
 * Działa tylko, gdy spis jest widoczny; jedno przeliczenie na klatkę (requestAnimationFrame), pasywne nasłuchy.
 * Bez animacji przewijania — przy prefers-reduced-motion pasek zmienia się bez przejścia (CSS).
 *
 * Poniżej 1280 px (spis jako <details> na początku treści): przycisk „Spis treści” przy dolnej krawędzi
 * pojawia się, gdy spis zniknie nad ekranem; otwiera spis i przenosi do niego. Wybór pozycji zwija spis.
 */
const toc = document.querySelector<HTMLElement>('[data-toc]');
if (toc) {
  const links = Array.from(toc.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'));
  const targets = links
    .map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1))))
    .map((el, i) => ({ el, a: links[i] }))
    .filter((x): x is { el: HTMLElement; a: HTMLAnchorElement } => !!x.el);
  const progress = toc.querySelector<HTMLElement>('[data-toc-progress]');
  const bar = toc.querySelector<HTMLElement>('[data-toc-bar]');
  const pct = toc.querySelector<HTMLElement>('[data-toc-pct]');
  const main = (toc.closest('.doc')?.querySelector<HTMLElement>('.doc__main') ?? document.querySelector('main')) as HTMLElement | null;
  const wide = window.matchMedia('(min-width: 1280px)');
  let current: HTMLAnchorElement | null = null;
  let queued = false;

  const update = () => {
    queued = false;
    if (!wide.matches || !main) return;
    const line = (parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 88) + window.innerHeight * 0.15;
    let next: HTMLAnchorElement | null = null;
    let best = -Infinity;
    for (const t of targets) {
      const top = t.el.getBoundingClientRect().top;
      if (top <= line && top > best) {
        best = top;
        next = t.a;
      }
    }
    if (next !== current) {
      current?.removeAttribute('aria-current');
      next?.setAttribute('aria-current', 'location');
      current = next;
    }
    const r = main.getBoundingClientRect();
    const total = r.height - window.innerHeight;
    const p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 1;
    if (bar) bar.style.transform = `scaleX(${p.toFixed(3)})`;
    if (pct) pct.textContent = `${Math.round(p * 100)}%`;
  };
  const queue = () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(update);
    }
  };

  if (targets.length && progress) {
    progress.hidden = false;
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue, { passive: true });
    wide.addEventListener('change', queue);
    queue();
  }
}

const mob = document.querySelector<HTMLDetailsElement>('[data-toc-mobile]');
const fab = document.querySelector<HTMLAnchorElement>('[data-toc-fab]');
if (mob && fab && 'IntersectionObserver' in window) {
  const narrow = window.matchMedia('(max-width: 1279.98px)');
  let past = false;
  const sync = () => {
    fab.hidden = !(narrow.matches && past);
  };
  new IntersectionObserver(([e]) => {
    past = !e.isIntersecting && e.boundingClientRect.top < 0;
    sync();
  }).observe(mob);
  narrow.addEventListener('change', sync);
  fab.addEventListener('click', () => {
    mob.open = true;
    mob.querySelector('summary')?.focus({ preventScroll: true });
  });
  // zwinięcie przed przewinięciem do sekcji (obsługa kliknięcia działa przed domyślną akcją linku)
  mob.addEventListener('click', (e) => {
    if (e.target instanceof Element && e.target.closest('a[href^="#"]')) mob.open = false;
  });
}
