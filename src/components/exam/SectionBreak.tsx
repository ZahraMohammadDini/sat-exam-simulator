'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { formatTime } from './ExamTimer';
export interface SectionBreakProps {
  nextModuleTitle: string;
  onStart: () => void;
  breakSeconds?: number;
  breakEndsAt?: string | null;
  busy?: boolean;
  error?: string | null;
  isFinal?: boolean;
}
export function SectionBreak({ nextModuleTitle, onStart, breakSeconds = 0, breakEndsAt, busy, error }: SectionBreakProps) {
  const [remaining, setRemaining] = useState(() => breakEndsAt ? Math.max(0, Math.ceil((new Date(breakEndsAt).getTime() - Date.now()) / 1000)) : breakSeconds);
  useEffect(() => {
    if (!breakEndsAt) return;
    const tick = () => setRemaining(Math.max(0, Math.ceil((new Date(breakEndsAt).getTime() - Date.now()) / 1000)));
    tick(); const id = setInterval(tick, 500); return () => clearInterval(id);
  }, [breakEndsAt]);
  return <div className="flex min-h-screen items-center justify-center bg-[#f1f3f9] p-6"><section className="w-full max-w-xl rounded-xl border border-gray-300 bg-white p-10 text-center shadow-sm">
    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#e8ecff] text-3xl text-[#294bc5]">✓</div>
    <h1 className="mb-3 text-2xl font-extrabold text-[#282c38]">{remaining > 0 ? 'Take a break' : 'Ready for the next module?'}</h1>
    <p className="text-gray-600">The previous module is locked. Next: <strong>{nextModuleTitle}</strong>.</p>
    {remaining > 0 && <div className="my-8 text-5xl font-bold tabular-nums">{formatTime(remaining)}</div>}
    <p className="mt-3 text-sm text-gray-500">Your next module timer starts only when you continue.</p>
    {error && <p role="alert" className="mt-4 text-red-700">{error}</p>}
    <Button className="mt-7" onClick={onStart} disabled={busy}>{busy ? 'Starting…' : remaining ? 'Skip break and continue' : 'Start next module'}</Button>
  </section></div>;
}
