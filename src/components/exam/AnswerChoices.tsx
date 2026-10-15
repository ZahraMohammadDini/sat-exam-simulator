'use client';

import clsx from 'clsx';
import type { Choice } from '@/types';
import { KatexRenderer } from '@/components/ui/KatexRenderer';

export interface AnswerChoicesProps {
  choices: Choice[];
  selected: string | null;
  onSelect: (id: string) => void;
  strikethrough?: string[];
  onToggleStrikethrough?: (id: string) => void;
  disabled?: boolean;
}

export function AnswerChoices({
  choices,
  selected,
  onSelect,
  strikethrough = [],
  onToggleStrikethrough,
  disabled,
}: AnswerChoicesProps) {
  return (
    <ul className="space-y-2.5">
      {choices.map((choice) => {
        const isSelected = selected === choice.id;
        const isStruck = strikethrough.includes(choice.id);
        return (
          <li key={choice.id}>
            <div
              className={clsx(
                'group flex min-w-0 items-center gap-2 rounded-lg border transition-colors focus-within:ring-2 focus-within:ring-accent/25',
                isSelected
                  ? 'border-accent bg-surface-selected shadow-sm'
                  : 'border-border-default bg-surface hover:border-border-default hover:bg-surface-hover',
                isStruck && !isSelected && 'opacity-50',
                disabled && 'cursor-not-allowed opacity-60'
              )}
            >
              <button
                type="button"
                onClick={() => !disabled && !isStruck && onSelect(choice.id)}
                className="flex min-w-0 flex-1 items-center gap-3 p-3 text-left focus:outline-none sm:p-3.5"
                aria-pressed={isSelected}
                disabled={disabled}
              >
                {/* Letter circle */}
                <span
                  className={clsx(
                    'flex h-8 w-8 flex-none items-center justify-center rounded-full border text-sm font-semibold transition-all',
                    isSelected
                      ? 'border-accent bg-accent text-white'
                      : 'border-border-default bg-surface text-text-secondary group-hover:border-accent/40'
                  )}
                >
                  {choice.id}
                </span>

                {/* Choice content */}
                <div
                  className={clsx(
                    'choice-text min-w-0 flex-1 leading-snug',
                    isStruck && 'line-through'
                  )}
                >
                  {choice.mode === 'text' ? (
                    <KatexRenderer text={choice.text} as="span" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={choice.imageUrl}
                      alt={`Choice ${choice.id}`}
                      className="img-frame-choice"
                      draggable={false}
                    />
                  )}
                </div>
              </button>

              {/* Strikethrough toggle — visible on hover */}
              {onToggleStrikethrough && (
                <button
                  type="button"
                  onClick={() => onToggleStrikethrough(choice.id)}
                  className={clsx(
                    'mr-2 min-h-8 min-w-8 rounded px-2 py-1 text-xs font-medium transition-opacity sm:mr-3',
                    'text-text-muted hover:bg-surface-hover hover:text-text-primary focus-visible:opacity-100',
                    isStruck ? 'opacity-100' : 'opacity-60 sm:opacity-0 sm:group-hover:opacity-60'
                  )}
                  aria-label={isStruck ? 'Remove strikethrough' : 'Eliminate this choice'}
                  title="Eliminate answer choice"
                >
                  {isStruck ? (
                    <span className="flex items-center gap-1">
                      <span aria-hidden>↩</span>
                      <span className="hidden sm:inline">Undo</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 line-through">
                      <span aria-hidden>A</span>
                    </span>
                  )}
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
