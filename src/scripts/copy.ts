/**
 * Wspólne kopiowanie do schowka z informacją zwrotną na samym przycisku („Skopiowano”, ~2 s)
 * oraz w opcjonalnym regionie role="status" (czytniki ekranu).
 * Przycisk: <button><svg/><span data-label>Kopiuj …</span></button>.
 */
export async function copyWithFeedback(button: HTMLButtonElement, text: string, status?: HTMLElement | null) {
  const label = button.querySelector<HTMLElement>('[data-label]');
  const original = label?.dataset.original ?? label?.textContent ?? '';
  if (label) label.dataset.original = original;
  let ok = true;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    ok = false;
  }
  const msg = ok ? 'Skopiowano' : 'Nie udało się — zaznacz tekst ręcznie';
  if (label) label.textContent = msg;
  button.classList.toggle('is-copied', ok);
  if (status) status.textContent = ok ? 'Skopiowano do schowka.' : msg + '.';
  window.clearTimeout(Number(button.dataset.timer));
  button.dataset.timer = String(
    window.setTimeout(() => {
      if (label) label.textContent = original;
      button.classList.remove('is-copied');
      if (status) status.textContent = '';
    }, 2200),
  );
}
