// ─────────────────────────────────────────────────────────────────
// Client-side highlight store. Highlights are keyed by questionId
// and persisted to the server via the existing autosave endpoint.
// ─────────────────────────────────────────────────────────────────

export interface Highlight {
  id: string;
  text: string;
  color: 'yellow' | 'blue' | 'pink';
  /** Offset in the container's text content at selection start */
  startOffset: number;
  endOffset: number;
  note?: string;
}

export type HighlightMap = Record<string, Highlight[]>;

const COLORS = {
  yellow: '#fef08a',
  blue: '#bfdbfe',
  pink: '#fbcfe8',
} as const;

export function highlightColor(color: Highlight['color']): string {
  return COLORS[color];
}

export function createHighlightId(): string {
  return `h_${Math.random().toString(36).slice(2, 10)}`;
}

export function getSelectionOffsets(
  container: HTMLElement
): { start: number; end: number; text: string } | null {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || sel.rangeCount === 0) return null;

  const range = sel.getRangeAt(0);
  if (!container.contains(range.commonAncestorContainer)) return null;

  const text = sel.toString().trim();
  if (!text || text.length < 2) return null;

  // Compute offset by walking the text nodes in the container
  const preRange = document.createRange();
  preRange.selectNodeContents(container);
  preRange.setEnd(range.startContainer, range.startOffset);
  const start = preRange.toString().length;

  return { start, end: start + sel.toString().length, text };
}

/** Wrap a text range in a colored <mark> */
export function applyHighlightToContainer(
  container: HTMLElement,
  highlight: Highlight
): boolean {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let offset = 0;
  let startNode: Text | null = null;
  let startOffsetInNode = 0;
  let endNode: Text | null = null;
  let endOffsetInNode = 0;

  let node: Node | null = walker.nextNode();
  while (node) {
    const textNode = node as Text;
    const len = textNode.length;

    if (!startNode && offset + len > highlight.startOffset) {
      startNode = textNode;
      startOffsetInNode = highlight.startOffset - offset;
    }
    if (!endNode && offset + len >= highlight.endOffset) {
      endNode = textNode;
      endOffsetInNode = highlight.endOffset - offset;
      break;
    }
    offset += len;
    node = walker.nextNode();
  }

  if (!startNode || !endNode) return false;

  try {
    const range = document.createRange();
    range.setStart(startNode, startOffsetInNode);
    range.setEnd(endNode, endOffsetInNode);

    const mark = document.createElement('mark');
    mark.dataset.highlightId = highlight.id;
    mark.style.backgroundColor = highlightColor(highlight.color);
    mark.style.padding = '0';
    mark.style.borderRadius = '2px';

    range.surroundContents(mark);
    return true;
  } catch {
    return false;
  }
}
