export interface Toast {
  show(html: string, ms?: number): void;
}

/** A dismissable message at the top of the screen (tap to close). */
export function createToast(root: HTMLElement): Toast {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const hide = () => {
    root.classList.remove('is-open');
    clearTimeout(timer);
  };
  root.addEventListener('click', hide);
  return {
    show(html, ms = 7000) {
      root.innerHTML = html;
      root.classList.add('is-open');
      clearTimeout(timer);
      timer = setTimeout(hide, ms);
    },
  };
}
