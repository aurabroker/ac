/**
 * Konfigurator programu — zachowanie (komponent: src/components/ProgramConfigurator.astro).
 * Reguły z src/lib/configurator.ts (evaluate); teksty są w HTML — skrypt tylko pokazuje, ukrywa
 * i porządkuje wiersze. Nic nie wysyła: mailto otwiera pocztę użytkownika. Pamięć: sessionStorage.
 */
import { evaluate, STATUS_LABEL, type Answers, type QId } from '../lib/configurator.ts';
import { copyWithFeedback } from './copy.ts';

const KEY = 'aura-cfg-v1';
const EMAIL = 'cyber@auraconsulting.pl';

const plural = (n: number, one: string, few: string, many: string) => {
  const d = n % 10;
  const t = n % 100;
  return n === 1 ? one : d >= 2 && d <= 4 && (t < 12 || t > 14) ? few : many;
};
const clean = (s: string | null | undefined) => (s ?? '').replace(/\s+/g, ' ').trim();

function load(): Answers {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    const a = raw ? (JSON.parse(raw) as unknown) : null;
    return a && typeof a === 'object' && !Array.isArray(a) ? (a as Answers) : {};
  } catch {
    return {};
  }
}
function save(a: Answers) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(a));
  } catch {
    /* tryb prywatny — bez pamięci */
  }
}

function init(root: HTMLElement) {
  const ui = root.querySelector<HTMLElement>('[data-cfg-ui]');
  const form = root.querySelector<HTMLFormElement>('[data-cfg-form]');
  const bom = root.querySelector<HTMLOListElement>('[data-cfg-bom]');
  if (!ui || !form || !bom) return;
  const notesWrap = root.querySelector<HTMLElement>('[data-cfg-notes]');
  const mail = root.querySelector<HTMLAnchorElement>('[data-cfg-mail]');
  const copyBtn = root.querySelector<HTMLButtonElement>('[data-cfg-copy]');
  const live = root.querySelector<HTMLElement>('[data-cfg-live]');
  const count = root.querySelector<HTMLElement>('[data-cfg-count]');
  const meta = root.querySelector<HTMLElement>('[data-cfg-meta]');
  const fieldsets = Array.from(form.querySelectorAll<HTMLFieldSetElement>('[data-q]'));
  const sheet = root.dataset.sheet ?? 'AC-000';

  ui.hidden = false;
  root.querySelector<HTMLElement>('[data-cfg-static]')?.setAttribute('hidden', '');

  const read = (): Answers => {
    const a: Answers = {};
    for (const fs of fieldsets) {
      const c = fs.querySelector<HTMLInputElement>('input:checked');
      if (c) a[fs.dataset.q as QId] = c.value;
    }
    return a;
  };
  const write = (a: Answers) => {
    for (const fs of fieldsets) {
      for (const i of fs.querySelectorAll<HTMLInputElement>('input')) i.checked = a[fs.dataset.q as QId] === i.value;
    }
  };
  // preset strony (np. ai=tak na /ubezpieczenie-ai/) + odpowiedzi z tej sesji; puste {} po „Wyczyść” nie kasuje presetu
  const preset = Object.fromEntries(new URLSearchParams(root.dataset.preset ?? '')) as Answers;
  write({ ...preset, ...load() });

  const summary = () => {
    const lines = [
      'Dzień dobry,',
      '',
      'proszę o analizę ryzyka. Poniżej konfiguracja z konfiguratora na auraconsulting.pl (wynik orientacyjny).',
      '',
      'PROFIL FIRMY',
    ];
    for (const fs of fieldsets) {
      const c = fs.querySelector<HTMLInputElement>('input:checked');
      lines.push(`- ${fs.dataset.qLabel}: ${c ? clean(c.nextElementSibling?.textContent) : '—'}`);
    }
    lines.push('', 'ELEMENTY PROGRAMU');
    for (const row of bom.querySelectorAll<HTMLElement>('[data-mod]:not([hidden])')) {
      const name = row.querySelector('[data-var]:not([hidden]) [data-name]');
      lines.push(`${clean(row.querySelector('[data-pos]')?.textContent)}. ${clean(name?.textContent)} — ${clean(row.querySelector('[data-status]')?.textContent)}`);
    }
    const notes = Array.from(root.querySelectorAll<HTMLElement>('[data-note]:not([hidden])'));
    if (notes.length) {
      lines.push('', 'DO SPRAWDZENIA');
      for (const n of notes) lines.push(`- ${n.dataset.title}`);
    }
    lines.push('', 'Firma (nazwa, NIP):', 'Przychód roczny (rząd wielkości):', 'Telefon kontaktowy:', '', 'Pozdrawiam');
    return lines.join('\n');
  };

  let first = true;
  let timer = 0;
  const render = () => {
    const a = read();
    const { modules, notes } = evaluate(a);
    const shown = new Set<string>();
    modules.forEach((p, i) => {
      const row = bom.querySelector<HTMLElement>(`[data-mod="${p.id}"]`);
      if (!row) return;
      shown.add(p.id);
      const sig = `${p.status}:${p.variant}`;
      const changed = row.hidden || row.dataset.sig !== sig;
      row.hidden = false;
      row.dataset.sig = sig;
      row.dataset.status = p.status;
      bom.appendChild(row);
      const pos = row.querySelector('[data-pos]');
      if (pos) pos.textContent = String(i + 1).padStart(2, '0');
      const st = row.querySelector('[data-status]');
      if (st) st.textContent = STATUS_LABEL[p.status];
      row.querySelectorAll<HTMLElement>('[data-var]').forEach((v) => (v.hidden = v.dataset.var !== p.variant));
      if (changed && !first) {
        row.classList.remove('is-new');
        void row.offsetWidth;
        row.classList.add('is-new');
      }
    });
    bom.querySelectorAll<HTMLElement>('[data-mod]').forEach((r) => {
      if (!shown.has(r.dataset.mod ?? '')) r.hidden = true;
    });
    root.querySelectorAll<HTMLElement>('[data-note]').forEach((n) => (n.hidden = !notes.includes(n.dataset.note ?? '')));
    if (notesWrap) notesWrap.hidden = notes.length === 0;

    const answered = Object.keys(a).length;
    if (count) count.textContent = `${answered} z ${fieldsets.length} odpowiedzi`;
    const msg = `${modules.length} ${plural(modules.length, 'element', 'elementy', 'elementów')} · ${notes.length} ${plural(notes.length, 'uwaga', 'uwagi', 'uwag')}`;
    if (meta) meta.textContent = msg;
    if (mail) {
      const subject = `[${sheet}] Konfiguracja programu — prośba o analizę`;
      // RFC 6068: łamanie wierszy w treści mailto jako CRLF
      mail.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(summary().replace(/\n/g, '\r\n'))}`;
    }
    if (!first) {
      save(a);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => live && (live.textContent = `Zestawienie zaktualizowane: ${msg}.`), 400);
    }
    first = false;
  };

  // formularz niczego nie wysyła (Enter w polu nie może przenieść odpowiedzi do adresu URL)
  form.addEventListener('submit', (e) => e.preventDefault());
  form.addEventListener('change', render);
  form.addEventListener('reset', () => window.setTimeout(render));
  if (copyBtn && navigator.clipboard) {
    copyBtn.hidden = false;
    copyBtn.addEventListener('click', () => copyWithFeedback(copyBtn, summary(), live));
  }
  render();
}

document.querySelectorAll<HTMLElement>('[data-cfg]').forEach(init);
