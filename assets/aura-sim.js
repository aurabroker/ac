/*! aura-sim.js · dekoracyjna „symulacja zagrożeń” (sieć · blockchain · model AI) + opcjonalne tło wideo. Bez zależności i sieci.
 *  <div class="aura-sim" data-sim="cyber|ai|none" data-messages='[{"sev":"WYSOKI","title":"…","detail":"…","cover":"…","pin":true}]'
 *       data-video="assets/video/x.mp4" data-poster="assets/video/x.jpg"></div>
 *  Auto-init na DOMContentLoaded; ręcznie: AuraSim.init(el) → { el, isRunning(), destroy() }.
 *  sev: KRYTYCZNY|WYSOKI|ŚREDNI|INFO · cover: dopisek „ochrona” · pin: karta w trybie statycznym · fx: atk|hall|block|ok */
(function (W, D) {
  'use strict';
  var NAVY2 = '#1a3a6e', GOLD = '#b8920a', GREY = '#8aa0b8', LINE = '#dde6f0', RED = '#c0392b', TXT2 = '#4a6278',
    MONO = "'JetBrains Mono',ui-monospace,Menlo,monospace", TAU = Math.PI * 2, FADE = 1.2;
  var SEV = { 'KRYTYCZNY': 'crit', 'WYSOKI': 'high', 'ŚREDNI': 'med', 'INFO': 'info', crit: 'crit', high: 'high', med: 'med', info: 'info' },
    LBL = { crit: 'KRYTYCZNY', high: 'WYSOKI', med: 'ŚREDNI', info: 'INFO' }, COL = { crit: RED, high: GOLD, med: NAVY2, info: '#0d7b6e' },
    LAB = ['API', 'VPN', 'MAIL', 'DB', 'ERP', 'CRM', 'SSO', 'CLOUD', 'BACKUP', 'WWW'];
  // Domyślne komunikaty: copy deck A5.1 (1–10). Strona może podać własne w data-messages.
  var MSG = [
    ['KRYTYCZNY', 'Ransomware szyfruje serwer plików', 'Żądanie okupu i groźba publikacji danych klientów', 'Cyber: wymuszenie i odtworzenie danych'],
    ['WYSOKI', 'Logowanie admina z nowego kraju', 'Nieznane urządzenie, nietypowa pora, brak MFA', 'Cyber: reakcja na incydent'],
    ['WYSOKI', 'Deepfake „CFO” zleca pilny przelew', 'Wideorozmowa: nowy rachunek, przelew jeszcze dziś', 'Cyberprzestępstwa (moduł opcjonalny)'],
    ['ŚREDNI', 'LLMjacking: skok zużycia tokenów', 'Ktoś nadużywa Twojego modelu AI, rachunek rośnie', 'Cyberprzestępstwa (moduł opcjonalny)'],
    ['WYSOKI', 'Halucynacja AI w raporcie dla klienta', 'Model podał nieistniejące dane, klient żąda odszkodowania', 'OC zawodowe: błędy i zaniechania'],
    ['ŚREDNI', 'Blockchain: niezgodny hash bloku', 'Integralność rejestru naruszona, węzeł odizolowany', ''],
    ['KRYTYCZNY', 'Pozew w sądzie federalnym w USA', 'Klient z Kalifornii żąda odszkodowania za błąd we wdrożeniu', 'OC zawodowe: obrona prawna'],
    ['WYSOKI', 'Zmiana numeru konta na fakturze', 'Mail „od dostawcy” z nowym rachunkiem do przelewu', 'Cyberprzestępstwa (moduł opcjonalny)'],
    ['ŚREDNI', 'Prompt injection w chatbocie', 'Bot ujawnił dane klienta po złośliwym poleceniu', 'Cyber: naruszenie prywatności'],
    ['INFO', 'Incydent zgłoszony na linię 24/7', 'Reakcję koordynuje likwidator i panel ekspertów', '']
  ].map(function (a) { return { sev: a[0], title: a[1], detail: a[2], cover: a[3] }; });
  var ORDER = { cyber: [6, 0, 1, 7, 5, 2, 4, 9], ai: [4, 3, 8, 2, 5, 6] }, STILL = { cyber: [6, 0], ai: [4, 6] };

  function rng(s) { return function () { s = s + 0x6D2B79F5 | 0; var t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function hx(r, n) { var s = ''; while (n--) s += (r() * 16 | 0).toString(16); return s; }
  function cl(v, a, b) { a = a || 0; b = b == null ? 1 : b; return v < a ? a : v > b ? b : v; }
  function ease(v) { v = cl(v); return v * v * (3 - 2 * v); }
  function p2(v) { return (v < 10 ? '0' : '') + v; }
  function sevOf(m) { return SEV[m.sev] || SEV[String(m.sev || '').toUpperCase()] || 'med'; }
  function kindOf(m) {
    if (m.fx) return m.fx;
    var s = m.title + ' ' + m.detail;
    return /blockchain|hash/i.test(s) ? 'block' : /halucyn|prompt|chatbot/i.test(s) ? 'hall' : sevOf(m) === 'info' ? 'ok' : 'atk';
  }

  /* ── tło wideo: dwa klipy, przenikanie ~1,2 s przed końcem; błąd/404 → warstwa znika ── */
  function videoLayer(el, src, poster) {
    var box = D.createElement('div'), v = [], cur = 0, tm = 0, dead = false, i, e;
    box.className = 'as-vid';
    function kill() {
      if (dead) return; dead = true; clearTimeout(tm);
      v.forEach(function (x) { x.pause(); x.removeAttribute('src'); });
      if (box.parentNode) box.parentNode.removeChild(box);
    }
    function play(x) { var p = x.play(); if (p && p.catch) p.catch(function () {}); }
    function swap() {
      var a = v[cur], b = v[cur ^= 1];
      a.loop = false; b.currentTime = 0; play(b);
      b.className = 'is-on is-top'; a.className = 'is-on';
      clearTimeout(tm);
      tm = setTimeout(function () { a.className = ''; a.pause(); a.currentTime = 0; }, FADE * 1000 + 150);
    }
    function tick() {
      var a = this, b = v[cur ^ 1], d = a.duration;
      if (dead || a !== v[cur]) return;
      if (!(d > 3 && isFinite(d))) { a.loop = true; return; }
      if (a.currentTime > d - FADE - 3) b.preload = 'auto';
      if (a.currentTime >= d - FADE) { if (b.readyState > 1) swap(); else a.loop = true; }
    }
    for (i = 0; i < 2; i++) {
      e = D.createElement('video');
      e.muted = e.defaultMuted = e.playsInline = true; e.preload = 'metadata';
      e.setAttribute('muted', ''); e.setAttribute('playsinline', ''); e.setAttribute('disablepictureinpicture', ''); e.tabIndex = -1;
      if (poster && !i) e.poster = poster;
      e.addEventListener('error', kill);
      e.addEventListener('timeupdate', tick);
      e.addEventListener('ended', function () { if (this === v[cur] && !dead) swap(); });
      e.addEventListener('playing', function () { box.classList.add('is-ready'); });
      e.src = src; v.push(e); box.appendChild(e);
    }
    v[0].className = 'is-on is-top';
    el.insertBefore(box, el.firstChild);
    return {
      show: function (on) { if (!dead) box.hidden = !on; },
      run: function (go) { if (dead) return; if (go) play(v[cur]); else v.forEach(function (x) { x.pause(); }); },
      kill: kill
    };
  }

  function init(el) {
    if (!el || el._auraSim) return el && el._auraSim;
    var mode = el.getAttribute('data-sim') || 'cyber', ai = mode === 'ai', sim = mode !== 'none',
      cv = sim ? D.createElement('canvas') : null, g = cv && cv.getContext && cv.getContext('2d'), msgs, still;
    if (!g) { sim = false; cv = null; }
    try { msgs = JSON.parse(el.getAttribute('data-messages') || '0'); } catch (e) { msgs = 0; }
    if (msgs && msgs.length) {
      still = msgs.filter(function (m) { return m.pin; });
      if (!still.length) still = msgs;
    } else if (sim) {
      mode = ai ? 'ai' : 'cyber';
      msgs = ORDER[mode].map(function (i) { return MSG[i]; });
      still = STILL[mode].map(function (i) { return MSG[i]; });
    } else msgs = still = [];
    var pop = msgs.length ? D.createElement('div') : null, src = el.getAttribute('data-video'), vid = null,
      nc = navigator.connection, mq = W.matchMedia && W.matchMedia('(prefers-reduced-motion: reduce)'),
      lean = !!(nc && nc.saveData) || !!(W.matchMedia && W.matchMedia('(prefers-reduced-data: reduce)').matches);
    if (cv) el.appendChild(cv);
    if (pop) { pop.className = 'as-pop'; el.appendChild(pop); }
    el.setAttribute('aria-hidden', 'true');
    el.classList.add('is-live');

    var R = rng(Date.now() & 0xffff), w = 0, h = 0, sm = false, top = 0, bot = 0, cx = 0, cy = 0, stripH = 0, maxC = 1;
    var nodes = [], edges = [], adj = [], entries = [], atkT = [], hallT = [], cols = [], px = [], py = [];
    var blocks = [], bw = 0, bh = 0, gap = 0, shiftT = -9, flag = null, fb = null;
    var t = 0, last = 0, raf = 0, vis = true, run = false, stat = false, dead = false;
    var pulses = [], incs = [], cards = [], mi = 0, side = 1, events = 0, nextCard = 1, spawnT = 0, nextBlk = 4, nextFlag = 9;

    /* ── scena ─────────────────────────────────────── */
    function node(x, y, k, lab) { nodes.push({ x: x, y: y, k: k, lab: lab, ph: R() * TAU, hot: 0, p: (0.9 + R() * 0.09).toFixed(2) }); adj.push([]); return nodes.length - 1; }
    function link(a, b) { if (adj[a].indexOf(b) < 0) { edges.push([a, b]); adj[a].push(b); adj[b].push(a); } }
    function d2(a, b) { var x = nodes[a].x - nodes[b].x, y = nodes[a].y - nodes[b].y; return x * x + y * y; }
    function buildGraph(r) {
      var rx = w / 2 - (sm ? 24 : 30), ry = (bot - top) / 2 - 8, n1 = sm ? 4 : 5, n2 = sm ? 7 : 10, inner = [], outer = [], i, a, k;
      node(cx, cy, 0);
      for (i = 0; i < n1; i++) { a = i / n1 * TAU - Math.PI / 2 + (r() - .5) * .4; inner.push(node(cx + Math.cos(a) * rx * .38, cy + Math.sin(a) * ry * .4, 1)); }
      for (i = 0; i < n2; i++) { a = (i + .5) / n2 * TAU - Math.PI / 2 + (r() - .5) * .3; k = .8 + r() * .16; outer.push(node(cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k, 2, LAB[i])); }
      inner.forEach(function (n, j) { link(0, n); link(n, inner[(j + 1) % n1]); });
      outer.forEach(function (n, j) {
        var near = inner.slice().sort(function (p, q) { return d2(n, p) - d2(n, q); });
        link(n, near[0]); if (r() < .3) link(n, near[1]);
        if (r() < .45) link(n, outer[(j + 1) % n2]);
      });
      entries = outer; atkT = inner; hallT = inner;
    }
    function buildNet() {
      var L = sm ? [3, 4, 4, 2] : [4, 6, 6, 3], x0 = sm ? 26 : 40, x1 = w - (sm ? 54 : 70), sp = Math.min(54, (bot - top - 44) / (sm ? 4 : 6));
      cols = L.map(function (n, i) {
        for (var c = [], j = 0; j < n; j++) c.push(node(x0 + (x1 - x0) * i / (L.length - 1), cy + 8 + (j - (n - 1) / 2) * sp, i ? i === L.length - 1 ? 3 : 1 : 2));
        return c;
      });
      cols.forEach(function (c, i) { if (cols[i + 1]) c.forEach(function (a) { cols[i + 1].forEach(function (b) { link(a, b); }); }); });
      entries = cols[0]; atkT = cols[1]; hallT = cols[3].concat(cols[3], cols[2]);
    }
    function mkBlock(id, born) { return { id: id, h: hx(R, 4) + '…' + hx(R, 3), born: born }; }

    function layout() {
      var cw = el.clientWidth, ch = el.clientHeight, dpr = Math.min(2, W.devicePixelRatio || 1);
      if (!cw || !ch || (cw === w && ch === h && (!cv || cv.width === Math.round(cw * dpr)))) return false;
      w = cw; h = ch; sm = w < 340; el.classList.toggle('as-sm', sm);
      stripH = sim ? (sm ? 48 : 58) : 0; top = sim ? 34 : sm ? 10 : 14; bot = h - stripH - 8; cx = w / 2; cy = (top + bot) / 2;
      maxC = sm ? 1 : cl(Math.floor(w / 280) * Math.floor((h - stripH - top) / 165), 1, 3);
      clearCards();
      if (!sim) return true;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); g.setTransform(dpr, 0, 0, dpr, 0, 0);
      nodes = []; edges = []; adj = []; pulses = []; incs = [];
      if (ai) buildNet(); else buildGraph(rng(7));
      bw = sm ? 50 : 62; bh = sm ? 24 : 28; gap = sm ? 12 : 16; blocks = [];
      for (var i = Math.ceil(w / (bw + gap)) + 1; i >= 0; i--) blocks.push(mkBlock(48213 - i, -9));
      return true;
    }

    /* ── zdarzenia ─────────────────────────────────── */
    function pick(a) { return a[R() * a.length | 0]; }
    function flagBlock(back) { var b = blocks[blocks.length - 3]; if (b) flag = { id: b.id, t: t - (back || 0) }; nextFlag = 11 + R() * 5; }
    function incident(k) {
      var I = { k: k, n: 0, s: null, t: t, ta: 0 }, pool, src;
      events++;
      if (k === 'block') { flagBlock(); return I; }
      if (k === 'ok') { I.n = ai ? cols[3][1] : 0; I.ta = -1.05; }
      else {
        pool = (k === 'hall' ? hallT : atkT).filter(function (n) { return !incs.some(function (J) { return J.n === n; }); });
        var open = pool.filter(function (n) { var p = nodes[n]; return !live().some(function (c) { return p.x > c.x - 16 && p.x < c.x + c.w + 16 && p.y > c.y - 16 && p.y < c.y + c.h + 16; }); });
        if (open.length) pool = open; else if (!pool.length) return null;
        I.n = pick(pool);
        if (k === 'atk') {
          src = adj[I.n].filter(function (j) { return entries.indexOf(j) > -1; });
          if (src.length) { I.s = pick(src); I.ta = cl(Math.sqrt(d2(I.s, I.n)) / 90, .6, 1.4); }
        }
      }
      incs.push(I);
      return I;
    }
    function hpos(I) { return I.k === 'block' ? fb : [px[I.n], py[I.n]]; }
    function hbase(I) { return I.k === 'block' ? blockPos() : [nodes[I.n].x, nodes[I.n].y]; }
    function mkPulse(a, b, nx) { return { a: a, b: b, p: 0, v: ai ? 120 : 62 + R() * 20, len: Math.sqrt(d2(a, b)) || 1, nx: nx }; }
    function spawnPulse() {
      if (pulses.length >= (sm ? 8 : 14)) return;
      if (ai) { var path = cols.map(pick); pulses.push(mkPulse(path[0], path[1], path.slice(2))); return; }
      var e = pick(edges), f = R() < .5, a = e[f ? 0 : 1], b = e[f ? 1 : 0], nx = [], o = adj[b].filter(function (j) { return j !== a; });
      if (R() < .5 && o.length) nx.push(pick(o));
      pulses.push(mkPulse(a, b, nx));
    }

    /* ── okienka ostrzeżeń (DOM) ───────────────────── */
    function clearCards() { cards = []; if (pop) pop.textContent = ''; }
    function live() { return cards.filter(function (c) { return c.out == null; }); }
    function drop(c) {
      c.out = t; c.el.classList.remove('is-in'); c.el.classList.add('is-out');
      if (stat) { cards.splice(cards.indexOf(c), 1); pop.removeChild(c.el); }
    }
    function place(c, nx, ny) { // najlepsza z 21 pozycji: bez nachodzenia kart, nie zasłania „swojego” węzła, blisko niego
      var pad = sm ? 10 : 14, y1 = Math.max(top, h - stripH - 6 - c.h), xs = [pad, w - c.w - pad, (w - c.w) / 2], bs = 1e9, best,
        narrow = w < 2 * c.w + 3 * pad;
      xs.forEach(function (x, i) {
        for (var j = 0; j < 7; j++) {
          var y = top + (y1 - top) * j / 6, s = R() * 30 + (i === side ? 60 : 0) + (i > 1 ? 30 : 0) + (narrow ? Math.min(y - top, y1 - y) * 2 : 0), dx, dy;
          cards.forEach(function (o) {
            if (o.out != null) return;
            if (x < o.x + o.w + 8 && o.x < x + c.w + 8 && y < o.y + o.h + 8 && o.y < y + c.h + 8) s += 1e4;
            var q = o.hit && hbase(o.hit); // nie zasłaniaj zdarzeń innych kart ani ich linii odniesienia
            if (q && q[0] > x - 12 && q[0] < x + c.w + 12 && q[1] > y - 12 && q[1] < y + c.h + 12) s += 1500;
            if (q && cross(q[0], q[1], o, { x: x, y: y, w: c.w, h: c.h })) s += 400;
            if (nx != null && cross(nx, ny, { x: x, y: y, w: c.w, h: c.h }, o)) s += 400;
          });
          if (nx != null) {
            dx = Math.max(x - nx, 0, nx - x - c.w); dy = Math.max(y - ny, 0, ny - y - c.h);
            s += dx + dy < 18 ? 2e3 : Math.abs(Math.sqrt(dx * dx + dy * dy) - 34) * .8;
          }
          if (s < bs) { bs = s; best = [x, y, i]; }
        }
      });
      if (bs >= 1e4 && live().length) { drop(live()[0]); return place(c, nx, ny); }
      c.x = Math.round(best[0]); c.y = Math.round(best[1]); side = best[2];
    }
    function cross(x0, y0, a, b) { // czy linia od (x0,y0) do krawędzi karty a przechodzi przez prostokąt b
      var x1 = cl(x0, a.x, a.x + a.w), y1 = cl(y0, a.y, a.y + a.h), k, u, v;
      for (k = 1; k < 8; k++) { u = x0 + (x1 - x0) * k / 8; v = y0 + (y1 - y0) * k / 8; if (u > b.x && u < b.x + b.w && v > b.y && v < b.y + b.h) return true; }
      return false;
    }
    function addCard(m, still) {
      var sev = sevOf(m), e = D.createElement('div'), q, now = new Date(), c, I = null, p;
      while (live().length >= maxC) drop(live()[0]);
      e.className = 'as-card as-' + sev + (still ? ' is-in is-cov' : '');
      e.innerHTML = '<div class="as-tag"><b></b><i></i></div><div class="as-t"></div><div class="as-d"></div>' + (m.cover ? '<div class="as-c"></div>' : '');
      q = e.children;
      q[0].children[0].textContent = LBL[sev];
      q[0].children[1].textContent = [now.getHours(), now.getMinutes(), now.getSeconds()].map(p2).join(':');
      q[1].textContent = m.title || ''; q[2].textContent = m.detail || '';
      if (m.cover) q[3].textContent = '→ ' + m.cover;
      pop.appendChild(e);
      c = { el: e, t: t, w: e.offsetWidth, h: e.offsetHeight, sev: sev, cov: 1.3 };
      if (sim) { I = incident(kindOf(m)); if (I) { c.hit = I; c.cov = cl(I.ta + 1.1, .9, 2.2); } }
      p = I && hbase(I);
      place(c, p && p[0], p && p[1]);
      e.style.left = c.x + 'px'; e.style.top = c.y + 'px';
      e.style.setProperty('--dx', [-10, 10, 0][side] + 'px'); e.style.setProperty('--cov', c.cov + 's');
      cards.push(c);
      if (!still) { void e.offsetWidth; e.classList.add('is-in'); }
    }

    /* ── krok symulacji ────────────────────────────── */
    function step(dt) {
      t += dt;
      if (sim) {
        if ((spawnT -= dt) <= 0) { spawnT = ai ? .45 + R() * .35 : .2 + R() * .25; spawnPulse(); }
        var add = [];
        pulses = pulses.filter(function (p) {
          p.p += dt * p.v / p.len;
          if (p.p < 1) return true;
          nodes[p.b].hot = 1;
          if (p.nx.length) add.push(mkPulse(p.b, p.nx[0], p.nx.slice(1)));
          return false;
        }).concat(add);
        nodes.forEach(function (n) { n.hot = Math.max(0, n.hot - dt * 1.3); });
        incs = incs.filter(function (I) { return t - I.t < I.ta + 3.6; });
        if ((nextBlk -= dt) <= 0) {
          nextBlk = sm ? 5 : 4.2; shiftT = t;
          blocks.push(mkBlock(blocks[blocks.length - 1].id + 1, t));
          if (blocks.length > Math.ceil(w / (bw + gap)) + 3) blocks.shift();
        }
        if ((!flag || t - flag.t > 4) && (nextFlag -= dt) <= 0) flagBlock();
      }
      if (!pop || stat) return;
      if ((nextCard -= dt) <= 0) { nextCard = sm ? 4.6 : 3; addCard(msgs[mi++ % msgs.length]); }
      var life = sm ? 4.1 : maxC * 3 - .25;
      cards.slice().forEach(function (c) {
        if (c.out != null) { if (t - c.out > .4) { cards.splice(cards.indexOf(c), 1); if (c.el.parentNode) pop.removeChild(c.el); } return; }
        if (t - c.t > c.cov) c.el.classList.add('is-cov');
        if (t - c.t > life) drop(c);
      });
    }

    /* ── rysowanie ─────────────────────────────────── */
    function ln(a, b, c, d) { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); }
    function circ(x, y, r, fill, stroke) { g.beginPath(); g.arc(x, y, r, 0, TAU); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.stroke(); } }
    function txt(s, x, y, size, col, al) { g.font = '500 ' + size + 'px ' + MONO; g.fillStyle = col; g.textAlign = al || 'left'; g.fillText(s, x, y); }
    function A(v) { g.globalAlpha = v; }

    function draw() {
      var i, n, c = sm ? 36 : 44, x, y, alarm = false, S = stat;
      g.clearRect(0, 0, w, h); A(1); g.lineWidth = 1; g.setLineDash([]);
      if ('letterSpacing' in g) g.letterSpacing = '0.6px';
      // siatka architektoniczna + złote znaczniki narożne
      g.strokeStyle = LINE; A(src ? .4 : .6); g.beginPath();
      for (x = cx % c; x < w; x += c) { g.moveTo((x | 0) + .5, 0); g.lineTo((x | 0) + .5, h - stripH); }
      for (y = c; y < h - stripH; y += c) { g.moveTo(0, (y | 0) + .5); g.lineTo(w, (y | 0) + .5); }
      g.stroke(); A(1);
      g.strokeStyle = GOLD; g.lineWidth = 1.2; g.beginPath();
      [[8, 8, 1, 1], [w - 8, 8, -1, 1], [8, h - 8, 1, -1], [w - 8, h - 8, -1, -1]].forEach(function (k) {
        g.moveTo(k[0], k[1] + 12 * k[3]); g.lineTo(k[0], k[1]); g.lineTo(k[0] + 12 * k[2], k[1]);
      });
      g.stroke(); g.lineWidth = 1;
      for (i = 0; i < nodes.length; i++) {
        n = nodes[i];
        px[i] = n.x + (ai ? 0 : Math.sin(t * .4 + n.ph) * 1.4);
        py[i] = n.y + (ai ? 0 : Math.cos(t * .33 + n.ph) * 1.4);
      }
      if (!ai) { // okrąg konstrukcyjny + kontur tarczy (jak w dotychczasowym SVG)
        var s = (bot - top) * .78 / 330;
        g.setLineDash([3, 6]); circ(cx, cy, Math.min(w * .36, (bot - top) * .4), 0, LINE); g.setLineDash([]);
        A(.28); g.strokeStyle = NAVY2; g.beginPath();
        g.moveTo(cx, cy - 165 * s); g.lineTo(cx + 118 * s, cy - 121 * s); g.lineTo(cx + 118 * s, cy - 13 * s);
        g.bezierCurveTo(cx + 118 * s, cy + 73 * s, cx + 66 * s, cy + 133 * s, cx, cy + 165 * s);
        g.bezierCurveTo(cx - 66 * s, cy + 133 * s, cx - 118 * s, cy + 73 * s, cx - 118 * s, cy - 13 * s);
        g.lineTo(cx - 118 * s, cy - 121 * s); g.closePath(); g.stroke(); A(1);
      } else {
        ['WEJŚCIE', 'WARSTWA 1', 'WARSTWA 2', 'WYJŚCIE'].forEach(function (l, j) {
          var k = cols[j][0]; txt(sm ? ['IN', 'H1', 'H2', 'OUT'][j] : l, px[k], py[k] - 16, 7.5, GREY, 'center');
        });
      }
      // krawędzie
      g.strokeStyle = GREY; g.lineWidth = ai ? .6 : .8; A(ai ? .22 : .5); g.beginPath();
      edges.forEach(function (e) { g.moveTo(px[e[0]], py[e[0]]); g.lineTo(px[e[1]], py[e[1]]); });
      g.stroke(); A(1);
      // impulsy danych
      pulses.forEach(function (p) {
        var ax = px[p.a], ay = py[p.a], dx = px[p.b] - ax, dy = py[p.b] - ay, q = p.p, q0 = Math.max(0, q - (ai ? .35 : .18));
        g.strokeStyle = NAVY2; g.lineWidth = 1.1; A(.45); ln(ax + dx * q0, ay + dy * q0, ax + dx * q, ay + dy * q);
        A(.9); circ(ax + dx * q, ay + dy * q, 1.6, NAVY2); A(1);
      });
      drawChain();
      // linie odniesienia: zdarzenie na grafie → okienko
      cards.forEach(function (k) {
        var p = k.hit && hpos(k.hit), a = (S ? 1 : ease((t - k.t - .35) / .5)) * (k.out != null ? 1 - cl((t - k.out) / .3) : 1);
        if (!p || a <= 0) return;
        var ex = cl(p[0], k.x, k.x + k.w), ey = cl(p[1], k.y, k.y + k.h);
        A(a * .75); g.strokeStyle = COL[k.sev]; g.lineWidth = 1; g.setLineDash([2, 3]); ln(p[0], p[1], ex, ey); g.setLineDash([]);
        g.fillStyle = COL[k.sev]; g.fillRect(ex - 1.5, ey - 1.5, 3, 3); A(1);
      });
      // węzły
      g.lineWidth = 1.1;
      nodes.forEach(function (n, i) {
        var x = px[i], y = py[i];
        if (!ai && n.k === 0) { circ(x, y, 5, GOLD); A(.45); g.lineWidth = 1; circ(x, y, 9.5, 0, GOLD); A(1); g.lineWidth = 1.1; return; }
        circ(x, y, ai ? (sm ? 3 : 3.4) : n.k === 1 ? 3.6 : 3, '#fff', n.k === 2 && !ai ? GREY : NAVY2);
        if (n.hot > 0) { A(n.hot * (ai ? .85 : .55)); circ(x, y, ai ? 2.2 : 1.8, ai ? GOLD : NAVY2); A(1); }
        if (n.lab) txt(n.lab, x, y < cy ? y - 8 : y + 14, 7.5, GREY, 'center');
        if (ai && n.k === 3) txt('p ' + n.p, x + 9, y + 3, 7.5, GREY);
      });
      // incydenty: atak (czerwony) / halucynacja (bursztyn) → złoty pierścień ochrony
      incs.forEach(function (I) {
        if (I.k === 'block') return;
        var u = t - I.t, x = px[I.n], y = py[I.n], v = u - I.ta, f, q;
        if (I.s !== null) {
          var sx = px[I.s], sy = py[I.s];
          q = S ? 1 : ease(u / I.ta); f = S ? .5 : 1 - cl((v - .8) / 1.2);
          g.strokeStyle = RED; g.lineWidth = 1.2; A(.75 * f); ln(sx, sy, sx + (x - sx) * q, sy + (y - sy) * q);
          g.lineWidth = 1; circ(sx, sy, 6, 0, RED);
          if (q < 1) { A(1); circ(sx + (x - sx) * q, sy + (y - sy) * q, 2.3, RED); }
          A(1);
        }
        if (v < 0 && !S) return;
        var al = I.k === 'ok' ? 0 : S ? 1 : 1 - cl((v - 1.3) / .6), gp = S ? 1 : ease((v - 1.05) / .65), ga = S ? 1 : 1 - cl((v - 2.7) / .8);
        if (al > 0) {
          alarm = true;
          if (I.k === 'hall') {
            var on = !S && v < 1.35 && Math.sin(v * 31) > -.3, j = on ? (R() - .5) * 1.6 : 0;
            A(al * (on ? .9 : .5)); circ(x + j, y, 3.4, GOLD);
            g.setLineDash([2, 3]); g.lineWidth = 1; A(al * .8); circ(x - j, y, 8 + j, 0, GOLD); g.setLineDash([]);
            if (ai && nodes[I.n].k === 3) { A(al); g.fillStyle = '#fff'; g.fillRect(x + 7, y - 6, 44, 12); txt('p 0.4' + (I.n * 7 % 10) + ' ?', x + 9, y + 3, 7.5, GOLD); }
          } else {
            f = S ? .35 : (v * 1.1) % 1;
            g.lineWidth = 1; A(al * (1 - f) * .6); circ(x, y, 5 + f * 13, 0, RED);
            A(al); circ(x, y, 3.6, RED);
          }
        }
        if (gp > 0) {
          A(ga); g.strokeStyle = GOLD; g.lineWidth = 1.3;
          g.beginPath(); g.arc(x, y, 11, -Math.PI / 2, -Math.PI / 2 + TAU * gp); g.stroke();
          g.lineWidth = 1; A(ga * gp);
          for (var k = 0; k < 4; k++) { var a = k * Math.PI / 2 + Math.PI / 4; ln(x + Math.cos(a) * 14, y + Math.sin(a) * 14, x + Math.cos(a) * 18, y + Math.sin(a) * 18); }
        }
        A(1);
      });
      // HUD
      g.save(); g.translate(28, 18); g.rotate(Math.PI / 4); g.fillStyle = alarm ? RED : GOLD; g.fillRect(-2.5, -2.5, 5, 5); g.restore();
      txt(ai ? 'SYMULACJA · MODEL AI' : 'SYMULACJA · SIEĆ', 38, 21, 8.5, TXT2);
      txt('ZDARZENIA ' + ('00' + events).slice(-3), w - 26, 21, 8.5, TXT2, 'right');
    }

    function chainOff() { return (1 - ease((t - shiftT) / .9)) * (bw + gap); }
    function blockPos() { return [w - 26 - bw / 2 - 2 * (bw + gap), h - bh - 8]; }
    function drawChain() {
      var y0 = h - stripH, by = h - bh - 8, st = bw + gap, off = chainOff(), n = blocks.length;
      fb = null;
      g.strokeStyle = LINE; g.lineWidth = 1; ln(14, y0 + .5, w - 14, y0 + .5);
      txt('REJESTR · BLOCKCHAIN', 26, y0 + 11, 7.5, GREY);
      if (!sm) txt('BLOK #' + blocks[n - 1].id, w - 26, y0 + 11, 7.5, GREY, 'right');
      blocks.forEach(function (b, i) {
        var x = w - 26 - bw - (n - 1 - i) * st + off, age = t - b.born, a = cl((x - 6) / 46) * ease(age / .6), col = NAVY2, fl = 0, lab = '';
        if (flag && flag.id === b.id) {
          fb = [x + bw / 2, by];
          fl = t - flag.t;
          if (fl < 1.7) { col = RED; lab = 'HASH ≠'; } else if (fl < 4) { col = GOLD; lab = '✓ HASH OK'; }
        }
        if (a <= 0) return;
        A(a * (col === NAVY2 ? .7 : 1)); g.strokeStyle = col; g.lineWidth = col === NAVY2 ? 1 : 1.3;
        if (age < .9) g.setLineDash([3, 3]);
        g.strokeRect((x | 0) + .5, (by | 0) + .5, bw, bh); g.setLineDash([]);
        if (i < n - 1) { g.strokeStyle = GREY; g.lineWidth = 1; ln(x + bw + 1, by + bh / 2, x + st - 1, by + bh / 2); circ(x + bw + gap / 2, by + bh / 2, 1.5, '#fff', GREY); }
        A(a); txt(lab || '#' + b.id, x + 5, by + (sm ? 9 : 10), 6.5, lab ? col : GREY);
        A(a * cl((age - .4) / .5)); txt(b.h, x + 5, by + bh - 6, sm ? 7 : 8, col);
        A(1);
      });
    }

    /* ── tryb statyczny (prefers-reduced-motion) ───── */
    function staticFrame() {
      t = 0; incs = []; pulses = []; events = 0; clearCards();
      var i;
      if (sim) { for (i = 0; i < 90; i++) step(1 / 30); flagBlock(2.4); shiftT = -9; blocks.forEach(function (b) { b.born = -9; }); }
      if (pop) still.slice(0, Math.min(2, maxC)).forEach(function (m) { addCard(m, true); });
      if (sim) draw();
    }

    /* ── cykl życia ────────────────────────────────── */
    function loop(now) {
      if (!run) return;
      var dt = last ? Math.min(.05, (now - last) / 1000) : 0;
      last = now; step(sim ? dt : Math.min(dt, .5)); if (sim) draw();
      raf = sim ? W.requestAnimationFrame(loop) : W.setTimeout(function () { loop(Date.now()); }, 200);
    }
    function halt() { run = false; if (sim) W.cancelAnimationFrame(raf); else W.clearTimeout(raf); }
    function sync() {
      var on = !dead && vis && !D.hidden, rm = !!(mq && mq.matches), go = on && !stat && w > 0 && (sim || pop);
      if (go && !run) { run = true; last = 0; loop(sim ? 0 : Date.now()); }
      else if (!go && run) halt();
      if (src && !lean && !rm && !vid && !dead) { vid = videoLayer(el, src, el.getAttribute('data-poster')); el.classList.add('has-vid'); }
      if (vid) { vid.show(!rm); vid.run(on && !rm); }
    }
    function refresh(force) {
      if (dead) return;
      var changed = layout();
      stat = !!(mq && mq.matches);
      if (stat && (changed || force)) { halt(); staticFrame(); }
      else if (!stat && (changed || force)) { clearCards(); nextCard = .6; }
      sync();
    }
    var io = W.IntersectionObserver && new W.IntersectionObserver(function (es) { vis = es[es.length - 1].isIntersecting; sync(); }, { rootMargin: '80px' });
    var ro = W.ResizeObserver && new W.ResizeObserver(function () { refresh(); });
    function onMq() { refresh(true); }
    if (io) io.observe(el);
    if (ro) ro.observe(el); else W.addEventListener('resize', function () { refresh(); });
    D.addEventListener('visibilitychange', sync);
    if (mq) mq.addEventListener ? mq.addEventListener('change', onMq) : mq.addListener && mq.addListener(onMq);
    if (sim && D.fonts && D.fonts.ready) D.fonts.ready.then(function () { if (stat && w && !dead) draw(); });
    refresh(true);

    return (el._auraSim = {
      el: el,
      isRunning: function () { return run; },
      destroy: function () {
        dead = true; halt(); if (vid) vid.kill();
        if (io) io.disconnect(); if (ro) ro.disconnect();
        D.removeEventListener('visibilitychange', sync);
        if (mq && mq.removeEventListener) mq.removeEventListener('change', onMq);
        [cv, pop].forEach(function (x) { if (x && x.parentNode) el.removeChild(x); });
        el.classList.remove('is-live', 'as-sm', 'has-vid'); el._auraSim = null;
      }
    });
  }

  function initAll(root) { [].forEach.call((root || D).querySelectorAll('.aura-sim'), init); }
  W.AuraSim = { init: init, initAll: initAll, messages: MSG };
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', function () { initAll(); });
  else initAll();
})(window, document);
