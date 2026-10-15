'use client';

import clsx from 'clsx';
import type { Choice } from '@/types';
import { KatexRenderer } from '@/components/ui/KatexRenderer';
import { ZoomableImage } from './ZoomableImage';

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
    <ul className="space-y-2">
      {choices.map((choice) => {
        const isSelected = selected === choice.id;
        const isStruck = strikethrough.includes(choice.id);
        return (
          <li key={choice.id}>
            <div
              className={clsx(
                'group flex items-start gap-3 rounded-md border p-4 transition-all',
                isSelected
                  ? 'border-accent bg-surface-selected'
                  : 'border-border-default bg-surface hover:bg-surface-hover',
                disabled && 'opacity-70'
              )}
            >
              <button
                type="button"
                onClick={() => !disabled && onSelect(choice.id)}
                className="flex flex-1 items-start gap-3 text-left focus:outline-none"
                aria-pressed={isSelected}
                disabled={disabled}
              >
                <span
                  className={clsx(
                    'mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full border text-sm font-semibold transition-colors',
                    isSelected
                      ? 'border-accent bg-accent text-white'
                      : 'border-border-default bg-surface text-text-secondary'
                  )}
                >
                  {choice.id}
                </span>
                <div
                  className={clsx(
                    'choice-text flex-1 pt-1',
                    isStruck && 'line-through opacity-50'
                  )}
                >
                  {choice.mode === 'text' ? (
                    <KatexRenderer text={choice.text} as="span" />
                  ) : (
                    <ZoomableImage
                      src={choice.imageUrl}
                      alt={`Choice ${choice.id}`}
                      inlineMaxHeight={128}
                    />
                  )}
                </div>
              </button>
              {onToggleStrikethrough && (
                <button
                  type="button"
                  onClick={() => onToggleStrikethrough(choice.id)}
                  className={clsx(
                    'rounded p-1.5 text-xs text-text-muted transition-all',
                    'hover:bg-surface-hover hover:text-text-primary',
                    isStruck ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  )}
                  aria-label={isStruck ? 'Remove strikethrough' : 'Strike through choice'}
                  title="Eliminate answer choice"
                >
                  ✕
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
