/*! aura-sim.js — dekoracyjna warstwa „symulacja zagrożeń” (OC zawodowe · Cyber · AI). Bez zależności, bez sieci.
 *  Użycie: <div class="aura-sim" data-sim="cyber|ai" data-messages='[{"sev":"WYSOKI","title":"…","detail":"…","cover":"…"}]'></div>
 *  Auto-init na DOMContentLoaded; ręcznie: AuraSim.init(el). Pola wiadomości: sev (KRYTYCZNY|WYSOKI|ŚREDNI|INFO),
 *  title, detail, cover (opcjonalny dopisek „ochrona”), fx (opcjonalnie: atk|hall|block), pin (pokazuj w trybie statycznym). */
(function (W, D) {
  'use strict';
  var NAVY2 = '#1a3a6e', GOLD = '#b8920a', GREY = '#8aa0b8', LINE = '#dde6f0', RED = '#c0392b', TXT2 = '#4a6278';
  var MONO = "'JetBrains Mono', ui-monospace, Menlo, monospace", TAU = Math.PI * 2;
  var SEV = { 'KRYTYCZNY': 'crit', 'WYSOKI': 'high', 'ŚREDNI': 'med', 'INFO': 'info', crit: 'crit', high: 'high', med: 'med', info: 'info' };
  var LBL = { crit: 'KRYTYCZNY', high: 'WYSOKI', med: 'ŚREDNI', info: 'INFO' };
  var LAB = ['API', 'VPN', 'MAIL', 'DB', 'ERP', 'CRM', 'SSO', 'CLOUD', 'BACKUP', 'WWW'];
  // Domyślne komunikaty (copy deck A5.1); strona może podać własne w data-messages.
  var MSG = [
    ['KRYTYCZNY', 'Ransomware szyfruje serwer plików', 'Żądanie okupu i groźba publikacji danych klientów', 'Cyber: wymuszenie, odtworzenie danych'],
    ['WYSOKI', 'Logowanie admina z nowego kraju', 'Nieznane urządzenie, nietypowa pora, brak MFA', 'Cyber: reakcja na incydent'],
    ['WYSOKI', 'Deepfake „CFO” zleca pilny przelew', 'Wideorozmowa: nowy rachunek, przelew jeszcze dziś', 'Cyberprzestępstwa (moduł opcjonalny)'],
    ['ŚREDNI', 'LLMjacking: skok zużycia tokenów', 'Klucz API modelu użyty poza firmą, rachunek rośnie', 'Cyberprzestępstwa (moduł opcjonalny)'],
    ['WYSOKI', 'Halucynacja AI w raporcie dla klienta', 'Model podał nieistniejące dane, klient żąda zwrotu', 'OC zawodowe: błędy i zaniechania'],
    ['ŚREDNI', 'Blockchain: niezgodny hash bloku', 'Integralność rejestru naruszona, węzeł odizolowany', 'Cyber: informatyka śledcza'],
    ['KRYTYCZNY', 'Pozew w sądzie federalnym w USA', 'Klient z Kalifornii żąda odszkodowania za błąd', 'OC zawodowe: obrona prawna'],
    ['WYSOKI', 'Zmiana numeru konta na fakturze', 'Mail „od dostawcy” z nowym rachunkiem do przelewu', 'Cyberprzestępstwa (moduł opcjonalny)'],
    ['ŚREDNI', 'Prompt injection w chatbocie', 'Bot ujawnił dane klienta po złośliwym poleceniu', 'Cyber: naruszenie prywatności']
  ].map(function (a) { return { sev: a[0], title: a[1], detail: a[2], cover: a[3] }; });
  var ORDER = { cyber: [6, 0, 1, 2, 4, 5, 3, 7], ai: [4, 3, 2, 8, 6] };

  function rng(s) { return function () { s = s + 0x6D2B79F5 | 0; var t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function hx(r, n) { var s = ''; while (n--) s += (r() * 16 | 0).toString(16); return s; }
  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ease(v) { v = cl(v); return v * v * (3 - 2 * v); }
  function kindOf(m) {
    if (m.fx) return m.fx;
    var s = m.title + ' ' + m.detail;
    return /blockchain|hash/i.test(s) ? 'block' : /halucyn|model|prompt|LLM|token|chatbot/i.test(s) ? 'hall' : 'atk';
  }

  function init(el) {
    if (!el || el._auraSim) return el && el._auraSim;
    var cv = D.createElement('canvas'), g = cv.getContext && cv.getContext('2d');
    if (!g) return null;
    var ai = el.getAttribute('data-sim') === 'ai', msgs;
    try { msgs = JSON.parse(el.getAttribute('data-messages') || '0'); } catch (e) { msgs = 0; }
    if (!msgs || !msgs.length) msgs = ORDER[ai ? 'ai' : 'cyber'].map(function (i) { return MSG[i]; });
    var pop = D.createElement('div');
    pop.className = 'as-pop';
    el.appendChild(cv); el.appendChild(pop);
    el.setAttribute('aria-hidden', 'true');
    el.classList.add('is-live');

    var mq = W.matchMedia && W.matchMedia('(prefers-reduced-motion: reduce)');
    var R = rng(Date.now() & 0xffff), t0 = Date.now();
    var w = 0, h = 0, sm = false, top = 0, bot = 0, cx = 0, cy = 0, stripH = 0, maxC = 1;
    var nodes = [], edges = [], adj = [], entries = [], atkT = [], hallT = [], cols = [], px = [], py = [];
    var blocks = [], bw = 0, bh = 0, gap = 0, shiftT = -9, flag = null;
    var t = 0, last = 0, raf = 0, vis = true, run = false, stat = false, dead = false;
    var pulses = [], incs = [], cards = [], mi = 0, side = 0, events = 0;
    var nextCard = 1, spawnT = 0, nextBlk = 4, nextFlag = 9;

    /* ── budowa sceny ─────────────────────────────── */
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
        var c = [], j;
        for (j = 0; j < n; j++) c.push(node(x0 + (x1 - x0) * i / (L.length - 1), cy + 8 + (j - (n - 1) / 2) * sp, i === 0 ? 2 : i === L.length - 1 ? 3 : 1));
        return c;
      });
      cols.forEach(function (c, i) { if (cols[i + 1]) c.forEach(function (a) { cols[i + 1].forEach(function (b) { link(a, b); }); }); });
      entries = cols[0]; atkT = cols[1]; hallT = cols[3].concat(cols[3], cols[2]);
    }

    function mkBlock(id, born) { return { id: id, h: hx(R, 4) + '…' + hx(R, 3), born: born }; }

    function layout() {
      var cw = el.clientWidth, ch = el.clientHeight, dpr = Math.min(2, W.devicePixelRatio || 1);
      if (!cw || !ch) return false;
      if (cw === w && ch === h && cv.width === Math.round(cw * dpr)) return false;
      w = cw; h = ch; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      sm = w < 340; el.classList.toggle('as-sm', sm);
      stripH = sm ? 48 : 58; top = 34; bot = h - stripH - 8; cx = w / 2; cy = (top + bot) / 2;
      maxC = sm ? 1 : bot - top < 330 ? 2 : 3;
      nodes = []; edges = []; adj = []; pulses = []; incs = [];
      if (ai) buildNet(); else buildGraph(rng(7));
      bw = sm ? 50 : 62; bh = sm ? 24 : 28; gap = sm ? 12 : 16; blocks = [];
      for (var i = Math.ceil(w / (bw + gap)) + 1; i >= 0; i--) blocks.push(mkBlock(48213 - i, -9));
      clearCards();
      return true;
    }

    /* ── zdarzenia ────────────────────────────────── */
    function pick(a) { return a[R() * a.length | 0]; }
    function busy(n) { return incs.some(function (I) { return I.n === n; }); }
    function flagBlock(back) { var b = blocks[blocks.length - 3]; if (b) flag = { id: b.id, t: t - (back || 0) }; nextFlag = 11 + R() * 5; }
    function incident(k) {
      events++;
      if (k === 'block') return flagBlock();
      var pool = (k === 'hall' ? hallT : atkT).filter(function (n) { return !busy(n); }), n, s = null, ta = 0;
      if (!pool.length) return;
      n = pick(pool);
      if (k !== 'hall') {
        var src = adj[n].filter(function (j) { return entries.indexOf(j) > -1; });
        s = src.length ? pick(src) : null;
        if (s !== null) ta = Math.max(.6, Math.min(1.4, Math.sqrt(d2(s, n)) / 90));
      }
      incs.push({ k: k, n: n, s: s, t: t, ta: ta });
    }
    function mkPulse(a, b, nx) { return { a: a, b: b, p: 0, v: ai ? 120 : 62 + R() * 20, len: Math.sqrt(d2(a, b)) || 1, nx: nx }; }
    function spawnPulse() {
      if (pulses.length >= (sm ? 8 : 14)) return;
      if (ai) {
        var path = cols.map(function (c) { return pick(c); });
        pulses.push(mkPulse(path[0], path[1], path.slice(2)));
      } else {
        var e = pick(edges), f = R() < .5, a = e[f ? 0 : 1], b = e[f ? 1 : 0], nx = [];
        if (R() < .5) { var o = adj[b].filter(function (j) { return j !== a; }); if (o.length) nx.push(pick(o)); }
        pulses.push(mkPulse(a, b, nx));
      }
    }

    /* ── okienka ostrzeżeń (DOM) ──────────────────── */
    function clearCards() { cards = []; pop.textContent = ''; }
    function drop(c) {
      cards.splice(cards.indexOf(c), 1);
      c.el.classList.remove('is-in'); c.el.classList.add('is-out');
      setTimeout(function () { if (c.el.parentNode) c.el.parentNode.removeChild(c.el); }, 420);
    }
    function addCard(m, slot, still) {
      var sev = SEV[m.sev] || SEV[String(m.sev || '').toLowerCase()] || 'med', c = D.createElement('div'), used, free, i;
      while (cards.length >= maxC) drop(cards[0]);
      if (slot == null) {
        used = cards.map(function (x) { return x.slot; }); free = [];
        for (i = 0; i < maxC; i++) if (used.indexOf(i) < 0) free.push(i);
        slot = pick(free);
      }
      c.className = 'as-card as-' + sev + (still ? ' is-in is-cov' : '');
      c.innerHTML = '<div class="as-tag"><b></b><i></i></div><div class="as-t"></div><div class="as-d"></div>' + (m.cover ? '<div class="as-c"></div>' : '');
      var q = c.children, d = new Date(t0 + t * 1000);
      q[0].children[0].textContent = LBL[sev];
      q[0].children[1].textContent = [d.getHours(), d.getMinutes(), d.getSeconds()].map(function (v) { return (v < 10 ? '0' : '') + v; }).join(':');
      q[1].textContent = m.title || ''; q[2].textContent = m.detail || '';
      if (m.cover) q[3].textContent = '→ ' + m.cover;
      side ^= 1;
      c.style.setProperty('--dx', (side ? 10 : -10) + 'px');
      pop.appendChild(c);
      var cw = c.offsetWidth, ch = c.offsetHeight, pad = sm ? 10 : 14, band = (h - stripH - 4 - top) / maxC,
        jx = Math.max(0, (w - cw - 2 * pad) * .3) * (still ? 0 : R()),
        y = top + slot * band + (still ? 0 : R()) * Math.max(0, band - ch - 6);
      c.style.left = Math.round(side ? w - cw - pad - jx : pad + jx) + 'px';
      c.style.top = Math.round(Math.min(y, h - ch - 6)) + 'px';
      cards.push({ el: c, t: t, slot: slot });
      if (!still) { void c.offsetWidth; c.classList.add('is-in'); incident(kindOf(m)); }
    }

    /* ── krok symulacji ───────────────────────────── */
    function step(dt) {
      t += dt;
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
      if (stat) return;
      if ((nextCard -= dt) <= 0) { nextCard = sm ? 4.6 : 3; addCard(msgs[mi++ % msgs.length]); }
      var life = sm ? 4.1 : maxC * 3 - .25;
      cards.slice().forEach(function (c) {
        var a = t - c.t;
        if (a > 1.3) c.el.classList.add('is-cov');
        if (a > life) drop(c);
      });
    }

    /* ── rysowanie ────────────────────────────────── */
    function ln(a, b, c, d) { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); }
    function circ(x, y, r, fill, stroke) { g.beginPath(); g.arc(x, y, r, 0, TAU); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.stroke(); } }
    function txt(s, x, y, size, col, al) { g.font = '500 ' + size + 'px ' + MONO; g.fillStyle = col; g.textAlign = al || 'left'; g.fillText(s, x, y); }

    function draw() {
      var i, n, c = sm ? 36 : 44, x, y, alarm = false;
      g.clearRect(0, 0, w, h);
      g.globalAlpha = 1; g.lineWidth = 1; g.setLineDash([]);
      if ('letterSpacing' in g) g.letterSpacing = '0.6px';
      // siatka architektoniczna + znaczniki narożne
      g.strokeStyle = LINE; g.globalAlpha = .6; g.beginPath();
      for (x = cx % c; x < w; x += c) { g.moveTo((x | 0) + .5, 0); g.lineTo((x | 0) + .5, h - stripH); }
      for (y = c; y < h - stripH; y += c) { g.moveTo(0, (y | 0) + .5); g.lineTo(w, (y | 0) + .5); }
      g.stroke(); g.globalAlpha = 1;
      g.strokeStyle = GOLD; g.lineWidth = 1.2; g.beginPath();
      [[8, 8, 1, 1], [w - 8, 8, -1, 1], [8, h - 8, 1, -1], [w - 8, h - 8, -1, -1]].forEach(function (k) {
        g.moveTo(k[0], k[1] + 12 * k[3]); g.lineTo(k[0], k[1]); g.lineTo(k[0] + 12 * k[2], k[1]);
      });
      g.stroke(); g.lineWidth = 1;
      // pozycje węzłów (delikatny dryf w trybie sieci)
      for (i = 0; i < nodes.length; i++) {
        n = nodes[i];
        px[i] = n.x + (ai ? 0 : Math.sin(t * .4 + n.ph) * 1.4);
        py[i] = n.y + (ai ? 0 : Math.cos(t * .33 + n.ph) * 1.4);
      }
      if (!ai) {
        var s = (bot - top) * .78 / 330;
        g.strokeStyle = LINE; g.setLineDash([3, 6]); circ(cx, cy, Math.min(w * .36, (bot - top) * .4), 0, LINE); g.setLineDash([]);
        g.globalAlpha = .28; g.strokeStyle = NAVY2; g.beginPath();
        g.moveTo(cx, cy - 165 * s); g.lineTo(cx + 118 * s, cy - 121 * s); g.lineTo(cx + 118 * s, cy - 13 * s);
        g.bezierCurveTo(cx + 118 * s, cy + 73 * s, cx + 66 * s, cy + 133 * s, cx, cy + 165 * s);
        g.bezierCurveTo(cx - 66 * s, cy + 133 * s, cx - 118 * s, cy + 73 * s, cx - 118 * s, cy - 13 * s);
        g.lineTo(cx - 118 * s, cy - 121 * s); g.closePath(); g.stroke(); g.globalAlpha = 1;
      } else {
        ['WEJŚCIE', 'WARSTWA 1', 'WARSTWA 2', 'WYJŚCIE'].forEach(function (l, j) {
          var k = cols[j][0]; txt(sm ? (j ? (j < 3 ? 'H' + j : 'OUT') : 'IN') : l, px[k], py[k] - 16, 7.5, GREY, 'center');
        });
      }
      // krawędzie
      g.strokeStyle = GREY; g.lineWidth = ai ? .6 : .8; g.globalAlpha = ai ? .22 : .5; g.beginPath();
      edges.forEach(function (e) { g.moveTo(px[e[0]], py[e[0]]); g.lineTo(px[e[1]], py[e[1]]); });
      g.stroke(); g.globalAlpha = 1;
      // impulsy danych
      pulses.forEach(function (p) {
        var ax = px[p.a], ay = py[p.a], dx = px[p.b] - ax, dy = py[p.b] - ay, q = p.p, q0 = Math.max(0, q - (ai ? .35 : .18));
        g.strokeStyle = NAVY2; g.lineWidth = 1.1; g.globalAlpha = .45; ln(ax + dx * q0, ay + dy * q0, ax + dx * q, ay + dy * q);
        g.globalAlpha = .9; circ(ax + dx * q, ay + dy * q, 1.6, NAVY2); g.globalAlpha = 1;
      });
      // węzły
      g.lineWidth = 1.1;
      nodes.forEach(function (n, i) {
        var x = px[i], y = py[i];
        if (!ai && n.k === 0) { circ(x, y, 5, GOLD); g.globalAlpha = .45; g.lineWidth = 1; circ(x, y, 9.5, 0, GOLD); g.globalAlpha = 1; g.lineWidth = 1.1; return; }
        circ(x, y, ai ? (sm ? 3 : 3.4) : n.k === 1 ? 3.6 : 3, '#fff', n.k === 2 && !ai ? GREY : NAVY2);
        if (n.hot > 0) { g.globalAlpha = n.hot * (ai ? .85 : .55); circ(x, y, ai ? 2.2 : 1.8, ai ? GOLD : NAVY2); g.globalAlpha = 1; }
        if (n.lab) txt(n.lab, x, y < cy ? y - 8 : y + 14, 7.5, GREY, 'center');
        if (ai && n.k === 3) txt('p ' + n.p, x + 9, y + 3, 7.5, GREY);
      });
      // incydenty: atak → alarm → złoty pierścień ochrony
      incs.forEach(function (I) {
        var u = t - I.t, x = px[I.n], y = py[I.n], v = u - I.ta, f;
        if (I.s !== null) {
          var sx = px[I.s], sy = py[I.s], q = ease(u / I.ta);
          f = 1 - cl((v - .8) / 1.2);
          g.strokeStyle = RED; g.lineWidth = 1.2; g.globalAlpha = .75 * f; ln(sx, sy, sx + (x - sx) * q, sy + (y - sy) * q);
          g.lineWidth = 1; circ(sx, sy, 6, 0, RED);
          if (q < 1) { g.globalAlpha = 1; circ(sx + (x - sx) * q, sy + (y - sy) * q, 2.3, RED); }
          g.globalAlpha = 1;
        }
        if (v < 0) return;
        var al = 1 - cl((v - 1.3) / .6), gp = ease((v - 1.05) / .65), ga = 1 - cl((v - 2.7) / .8);
        if (al > 0) alarm = true;
        if (I.k === 'hall') {
          var on = v < 1.35 && Math.sin(v * 31) > -.3, j = on ? (R() - .5) * 1.6 : 0;
          g.globalAlpha = al * (on ? .9 : .35); circ(x + j, y, 3.4, GOLD);
          g.setLineDash([2, 3]); g.lineWidth = 1; g.globalAlpha = al * .8; circ(x - j, y, 8 + j, 0, GOLD); g.setLineDash([]);
          if (ai && nodes[I.n].k === 3) { g.globalAlpha = al; g.fillStyle = '#fff'; g.fillRect(x + 7, y - 6, 44, 12); txt('p 0.4' + (I.t * 7 % 10 | 0) + ' ?', x + 9, y + 3, 7.5, GOLD); }
        } else {
          f = (v * 1.1) % 1;
          g.lineWidth = 1; g.globalAlpha = al * (1 - f) * .6; circ(x, y, 5 + f * 13, 0, RED);
          g.globalAlpha = al; circ(x, y, 3.6, RED);
        }
        if (gp > 0) {
          g.globalAlpha = ga; g.strokeStyle = GOLD; g.lineWidth = 1.3;
          g.beginPath(); g.arc(x, y, 11, -Math.PI / 2, -Math.PI / 2 + TAU * gp); g.stroke();
          g.lineWidth = 1; g.globalAlpha = ga * gp;
          for (var k = 0; k < 4; k++) { var a = k * Math.PI / 2 + Math.PI / 4; ln(x + Math.cos(a) * 14, y + Math.sin(a) * 14, x + Math.cos(a) * 18, y + Math.sin(a) * 18); }
        }
        g.globalAlpha = 1;
      });
      // HUD
      g.save(); g.translate(28, 18); g.rotate(Math.PI / 4); g.fillStyle = alarm ? RED : GOLD; g.fillRect(-2.5, -2.5, 5, 5); g.restore();
      txt(ai ? 'SYMULACJA · MODEL AI' : 'SYMULACJA · SIEĆ', 38, 21, 8.5, TXT2);
      txt('ZDARZENIA ' + ('00' + events).slice(-3), w - 26, 21, 8.5, TXT2, 'right');
      drawChain();
    }

    function drawChain() {
      var y0 = h - stripH, by = h - bh - 8, step = bw + gap, off = (1 - ease((t - shiftT) / .9)) * step, n = blocks.length;
      g.strokeStyle = LINE; g.lineWidth = 1; ln(14, y0 + .5, w - 14, y0 + .5);
      txt('REJESTR · BLOCKCHAIN', 26, y0 + 11, 7.5, GREY);
      if (!sm) txt('BLOK #' + blocks[n - 1].id, w - 26, y0 + 11, 7.5, GREY, 'right');
      blocks.forEach(function (b, i) {
        var x = w - 26 - bw - (n - 1 - i) * step + off, age = t - b.born, a = cl((x - 6) / 46) * ease(age / .6), col = NAVY2, fl = 0, lab = '';
        if (a <= 0) return;
        if (flag && flag.id === b.id) {
          fl = t - flag.t;
          if (fl < 1.7) { col = RED; lab = 'HASH ≠'; } else if (fl < 4) { col = GOLD; lab = '✓ OK'; }
        }
        g.globalAlpha = a * (col === NAVY2 ? .7 : 1); g.strokeStyle = col; g.lineWidth = col === NAVY2 ? 1 : 1.3;
        if (age < .9) g.setLineDash([3, 3]);
        g.strokeRect((x | 0) + .5, (by | 0) + .5, bw, bh); g.setLineDash([]);
        if (i < n - 1) { g.strokeStyle = GREY; g.lineWidth = 1; ln(x + bw + 1, by + bh / 2, x + step - 1, by + bh / 2); circ(x + bw + gap / 2, by + bh / 2, 1.5, '#fff', GREY); }
        g.globalAlpha = a; txt('#' + b.id, x + 5, by + (sm ? 9 : 10), 6.5, GREY);
        g.globalAlpha = a * cl((age - .4) / .5); txt(b.h, x + 5, by + bh - 6, sm ? 7 : 8, col === NAVY2 ? NAVY2 : col);
        if (lab) { g.globalAlpha = a * (1 - cl((fl - 3.4) / .6)); txt(lab, x + bw / 2, by - 4, 7, col, 'center'); }
        g.globalAlpha = 1;
      });
    }

    /* ── tryb statyczny (prefers-reduced-motion) ──── */
    function staticFrame() {
      t = 0; incs = []; pulses = []; events = 0; clearCards();
      var i, k = ai ? 'hall' : 'atk';
      for (i = 0; i < 90; i++) step(1 / 30);
      incident(k); for (i = 0; i < 40; i++) step(1 / 30);
      incident(ai ? 'atk' : k); for (i = 0; i < 30; i++) step(1 / 30);
      flagBlock(2.4); shiftT = -9; blocks.forEach(function (b) { b.born = -9; });
      draw();
      var pin = msgs.filter(function (m) { return m.pin; }), list = (pin.length ? pin : msgs).slice(0, sm ? 1 : 2);
      list.forEach(function (m, j) { addCard(m, j ? maxC - 1 : 0, true); });
    }

    /* ── cykl życia ───────────────────────────────── */
    function loop(now) {
      if (!run) return;
      var dt = last ? Math.min(.05, (now - last) / 1000) : 0;
      last = now; step(dt); draw();
      raf = W.requestAnimationFrame(loop);
    }
    function sync() {
      var go = !dead && vis && !D.hidden && !stat && w > 0;
      if (go && !run) { run = true; last = 0; raf = W.requestAnimationFrame(loop); }
      else if (!go && run) { run = false; W.cancelAnimationFrame(raf); }
    }
    function refresh(force) {
      if (dead) return;
      var changed = layout();
      stat = !!(mq && mq.matches);
      if (stat && (changed || force)) { run = false; W.cancelAnimationFrame(raf); staticFrame(); }
      else if (!stat && force) { clearCards(); nextCard = .6; }
      sync();
    }
    var io = W.IntersectionObserver && new W.IntersectionObserver(function (es) { vis = es[es.length - 1].isIntersecting; sync(); }, { rootMargin: '80px' });
    var ro = W.ResizeObserver && new W.ResizeObserver(function () { refresh(); });
    if (io) io.observe(el);
    if (ro) ro.observe(el); else W.addEventListener('resize', function () { refresh(); });
    D.addEventListener('visibilitychange', sync);
    if (mq) { var onMq = function () { refresh(true); }; mq.addEventListener ? mq.addEventListener('change', onMq) : mq.addListener && mq.addListener(onMq); }
    if (D.fonts && D.fonts.ready) D.fonts.ready.then(function () { if (stat && w) draw(); });
    refresh(true);

    var api = {
      el: el,
      isRunning: function () { return run; },
      destroy: function () {
        dead = true; sync(); if (io) io.disconnect(); if (ro) ro.disconnect();
        D.removeEventListener('visibilitychange', sync);
        if (cv.parentNode) el.removeChild(cv); if (pop.parentNode) el.removeChild(pop);
        el.classList.remove('is-live', 'as-sm'); el._auraSim = null;
      }
    };
    el._auraSim = api;
    return api;
  }

  function initAll(root) { [].forEach.call((root || D).querySelectorAll('.aura-sim'), init); }
  W.AuraSim = { init: init, initAll: initAll, messages: MSG };
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', function () { initAll(); });
  else initAll();
})(window, document);
