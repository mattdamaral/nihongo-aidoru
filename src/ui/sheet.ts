export interface Sheet {
  /** The scrolling area under the title. */
  body: HTMLElement;
  open(): void;
  close(): void;
  readonly isOpen: boolean;
}

/** A modal sheet with a title and a Done button, like Learn mode and the menu. */
export function createSheet(root: HTMLElement, id: string, title: string, onClose?: () => void): Sheet {
  root.innerHTML = `
    <div class="sheet ${id}" role="dialog" aria-modal="true" aria-labelledby="${id}-title">
      <header class="sheet-head">
        <h2 id="${id}-title">${title}</h2>
        <button type="button" class="btn sheet-done">Done</button>
      </header>
      <div class="sheet-body"></div>
    </div>
  `;
  const body = root.querySelector<HTMLElement>('.sheet-body')!;
  let isOpen = false;
  const close = () => {
    if (!isOpen) return;
    isOpen = false;
    root.classList.remove('is-open');
    onClose?.();
  };
  root.querySelector('.sheet-done')!.addEventListener('click', close);
  root.addEventListener('click', (e) => {
    if (e.target === root) close();
  });
  return {
    body,
    open() {
      isOpen = true;
      root.classList.add('is-open');
      body.scrollTop = 0;
      root.querySelector<HTMLElement>('.sheet-done')!.focus();
    },
    close,
    get isOpen() {
      return isOpen;
    },
  };
}
