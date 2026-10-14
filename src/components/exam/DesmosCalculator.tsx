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
    s.onerror = () => reject(new Error('Failed to load Desmos'));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export function DesmosCalculator({ open, onClose }: DesmosCalculatorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const calcRef = useRef<{ destroy: () => void } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    loadDesmos()
      .then(() => {
        if (cancelled || !containerRef.current || !window.Desmos) return;
        if (!calcRef.current) {
          calcRef.current = window.Desmos.GraphingCalculator(containerRef.current, {
            expressions: true,
            settingsMenu: false,
            zoomButtons: true,
          });
        }
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load calculator');
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
      <div
        ref={containerRef}
        className={clsx('flex-1', !loaded && 'flex items-center justify-center')}
      >
        {!loaded && !error && (
          <span className="text-sm text-bluebook-muted">Loading calculator…</span>
        )}
        {error && <span className="text-sm text-bluebook-wrong">{error}</span>}
      </div>
    </div>
  );
}