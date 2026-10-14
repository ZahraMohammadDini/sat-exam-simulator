import clsx from 'clsx';
import { renderMathToHtml } from '@/lib/katex';

export interface KatexRendererProps {
  text: string | null | undefined;
  className?: string;
  as?: 'div' | 'span' | 'p';
}

export function KatexRenderer({
  text,
  className,
  as: Tag = 'div',
}: KatexRendererProps) {
  const html = renderMathToHtml(text);
  if (!html) return null;

  return (
    <Tag
      className={clsx('leading-relaxed', className)}
      // Content is escaped + KaTeX-rendered server-side by renderMathToHtml;
      // no untrusted HTML reaches this point.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}