import katex from 'katex';

// ─────────────────────────────────────────────────────────────────
// Render a mixed text + LaTeX string to safe HTML.
// Supports delimiters:
//   $$...$$  → block math
//   \[...\]  → block math
//   \(...\)  → inline math
//   $...$    → inline math
// ─────────────────────────────────────────────────────────────────

const MATH_PATTERN = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$[^\n$]+?\$)/g;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderSegment(segment: string): string {
  // Block math: $$...$$ or \[...\]
  if (segment.startsWith('$$') && segment.endsWith('$$')) {
    const inner = segment.slice(2, -2);
    return katex.renderToString(inner, {
      throwOnError: false,
      displayMode: true,
      output: 'html',
    });
  }
  if (segment.startsWith('\\[') && segment.endsWith('\\]')) {
    const inner = segment.slice(2, -2);
    return katex.renderToString(inner, {
      throwOnError: false,
      displayMode: true,
      output: 'html',
    });
  }
  // Inline math: \(...\)
  if (segment.startsWith('\\(') && segment.endsWith('\\)')) {
    const inner = segment.slice(2, -2);
    return katex.renderToString(inner, {
      throwOnError: false,
      displayMode: false,
      output: 'html',
    });
  }
  // Inline math: $...$
  if (segment.startsWith('$') && segment.endsWith('$')) {
    const inner = segment.slice(1, -1);
    return katex.renderToString(inner, {
      throwOnError: false,
      displayMode: false,
      output: 'html',
    });
  }
  return escapeHtml(segment);
}

export function renderMathToHtml(text: string | null | undefined): string {
  if (!text) return '';

  // Split text into math and non-math segments
  const parts = text.split(MATH_PATTERN);

  return parts
    .map((part) => {
      if (!part) return '';
      if (MATH_PATTERN.test(part)) {
        // Reset lastIndex since we reuse the regex
        MATH_PATTERN.lastIndex = 0;
        return renderSegment(part);
      }
      MATH_PATTERN.lastIndex = 0;
      // Non-math: escape and convert newlines
      return escapeHtml(part).replace(/\n/g, '<br />');
    })
    .join('');
}

// ── Server-safe check: does this string contain math? ────────────

export function hasMath(text: string | null | undefined): boolean {
  if (!text) return false;
  MATH_PATTERN.lastIndex = 0;
  return MATH_PATTERN.test(text);
}