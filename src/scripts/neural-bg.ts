/**
 * Tło serwisu: delikatnie dryfująca siatka węzłów na <canvas> pod treścią (NeuralBackground).
 * Linie grafitowe ≤ 10% krycia między bliskimi węzłami, ~12% węzłów w błękicie z wolnym pulsem.
 * Kursor (tylko wskaźnik precyzyjny, nie dotyk): węzły w promieniu R łączą się z nim wyraźniej
 * i lekko do niego ciążą — przesunięcie wygasa, gdy kursor odejdzie (bez zbijania się w kłąb).
 * Nie startuje przy prefers-reduced-motion i trybie oszczędzania danych; stoi w ukrytej karcie;
 * bez ruchu kursora ~30 kl./s. Niczego nie zapisuje w przeglądarce: każda strona losuje nową siatkę.
 */
const c = document.querySelector<HTMLCanvasElement>('[data-nbg]');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
const ctx = !reduce.matches && !saveData && c?.getContext('2d');

if (c && ctx) {
  type Node = { x: number; y: number; vx: number; vy: number; b: number; p: number; ox: number; oy: number; q: number };
  const LINK = 140; // zasięg linii między węzłami (px)
  const R = 160; // zasięg kursora (px)
  const css = getComputedStyle(document.documentElement);
  const ink = css.getPropertyValue('--ink-2').trim() || '#3b424c';
  const blue = css.getPropertyValue('--blue').trim() || '#1f4bc2';
  const rnd = Math.random;
  let W = 0;
  let H = 0;
  let dpr = 0;
  let raf = 0;
  let last = 0;
  let moved = -1e9;
  let mx = 0;
  let my = 0;
  let on = 0; // kursor nad oknem
  let pa = 0; // wygaszanie reakcji na kursor (0–1)
  const nodes: Node[] = [];

  const make = (): Node => ({
    x: rnd() * W,
    y: rnd() * H,
    vx: (rnd() - 0.5) * 12,
    vy: (rnd() - 0.5) * 12,
    b: +(rnd() < 0.12),
    p: rnd() * 6.3,
    ox: 0,
    oy: 0,
    q: 0,
  });

  const size = () => {
    const w = c.clientWidth;
    const h = c.clientHeight;
    const d = Math.min(devicePixelRatio || 1, 2);
    if (w === W && h === H && d === dpr) return;
    W = w;
    H = h;
    dpr = d;
    c.width = Math.round(w * d);
    c.height = Math.round(h * d);
    ctx.setTransform(d, 0, 0, d, 0, 0);
    // gęstość wg powierzchni, z limitem: ~70 na desktopie, ~30 na wąskim ekranie
    const n = Math.min(w < 640 ? 30 : 70, Math.round((w * h) / 12000));
    while (nodes.length < n) nodes.push(make());
    nodes.length = n;
  };

  const line = (x1: number, y1: number, x2: number, y2: number, a: number) => {
    ctx.globalAlpha = a;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const dt = now - last;
    if (dt < (now - moved < 1500 ? 0 : 30)) return;
    last = now;
    const s = Math.min(dt, 100) / 1000;
    const ease = Math.min(1, dt / 220);
    pa += (on - pa) * ease;
    ctx.clearRect(0, 0, W, H);
    for (const a of nodes) {
      a.x += a.vx * s;
      a.y += a.vy * s;
      if (a.x < -20) a.x = W + 20;
      else if (a.x > W + 20) a.x = -20;
      if (a.y < -20) a.y = H + 20;
      else if (a.y > H + 20) a.y = -20;
      const dx = mx - a.x;
      const dy = my - a.y;
      // q: bliskość kursora (0–1) — mocniejsze linie i kropka, lekkie ciążenie ku kursorowi
      a.q = Math.max(0, 1 - Math.hypot(dx, dy) / R) * pa;
      a.ox += (dx * a.q * 0.28 - a.ox) * ease;
      a.oy += (dy * a.q * 0.28 - a.oy) * ease;
    }
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.8;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      const ax = a.x + a.ox;
      const ay = a.y + a.oy;
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const d = Math.hypot(ax - b.x - b.ox, ay - b.y - b.oy);
        if (d < LINK) line(ax, ay, b.x + b.ox, b.y + b.oy, (1 - d / LINK) * 0.1 * (1 + a.q + b.q));
      }
      const d = Math.hypot(mx - ax, my - ay);
      if (d < R && pa > 0.01) line(ax, ay, mx, my, (1 - d / R) * 0.24 * pa);
    }
    for (const a of nodes) {
      ctx.globalAlpha = (a.b ? 0.32 + 0.18 * Math.sin(now / 700 + a.p) : 0.22) + a.q * 0.3;
      ctx.fillStyle = a.b ? blue : ink;
      ctx.beginPath();
      ctx.arc(a.x + a.ox, a.y + a.oy, a.b ? 2.2 : 1.3, 0, 6.3);
      ctx.fill();
    }
  };

  const start = () => {
    if (raf || document.hidden || reduce.matches) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
    c.classList.add('is-on');
  };
  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
  };

  size();
  start();

  let t = 0;
  addEventListener('resize', () => {
    clearTimeout(t);
    t = window.setTimeout(size, 200);
  });
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  reduce.addEventListener('change', () => {
    if (!reduce.matches) return start();
    stop();
    c.classList.remove('is-on');
  });

  if (matchMedia('(pointer: fine)').matches) {
    addEventListener(
      'pointermove',
      (e) => {
        if (e.pointerType === 'touch') return;
        mx = e.clientX;
        my = e.clientY;
        on = 1;
        moved = e.timeStamp;
      },
      { passive: true },
    );
    document.documentElement.addEventListener('mouseleave', () => (on = 0));
  }
}
