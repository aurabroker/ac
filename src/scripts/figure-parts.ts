/**
 * Rysunek interaktywny (hero): części SVG z data-part="n", balony .bal[data-part], karty w [data-ifig-readout].
 * - przyciski nad balonami: jeden przystanek Tab dla całej grupy (roving tabindex), strzałki/Home/End
 *   przechodzą między częściami w kolejności numeracji; obok — lista części w karcie (stan początkowy),
 *   aria-label „n. Tytuł”, aria-describedby → zdanie z karty, aria-pressed = przypięta karta;
 * - najechanie (mysz, pióro) na część lub numer: podświetlenie (niebieski, grubsza linia), reszta przygaszona;
 * - kliknięcie/dotknięcie: przypina kartę; ponowne lub poza rysunkiem — odpina; Esc zamyka.
 * Pozycje przycisków: procenty z viewBox (CSSOM, zgodne z CSP style-src 'self').
 */

function init(fig: HTMLElement) {
  const stage = fig.querySelector<HTMLElement>('[data-ifig-stage]');
  const svg = stage?.querySelector<SVGSVGElement>('svg.fig-svg');
  const readout = fig.querySelector<HTMLElement>('[data-ifig-readout]');
  if (!stage || !svg || !readout) return;
  const vb = svg.viewBox.baseVal;
  if (!vb || !vb.width) return;

  const cards = new Map<number, HTMLElement>();
  readout.querySelectorAll<HTMLElement>('[data-card]').forEach((c) => cards.set(Number(c.dataset.card), c));
  const hint = readout.querySelector<HTMLElement>('[data-ifig-hint]');
  const legend = Array.from(fig.querySelectorAll<HTMLElement>('figcaption li[data-part]'));
  const parts = Array.from(svg.querySelectorAll<SVGElement>('[data-part]'));

  const layer = document.createElement('div');
  layer.className = 'ifig__hot-layer';
  const buttons = new Map<number, HTMLButtonElement>();
  /** Środki balonów w procentach rysunku (pozycje bazowe przycisków). */
  const centres = new Map<number, { x: number; y: number }>();
  for (const g of svg.querySelectorAll<SVGGElement>('.bal[data-part]')) {
    const n = Number(g.getAttribute('data-part'));
    const c = g.querySelector('circle');
    const card = cards.get(n);
    if (!c || !card || buttons.has(n)) continue;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'ifig__hot';
    b.dataset.part = String(n);
    centres.set(n, { x: ((c.cx.baseVal.value - vb.x) / vb.width) * 100, y: ((c.cy.baseVal.value - vb.y) / vb.height) * 100 });
    b.setAttribute('aria-label', `${n}. ${card.dataset.title ?? ''}`);
    const desc = card.querySelector('.ifig__text[id]');
    if (desc) b.setAttribute('aria-describedby', desc.id);
    b.setAttribute('aria-pressed', 'false');
    buttons.set(n, b);
  }
  if (!buttons.size) return;
  const order = [...buttons.keys()].sort((a, b) => a - b);
  for (const n of order) layer.appendChild(buttons.get(n)!);
  stage.appendChild(layer);

  // Na wąskim ekranie balony leżą blisko siebie: rozsuń nachodzące przyciski (min. odstęp środków),
  // żeby dotknięcie trafiało w zamierzoną część. Przesunięcie o kilka pikseli — przycisk dalej kryje balon.
  const MIN_GAP = 31;
  const EDGE = 14;
  const place = () => {
    const w = layer.clientWidth;
    const h = layer.clientHeight;
    if (!w || !h) return;
    const pts = order.map((n) => {
      const c = centres.get(n)!;
      return { n, x: (c.x / 100) * w, y: (c.y / 100) * h };
    });
    for (let pass = 0; pass < 12; pass++) {
      let moved = false;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[j].x - pts[i].x;
          const dy = pts[j].y - pts[i].y;
          const d = Math.hypot(dx, dy);
          if (d >= MIN_GAP) continue;
          const ux = d ? dx / d : 1;
          const uy = d ? dy / d : 0;
          const push = (MIN_GAP - d) / 2;
          pts[i].x -= ux * push;
          pts[i].y -= uy * push;
          pts[j].x += ux * push;
          pts[j].y += uy * push;
          for (const q of [pts[i], pts[j]]) q.x = Math.min(w - EDGE, Math.max(EDGE, q.x));
          moved = true;
        }
      }
      if (!moved) break;
    }
    for (const p of pts) {
      const b = buttons.get(p.n)!;
      b.style.left = `${(p.x / w) * 100}%`;
      b.style.top = `${(p.y / h) * 100}%`;
    }
  };
  place();
  if ('ResizeObserver' in window) new ResizeObserver(place).observe(layer);

  readout.hidden = false;
  fig.classList.add('is-ready');

  let pinned: number | null = null;
  let current: number | null = null;
  const show = (n: number | null) => {
    if (n === current) return;
    current = n;
    const key = n === null ? '' : String(n);
    fig.classList.toggle('is-active', n !== null);
    for (const el of parts) el.classList.toggle('is-on', el.getAttribute('data-part') === key);
    cards.forEach((c, k) => c.classList.toggle('is-shown', k === n));
    hint?.classList.toggle('is-shown', n === null);
    for (const li of legend) li.classList.toggle('is-on', li.dataset.part === key);
    buttons.forEach((b, k) => b.classList.toggle('is-on', k === n));
  };
  const focused = () => {
    const a = document.activeElement as HTMLElement | null;
    return a && layer.contains(a) ? Number(a.dataset.part) : null;
  };
  const pin = (n: number | null) => {
    pinned = n;
    buttons.forEach((b, k) => b.setAttribute('aria-pressed', String(k === n)));
    show(n ?? focused());
  };
  const partOf = (t: EventTarget | null) => {
    const el = t instanceof Element ? t.closest('[data-part]') : null;
    return el ? Number(el.getAttribute('data-part')) : null;
  };

  // mysz / pióro: podgląd przy najechaniu
  stage.addEventListener('pointerover', (e) => {
    if (e.pointerType === 'touch') return;
    const n = partOf(e.target);
    if (n !== null && cards.has(n)) show(n);
  });
  stage.addEventListener('pointerleave', (e) => {
    if (e.pointerType !== 'touch') show(focused() ?? pinned);
  });
  for (const li of legend) {
    li.addEventListener('pointerenter', (e) => e.pointerType !== 'touch' && show(Number(li.dataset.part)));
    li.addEventListener('pointerleave', (e) => e.pointerType !== 'touch' && show(focused() ?? pinned));
  }

  // kliknięcie / dotknięcie części rysunku albo numeru: przypnij lub odepnij
  stage.addEventListener('click', (e) => {
    const n = partOf(e.target);
    if (n === null || !cards.has(n)) return pin(null);
    pin(pinned === n ? null : n);
  });
  document.addEventListener('click', (e) => {
    if (pinned !== null && !fig.contains(e.target as Node)) pin(null);
  });

  // klawiatura
  // jeden przystanek Tab: aktywny jest ostatnio wskazany przycisk (na start — pierwszy)
  const rove = (n: number) => buttons.forEach((b, k) => (b.tabIndex = k === n ? 0 : -1));
  rove(order[0]);
  layer.addEventListener('focusin', (e) => {
    const n = partOf(e.target);
    if (n !== null) {
      rove(n);
      show(n);
    }
  });
  layer.addEventListener('focusout', (e) => {
    const to = e.relatedTarget as Node | null;
    if (to && (layer.contains(to) || readout.contains(to))) return;
    show(pinned);
  });
  layer.addEventListener('keydown', (e) => {
    const n = partOf(e.target);
    if (n === null) return;
    const i = order.indexOf(n);
    let next: number | undefined;
    if (e.key === 'Escape') {
      pin(null);
      show(null);
      e.preventDefault();
      return;
    }
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = order[(i + 1) % order.length];
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = order[(i - 1 + order.length) % order.length];
    else if (e.key === 'Home') next = order[0];
    else if (e.key === 'End') next = order[order.length - 1];
    if (next !== undefined) {
      e.preventDefault();
      buttons.get(next)?.focus();
    }
  });
  // lista części w karcie (stan początkowy): wybór przypina część; „Lista części” wraca do listy
  readout.querySelectorAll<HTMLButtonElement>('[data-chip]').forEach((chip) =>
    chip.addEventListener('click', () => {
      const n = Number(chip.dataset.chip);
      if (!cards.has(n)) return;
      pin(n);
      cards.get(n)?.focus({ preventScroll: true });
    }),
  );
  readout.querySelectorAll<HTMLButtonElement>('[data-ifig-back]').forEach((back) =>
    back.addEventListener('click', () => {
      const n = current;
      pin(null);
      show(null);
      readout.querySelector<HTMLElement>(`[data-chip="${n}"]`)?.focus({ preventScroll: true });
    }),
  );

  readout.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && current !== null) {
      const b = buttons.get(current);
      pin(null);
      b?.focus();
    }
  });
}

document.querySelectorAll<HTMLElement>('[data-ifig]').forEach(init);
