// ─────────────────────────────────────────────────────────────────
// Best-effort copy prevention — client-side only.
//
// Design intent:
//   • Students CAN select text visually (needed for the highlighter)
//   • Students CANNOT copy / cut / drag text out
//   • Right-click is disabled on non-input elements
//
// This is *not* bulletproof. Screenshots, devtools, and browser menus
// bypass it. It exists to deter casual copying, not to prevent
// determined extraction.
// ─────────────────────────────────────────────────────────────────

let installed = false;

function onCopy(e: ClipboardEvent) {
  e.preventDefault();
}

function onCut(e: ClipboardEvent) {
  e.preventDefault();
}

function onContextMenu(e: MouseEvent) {
  const target = e.target as HTMLElement | null;
  if (target) {
    const tag = target.tagName;
    // Allow context menu inside input/textarea so paste still works
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (target.isContentEditable) return;
  }
  e.preventDefault();
}

function onDragStart(e: DragEvent) {
  const target = e.target as HTMLElement | null;
  if (target && target.tagName === 'IMG') {
    e.preventDefault();
  }
}

/**
 * Block dropping text into the page from outside.
 * (Prevents a student from pasting in answers from an external doc.)
 */
function onDrop(e: DragEvent) {
  const target = e.target as HTMLElement | null;
  if (!target) return;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) return;
  e.preventDefault();
}

export function installCopyPrevention(): () => void {
  if (typeof window === 'undefined') return () => {};
  if (installed) return () => {};

  document.addEventListener('copy', onCopy);
  document.addEventListener('cut', onCut);
  document.addEventListener('contextmenu', onContextMenu);
  document.addEventListener('dragstart', onDragStart);
  document.addEventListener('drop', onDrop);

  installed = true;

  return () => {
    document.removeEventListener('copy', onCopy);
    document.removeEventListener('cut', onCut);
    document.removeEventListener('contextmenu', onContextMenu);
    document.removeEventListener('dragstart', onDragStart);
    document.removeEventListener('drop', onDrop);
    installed = false;
  };
}

// ── Custom highlight storage (avoid clipboard) ───────────────────

export interface HighlightRange {
  id: string;
  startOffset: number;
  endOffset: number;
  text: string;
}

export function createHighlightId(): string {
  return `h_${Math.random().toString(36).slice(2, 10)}`;
}
