// Cloudflare Pages Function: POST /api/resend-webhook — alert, gdy wiadomość z formularza nie dotarła.
//
// Resend (webhook na zdarzenia email.bounced, email.suppressed, email.failed) wywołuje ten adres.
// Gdy zdarzenie dotyczy wiadomości z formularza (tag zrodlo=formularz albo adresat = CONTACT_TO),
// wysyłamy alert na ALERT_TO — inny adres niż CONTACT_TO, bo ten właśnie nie odbiera poczty.
// Alert zawiera powód (np. treść odbicia), link do wiadomości w Resend i — jeśli klucz API pozwala ją
// odczytać — pełną treść zgłoszenia z adresem klienta, żeby zapytanie nie przepadło.
// Powód: 6.11.2026 jedno odbicie wpisało CONTACT_TO na listę blokad Resend; przez 3 dni zgłoszenia
// były „wysłane” dla klienta, ale nie trafiały do skrzynki.
//
// Ustawienia (Cloudflare Pages → aura-web → Settings → Variables):
//   RESEND_WEBHOOK_SECRET (secret) — „Signing secret” webhooka z panelu Resend (whsec_…),
//   ALERT_TO — adres(y) alertów, po przecinku (nie podajemy domyślnego: repo jest publiczne),
//   RESEND_API_KEY, CONTACT_TO, CONTACT_FROM — jak w /api/kontakt.
// Zdarzenia innych serwisów na tym samym koncie Resend są ignorowane (odpowiedź 200).

const EVENTS = new Set(['email.bounced', 'email.suppressed', 'email.failed']);
const LABELS = {
  'email.bounced': 'odbita przez serwer odbiorcy',
  'email.suppressed': 'zablokowana przez Resend (adres na liście blokad)',
  'email.failed': 'nie została wysłana (błąd Resend)',
};
const TOLERANCE_S = 5 * 60;
const DEFAULT_TO = 'cyber@auraconsulting.pl';

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

