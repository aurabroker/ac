/**
 * Filtry katalogu (/ubezpieczenia/): ryzyko (grupa kart) i branża. Natychmiastowe, przyciski aria-pressed,
 * stan w adresie: #ryzyko=<grupa>&branza=<id> (history.replaceState — bez przewijania). Inne kotwice
 * (#faq, #grupa-…) są ignorowane.
 */
const root = document.querySelector<HTMLElement>('[data-cat-filter]');
if (root) {
  const chips = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-f]'));
  const items = Array.from(document.querySelectorAll<HTMLElement>('[data-cat-item]'));
  const groups = Array.from(document.querySelectorAll<HTMLElement>('[data-cat-group]'));
  const count = root.querySelector<HTMLElement>('[data-cat-count]');
  const reset = root.querySelector<HTMLButtonElement>('[data-cat-reset]');
  const state = { ryzyko: '', branza: '' };
  const valid = (f: 'ryzyko' | 'branza', v: string) => chips.some((c) => c.dataset.f === f && c.dataset.v === v);

  const readHash = () => {
    const h = decodeURIComponent(location.hash.slice(1));
    if (!/^(ryzyko|branza)=/.test(h)) return false;
    const p = new URLSearchParams(h);
    state.ryzyko = valid('ryzyko', p.get('ryzyko') ?? '') ? (p.get('ryzyko') ?? '') : '';
    state.branza = valid('branza', p.get('branza') ?? '') ? (p.get('branza') ?? '') : '';
    return true;
  };
  const writeHash = () => {
    const p = new URLSearchParams();
    if (state.ryzyko) p.set('ryzyko', state.ryzyko);
    if (state.branza) p.set('branza', state.branza);
    const h = p.toString();
    history.replaceState(history.state, '', h ? `#${h}` : location.pathname + location.search);
  };

  const sheets = (n: number) => {
    const d = n % 10;
    const t = n % 100;
    return n === 1 ? 'arkusz' : d >= 2 && d <= 4 && (t < 12 || t > 14) ? 'arkusze' : 'arkuszy';
  };
  const apply = (announce: boolean) => {
    let shown = 0;
    for (const it of items) {
      const ind = (it.dataset.ind ?? '*').split(' ');
      const ok =
        (!state.ryzyko || it.dataset.risk === state.ryzyko) &&
        (!state.branza || ind.includes('*') || ind.includes(state.branza));
      it.hidden = !ok;
      if (ok) shown++;
    }
    for (const g of groups) g.hidden = !g.querySelector('[data-cat-item]:not([hidden])');
    for (const c of chips) c.setAttribute('aria-pressed', String(state[c.dataset.f as 'ryzyko' | 'branza'] === c.dataset.v));
    const filtered = !!(state.ryzyko || state.branza);
    if (reset) reset.hidden = !filtered;
    if (count) {
      const text = filtered ? `Pokazano ${shown} z ${items.length} arkuszy` : `${items.length} ${sheets(items.length)} w katalogu`;
      if (announce || count.textContent !== text) count.textContent = text;
    }
  };

  chips.forEach((c) =>
    c.addEventListener('click', () => {
      const f = c.dataset.f as 'ryzyko' | 'branza';
      state[f] = c.dataset.v ?? '';
      writeHash();
      apply(true);
    }),
  );
  reset?.addEventListener('click', () => {
    state.ryzyko = '';
    state.branza = '';
    writeHash();
    apply(true);
    chips[0]?.focus();
  });
  window.addEventListener('hashchange', () => readHash() && apply(true));

  // stan z adresu ustawiamy, zanim panel stanie się widoczny — region role="status" nie ogłasza nic przy wczytaniu
  readHash();
  apply(false);
  root.hidden = false;
}
