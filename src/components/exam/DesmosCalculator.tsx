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
  interface Window {
    Desmos?: DesmosGlobal;
  }
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
    s.onerror = () => reject(new Error('Desmos script failed to load'));
    document.head.appendChild(s);

    // Guard against silent failure (script tag exists but never resolves)
    setTimeout(() => {
      if (!window.Desmos) reject(new Error('Desmos API did not initialize'));
    }, 8000);
  });
  return scriptPromise;
}

export function DesmosCalculator({ open, onClose }: DesmosCalculatorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const calcRef = useRef<{ destroy: () => void } | null>(null);
  const [mode, setMode] = useState<'loading' | 'api' | 'iframe'>('loading');

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    loadDesmos()
      .then(() => {
        if (cancelled) return;
        if (!containerRef.current || !window.Desmos) {
          setMode('iframe');
          return;
        }
        if (!calcRef.current) {
          calcRef.current = window.Desmos.GraphingCalculator(
            containerRef.current,
            {
              expressions: true,
              settingsMenu: false,
              zoomButtons: true,
            }
          );
        }
        setMode('api');
      })
      .catch(() => {
        if (!cancelled) setMode('iframe');
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    return () => {
      calcRef.current?.destroy();
      calcRef.current = null;
    };
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-40 flex flex-col rounded-lg border border-bluebook-border bg-white shadow-xl"
      style={{ width: 400, height: 480 }}
    >
      <div className="flex items-center justify-between border-b border-bluebook-border px-3 py-2">
        <span className="text-sm font-semibold">Calculator</span>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-bluebook-muted hover:bg-bluebook-bg"
          aria-label="Close calculator"
        >
          ✕
        </button>
      </div>

      {mode === 'iframe' ? (
        <iframe
          src={DESMOS_IFRAME}
          title="Desmos Calculator"
          className="flex-1 rounded-b-lg border-0"
          allow="clipboard-write"
        />
      ) : (
        <div
          ref={containerRef}
          className={clsx(
            'flex-1',
            mode === 'loading' && 'flex items-center justify-center'
          )}
        >
          {mode === 'loading' && (
            <span className="text-sm text-bluebook-muted">Loading calculator…</span>
          )}
        </div>
      )}
    </div>
  );
}