function b64decode(s) {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function b64encode(buf) {
  let s = '';
  for (const b of new Uint8Array(buf)) s += String.fromCharCode(b);
  return btoa(s);
}
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

/** Podpis Resend (standard Svix): HMAC-SHA256 z `${id}.${timestamp}.${body}`, nagłówek „v1,<base64> …”. */
async function verifySignature(secret, headers, body, nowS = Math.floor(Date.now() / 1000)) {
  const id = headers.get('svix-id');
  const ts = headers.get('svix-timestamp');
  const sig = headers.get('svix-signature');
  if (!id || !ts || !sig || !/^\d+$/.test(ts)) return false;
  if (Math.abs(nowS - Number(ts)) > TOLERANCE_S) return false;
  let keyBytes;
  try {
    keyBytes = b64decode(secret.replace(/^whsec_/, ''));
  } catch {
    return false;
  }
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = b64encode(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${id}.${ts}.${body}`)));
  return sig.split(' ').some((part) => {
    const [ver, val] = part.split(',');
    return ver === 'v1' && typeof val === 'string' && safeEqual(val, mac);
  });
}

/** Tagi w zdarzeniu: obiekt {nazwa: wartość} albo tablica [{name, value}]. */
function tagValue(tags, name) {
  if (!tags) return undefined;
  if (Array.isArray(tags)) return tags.find((t) => t && t.name === name)?.value;
  if (typeof tags === 'object') return tags[name];
  return undefined;
}

function isFormEvent(data, contactTo) {
  const src = tagValue(data?.tags, 'zrodlo');
  if (src === 'alert') return false; // alert o alercie — bez pętli
  if (src === 'formularz') return true;
  const to = (Array.isArray(data?.to) ? data.to : [data?.to]).filter(Boolean).map((a) => String(a).toLowerCase());
  return to.some((a) => a.includes(contactTo.toLowerCase()));
}

function reason(type, data) {
  const parts = [];
  const b = data?.bounce;
  if (b) parts.push([b.type, b.subType].filter(Boolean).join(' / '), b.message);
  if (data?.failed?.reason) parts.push(data.failed.reason);
  if (data?.suppressed) parts.push(data.suppressed.message || data.suppressed.type);
  if (type === 'email.suppressed' && !parts.filter(Boolean).length) {
    parts.push('Adres jest na liście blokad Resend (zwykle po wcześniejszym odbiciu albo zgłoszeniu spamu).');
  }
  return parts.filter(Boolean).join(' — ') || '(Resend nie podał szczegółów)';
}

async function fetchOriginal(env, id) {
  if (!id || !env.RESEND_API_KEY) return null;
  try {
    const res = await fetch(`https://api.resend.com/emails/${encodeURIComponent(id)}`, {
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}` },
    });
    if (!res.ok) return null; // np. klucz tylko do wysyłki
    return await res.json();
  } catch {
    return null;
  }
}

export async function onRequestPost({ request, env }) {
  if (!env.RESEND_WEBHOOK_SECRET || !env.ALERT_TO || !env.RESEND_API_KEY) {
    return json(503, { ok: false, error: 'not configured' });
  }
  const body = await request.text();
  if (!(await verifySignature(env.RESEND_WEBHOOK_SECRET, request.headers, body))) {
    return json(401, { ok: false, error: 'bad signature' });
  }
  let event;
  try {
    event = JSON.parse(body);
  } catch {
    return json(400, { ok: false, error: 'bad json' });
  }
  const type = event?.type;
  const data = event?.data ?? {};
  const contactTo = env.CONTACT_TO || DEFAULT_TO;
  if (!EVENTS.has(type) || !isFormEvent(data, contactTo)) return json(200, { ok: true, ignored: true });

  // Resend ponawia dostarczenie webhooka — jeden alert na zdarzenie
  const cache = typeof caches !== 'undefined' ? caches.default : null;
  const dedupKey = new Request(`https://dedup.invalid/resend-webhook/${encodeURIComponent(request.headers.get('svix-id') || '')}`);
  if (cache && (await cache.match(dedupKey))) return json(200, { ok: true, duplicate: true });

  const emailId = data.email_id || data.id || '';
  const original = await fetchOriginal(env, emailId);
  const to = (Array.isArray(data.to) ? data.to : [data.to]).filter(Boolean).join(', ') || contactTo;
  const subject = data.subject || original?.subject || '(bez tematu)';
  const replyTo = [].concat(original?.reply_to ?? []).filter(Boolean).join(', ');
  const link = emailId ? `https://resend.com/emails/${emailId}` : 'https://resend.com/emails';
  const why = reason(type, data);

  const text = [
    `Wiadomość z formularza na www.auraconsulting.pl ${LABELS[type]}.`,
    '',
    `Adresat: ${to}`,
    `Temat: ${subject}`,
    `Kiedy: ${event.created_at || data.created_at || new Date().toISOString()}`,
    `Powód: ${why}`,
    `W Resend: ${link}`,
    '',
    'Co zrobić:',
    `1. Sprawdź, czy skrzynka ${to} działa i przyjmuje pocztę (także od nadawcy z własnej domeny).`,
    '2. Jeśli adres jest na liście blokad: Resend → Suppressions → usuń adres (dopiero po naprawie skrzynki).',
    '3. Odpowiedz klientowi — dane poniżej albo w Resend pod linkiem wyżej.',
    ...(original?.text
      ? ['', '──────── Treść zgłoszenia ────────', ...(replyTo ? [`Odpowiedz na: ${replyTo}`, ''] : []), original.text]
      : ['', '(Treść zgłoszenia jest w Resend pod linkiem wyżej.)']),
  ].join('\n');

  let res;
  try {
    res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from: env.CONTACT_FROM || 'Aura Consulting — formularz <formularz@auraconsulting.pl>',
        to: env.ALERT_TO.split(',').map((a) => a.trim()).filter(Boolean),
        ...(replyTo ? { reply_to: replyTo } : {}),
        subject: `[ALERT FORMULARZ] Nie dotarło: ${subject}`.slice(0, 200),
        text,
        tags: [{ name: 'zrodlo', value: 'alert' }],
      }),
    });
  } catch {
    res = null;
  }
  if (!res || !res.ok) return json(502, { ok: false, error: 'alert not sent' }); // Resend ponowi webhook

  if (cache) await cache.put(dedupKey, new Response('1', { headers: { 'cache-control': 'max-age=86400' } }));
  return json(200, { ok: true, alerted: true });
}

export function onRequest() {
  return new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST' } });
}
