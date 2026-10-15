'use client';

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

export interface ZoomableImageProps {
  src: string;
  alt: string;
  className?: string;
  /** Max height in the inline view before scaling */
  inlineMaxHeight?: number;
}

export function ZoomableImage({
  src,
  alt,
  className,
  inlineMaxHeight,
}: ZoomableImageProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        draggable={false}
        onClick={() => setOpen(true)}
        className={clsx(
          'cursor-zoom-in rounded-md border border-border-default',
          className
        )}
        style={inlineMaxHeight ? { maxHeight: inlineMaxHeight } : undefined}
      />
      {open && (
        <ZoomLightbox src={src} alt={alt} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

interface ZoomLightboxProps {
  src: string;
  alt: string;
  onClose: () => void;
}

function ZoomLightbox({ src, alt, onClose }: ZoomLightboxProps) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') setScale((s) => Math.min(4, s + 0.2));
      if (e.key === '-') setScale((s) => Math.max(0.5, s - 0.2));
      if (e.key === '0') {
        setScale(1);
        setOffset({ x: 0, y: 0 });
      }
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    setScale((s) => Math.min(4, Math.max(0.5, s + delta)));
  };

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
  };

  const onMouseUp = () => {
    dragging.current = false;
  };

  const reset = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setScale((s) => Math.max(0.5, s - 0.2));
          }}
          className="rounded-md bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20"
        >
          −
        </button>
        <span className="min-w-[60px] text-center text-sm text-white">
          {Math.round(scale * 100)}%
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setScale((s) => Math.min(4, s + 0.2));
          }}
          className="rounded-md bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20"
        >
          +
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            reset();
          }}
          className="rounded-md bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div
        ref={containerRef}
        className="flex h-full w-full cursor-grab items-center justify-center overflow-hidden active:cursor-grabbing"
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="select-none"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transition: dragging.current ? 'none' : 'transform 0.05s linear',
            maxWidth: '100%',
            maxHeight: '100%',
          }}
        />
      </div>
    </div>
  );
}
