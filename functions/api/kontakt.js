// Cloudflare Pages Function: POST /api/kontakt — formularz kontaktowy → e-mail przez Resend.
// Sekrety i ustawienia (Cloudflare Pages → aura-web → Settings → Variables): RESEND_API_KEY (secret),
// CONTACT_TO, CONTACT_FROM, CONTACT_ENV ("preview" dodaje [PODGLĄD] do tematu).
// Temat wiadomości zawiera tytuł podstrony, z której wysłano formularz: „[<tytuł strony>] Zapytanie od <imię>”.
// Ochrona przed spamem: pole-pułapka, minimalny czas wypełnienia, sprawdzenie Origin, limit 1 wysyłki / 20 s / IP.

const ALLOWED_HOSTS = [/^(www\.)?auraconsulting\.pl$/, /(^|\.)aura-web-2s1\.pages\.dev$/, /^localhost(:\d+)?$/, /^127\.0\.0\.1(:\d+)?$/];
const EMAIL_RE = /^[^\s@<>()[\],;:"]+@[^\s@<>()[\],;:"]+\.[a-z]{2,}$/i;
const RATE_SECONDS = 20;

const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim().slice(0, max);
const oneLine = (v, max) => clean(v, max).replace(/[\r\n]+/g, ' ');
const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function hostAllowed(value) {
  if (!value) return false;
  try {
    const host = new URL(value).host;
    return ALLOWED_HOSTS.some((re) => re.test(host));
  } catch {
    return false;
  }
}

async function readBody(request) {
  const type = request.headers.get('content-type') || '';
  if (type.includes('application/json')) return { data: await request.json(), wantsJson: true };
  const form = await request.formData();
  return { data: Object.fromEntries(form.entries()), wantsJson: false };
}

function reply(wantsJson, status, payload, backTo) {
  if (wantsJson) {
    return new Response(JSON.stringify(payload), {
      status,
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' },
    });
  }
  // bez JS: wracamy na stronę z wynikiem w adresie
  const url = new URL(backTo || '/kontakt/', 'https://www.auraconsulting.pl');
  url.searchParams.set('formularz', payload.ok ? 'wyslano' : 'blad');
  url.hash = 'formularz';
  return new Response(null, { status: 303, headers: { location: url.pathname + url.search + url.hash, 'cache-control': 'no-store' } });
}

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  if (!hostAllowed(origin) && !hostAllowed(referer)) {
    return new Response('Forbidden', { status: 403 });
  }

  let parsed;
  try {
    parsed = await readBody(request);
  } catch {
    return new Response('Bad Request', { status: 400 });
  }
  const { data, wantsJson } = parsed;
  const pagePath = (() => {
    try {
      return new URL(clean(data.pageUrl, 300) || referer || '/kontakt/').pathname;
    } catch {
      return '/kontakt/';
    }
  })();

  // pułapka na boty i minimalny czas wypełnienia formularza (3 s)
  const started = Number(data.t || 0);
  if (clean(data.website, 200) !== '' || (started && Date.now() - started < 3000)) {
    return reply(wantsJson, 200, { ok: true }, pagePath); // udajemy sukces, nic nie wysyłamy
  }

  const name = oneLine(data.name, 120);
  const email = oneLine(data.email, 200);
  const phone = oneLine(data.phone, 40);
  const company = oneLine(data.company, 160);
  const message = clean(data.message, 5000);
  const config = clean(data.config, 3000);
  const pageTitle = oneLine(data.pageTitle, 120) || 'Kontakt';
  const pageUrl = oneLine(data.pageUrl, 300);
  const consent = ['on', 'true', '1', 'yes', true].includes(data.consent);

  const errors = {};
  if (name.length < 2) errors.name = 'Podaj imię i nazwisko.';
  if (!EMAIL_RE.test(email)) errors.email = 'Podaj poprawny adres e-mail.';
  if (message.length < 10) errors.message = 'Opisz krótko, w czym możemy pomóc (min. 10 znaków).';
  if (!consent) errors.consent = 'Potrzebujemy zgody na kontakt w sprawie zapytania.';
  if (Object.keys(errors).length) return reply(wantsJson, 422, { ok: false, errors }, pagePath);

  // prosty limit: 1 wysyłka na 20 s z jednego adresu IP (cache brzegowy Cloudflare)
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const rateKey = new Request(`https://rate-limit.invalid/kontakt/${encodeURIComponent(ip)}`);
  const cache = caches.default;
  if (await cache.match(rateKey)) {
    return reply(wantsJson, 429, { ok: false, errors: { form: 'Wiadomość została już wysłana. Spróbuj ponownie za chwilę.' } }, pagePath);
  }

  if (!env.RESEND_API_KEY) {
    return reply(wantsJson, 503, { ok: false, errors: { form: 'Formularz jest chwilowo niedostępny. Zadzwoń: +48 500 502 702 (pn–pt, 9:00–17:00).' } }, pagePath);
  }

  const prefix = env.CONTACT_ENV === 'preview' ? '[PODGLĄD] ' : '';
  const subject = `${prefix}[${pageTitle}] Zapytanie od ${name}`.slice(0, 200);
  const rows = [
    ['Strona', `${pageTitle}${pageUrl ? ` — ${pageUrl}` : ''}`],
    ['Imię i nazwisko', name],
    ['E-mail', email],
    ['Telefon', phone || '—'],
    ['Firma', company || '—'],
  ];
  const text = [
    ...rows.map(([k, v]) => `${k}: ${v}`),
    '',
    'Wiadomość:',
    message,
    ...(config ? ['', 'Konfiguracja programu (z konfiguratora na stronie):', config] : []),
    '',
    `Zgoda na kontakt w sprawie zapytania: tak · ${new Date().toISOString()}`,
  ].join('\n');
  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#1a1a1a">
<table cellpadding="4" style="border-collapse:collapse">${rows
    .map(([k, v]) => `<tr><td style="color:#666;padding-right:12px">${esc(k)}</td><td>${esc(v)}</td></tr>`)
    .join('')}</table>
<p style="margin-top:16px"><strong>Wiadomość</strong></p><p style="white-space:pre-wrap">${esc(message)}</p>${
    config ? `<p style="margin-top:16px"><strong>Konfiguracja programu</strong></p><p style="white-space:pre-wrap">${esc(config)}</p>` : ''
  }<p style="color:#888;font-size:12px;margin-top:16px">Zgoda na kontakt w sprawie zapytania: tak · ${new Date().toISOString()}</p></div>`;

  let res;
  try {
    res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from: env.CONTACT_FROM || 'Aura Consulting — formularz <formularz@auraconsulting.pl>',
        to: [env.CONTACT_TO || 'cyber@auraconsulting.pl'],
        reply_to: email,
        subject,
        text,
        html,
        tags: [{ name: 'zrodlo', value: 'formularz' }],
      }),
    });
  } catch {
    res = null;
  }
  if (!res || !res.ok) {
    return reply(wantsJson, 502, { ok: false, errors: { form: 'Nie udało się wysłać wiadomości. Spróbuj ponownie za chwilę albo zadzwoń: +48 500 502 702.' } }, pagePath);
  }

  await cache.put(rateKey, new Response('1', { headers: { 'cache-control': `max-age=${RATE_SECONDS}` } }));
  return reply(wantsJson, 200, { ok: true }, pagePath);
}

export function onRequest() {
  return new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST' } });
}
