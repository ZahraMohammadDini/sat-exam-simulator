'use client';

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

export interface DesmosCalculatorProps {
  open: boolean;
  onClose: () => void;
}

interface DesmosGlobal {
  GraphingCalculator: (
    el: HTMLElement,
    opts?: Record<string, unknown>
  ) => { destroy: () => void };
}

declare global {
  interface Window { Desmos?: DesmosGlobal; }
}

const DESMOS_SRC =
  'https://www.desmos.com/api/v1.9/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fae6';
const DESMOS_IFRAME = 'https://www.desmos.com/calculator';

let scriptPromise: Promise<void> | null = null;
function loadDesmos(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.Desmos) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = DESMOS_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Desmos failed to load'));
    document.head.appendChild(s);
    setTimeout(() => { if (!window.Desmos) reject(new Error('Timeout')); }, 8000);
  });
  return scriptPromise;
}

export function DesmosCalculator({ open, onClose }: DesmosCalculatorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const calcRef = useRef<{ destroy: () => void } | null>(null);
  const [mode, setMode] = useState<'loading' | 'api' | 'iframe'>('loading');

  // Drag state
  const panelRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    loadDesmos()
      .then(() => {
        if (cancelled) return;
        if (!containerRef.current || !window.Desmos) { setMode('iframe'); return; }
        if (!calcRef.current) {
          calcRef.current = window.Desmos.GraphingCalculator(containerRef.current, {
            expressions: true, settingsMenu: false, zoomButtons: true,
          });
        }
        setMode('api');
      })
      .catch(() => { if (!cancelled) setMode('iframe'); });
    return () => { cancelled = true; };
  }, [open]);

  useEffect(() => {
    return () => { calcRef.current?.destroy(); calcRef.current = null; };
  }, []);

  // Mouse drag handlers
  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const panel = panelRef.current;
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    dragState.current = {
      startX: e.clientX, startY: e.clientY,
      origX: rect.left, origY: rect.top,
    };
    setDragging(true);
    const onMove = (me: MouseEvent) => {
      if (!dragState.current) return;
      const dx = me.clientX - dragState.current.startX;
      const dy = me.clientY - dragState.current.startY;
      setPos({ x: dragState.current.origX + dx, y: dragState.current.origY + dy });
    };
    const onUp = () => {
      dragState.current = null;
      setDragging(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  if (!open) return null;

  const hasPos = pos.x !== 0 || pos.y !== 0;

  return (
    <div
      ref={panelRef}
      className="fixed z-40 flex flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-modal"
      style={{
        width: 420,
        height: 520,
        ...(hasPos
          ? { left: pos.x, top: pos.y, right: 'auto', bottom: 'auto' }
          : { right: 16, bottom: 16 }),
      }}
    >
      {/* Drag handle header */}
      <div
        onMouseDown={onMouseDown}
        className={clsx(
          'flex items-center justify-between border-b border-border-subtle bg-surface-alt px-4 py-2.5',
          dragging ? 'cursor-grabbing' : 'cursor-grab'
        )}
      >
        <div className="flex items-center gap-2">
          {/* Grip dots */}
          <svg aria-hidden className="h-4 w-4 flex-none text-text-muted" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="5" cy="5" r="1.5"/><circle cx="5" cy="11" r="1.5"/>
            <circle cx="11" cy="5" r="1.5"/><circle cx="11" cy="11" r="1.5"/>
          </svg>
          <span className="select-none text-sm font-semibold text-text-primary">Calculator</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          onMouseDown={(e) => e.stopPropagation()}
          className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary"
          aria-label="Close calculator"
        >
          <svg aria-hidden className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {mode === 'iframe' ? (
        <iframe src={DESMOS_IFRAME} title="Desmos Calculator" className="flex-1 border-0" allow="clipboard-write" />
      ) : (
        <div
          ref={containerRef}
          className={clsx('flex-1', mode === 'loading' && 'flex items-center justify-center')}
        >
          {mode === 'loading' && (
            <div className="flex flex-col items-center gap-3 text-sm text-text-muted">
              <svg className="h-6 w-6 animate-spin text-accent" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
              </svg>
              Loading calculator…
            </div>
          )}
        </div>
      )}
    </div>
  );
}
