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
    <ul className="space-y-2">
      {choices.map((choice) => {
        const isSelected = selected === choice.id;
        const isStruck = strikethrough.includes(choice.id);
        return (
          <li key={choice.id}>
            <div
              className={clsx(
                'group flex items-start gap-3 rounded-md border p-3 transition-colors',
                isSelected
                  ? 'border-bluebook-accent bg-blue-50'
                  : 'border-bluebook-border bg-white hover:bg-bluebook-bg',
                disabled && 'opacity-70'
              )}
            >
              <button
                type="button"
                onClick={() => !disabled && onSelect(choice.id)}
                className="flex flex-1 items-start gap-3 text-left"
                aria-pressed={isSelected}
                disabled={disabled}
              >
                <span
                  className={clsx(
                    'mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full border text-xs font-bold',
                    isSelected
                      ? 'border-bluebook-accent bg-bluebook-accent text-white'
                      : 'border-bluebook-border bg-white text-bluebook-muted'
                  )}
                >
                  {choice.id}
                </span>
                <div
                  className={clsx(
                    'choice-text flex-1',
                    isStruck && 'line-through opacity-60'
                  )}
                >
                  {choice.mode === 'text' ? (
                    <KatexRenderer text={choice.text} as="span" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={choice.imageUrl}
                      alt={`Choice ${choice.id}`}
                      className="max-h-32 rounded"
                      draggable={false}
                    />
                  )}
                </div>
              </button>
              {onToggleStrikethrough && (
                <button
                  type="button"
                  onClick={() => onToggleStrikethrough(choice.id)}
                  className={clsx(
                    'rounded p-1 text-xs text-bluebook-muted hover:bg-bluebook-bg',
                    isStruck ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  )}
                  aria-label={isStruck ? 'Remove strikethrough' : 'Strike through choice'}
                  title="Strike through"
                >
                  Ⓢ
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}