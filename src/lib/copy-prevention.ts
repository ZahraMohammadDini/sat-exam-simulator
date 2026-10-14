// ─────────────────────────────────────────────────────────────────
// Best-effort copy prevention — client-side only.
//
// This is *not* bulletproof. Screenshots and devtools bypass it.
// It deters casual copying during an exam.
// ─────────────────────────────────────────────────────────────────

let installed = false;

function onCopy(e: ClipboardEvent) {
  e.preventDefault();
}

function onCut(e: ClipboardEvent) {
  e.preventDefault();
}

function onContextMenu(e: MouseEvent) {
  // Allow context menu inside input/textarea (admins may need paste)
  const target = e.target as HTMLElement | null;
  if (target) {
    const tag = target.tagName;
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

export function installCopyPrevention(): () => void {
  if (typeof window === 'undefined') return () => {};
  if (installed) return () => {};

  document.addEventListener('copy', onCopy);
  document.addEventListener('cut', onCut);
  document.addEventListener('contextmenu', onContextMenu);
  document.addEventListener('dragstart', onDragStart);

  installed = true;

  return () => {
    document.removeEventListener('copy', onCopy);
    document.removeEventListener('cut', onCut);
    document.removeEventListener('contextmenu', onContextMenu);
    document.removeEventListener('dragstart', onDragStart);
    installed = false;
  };
}

// ── Custom highlight storage (avoid clipboard) ───────────────────
// Instead of relying on native selection, the exam stores highlight
// ranges in React state and renders <mark> spans. Nothing touches
// the system clipboard.

export interface HighlightRange {
  id: string;
  startOffset: number;
  endOffset: number;
  text: string;
}

export function createHighlightId(): string {
  return `h_${Math.random().toString(36).slice(2, 10)}`;
}