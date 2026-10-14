'use client';

import type { PublicQuestion } from '@/types';
import { KatexRenderer } from '@/components/ui/KatexRenderer';
import { AnswerChoices } from './AnswerChoices';
import { GridInInput } from './GridInInput';
import { PassagePanel } from './PassagePanel';

export interface QuestionDisplayProps {
  question: PublicQuestion;
  selected: string | null;
  onAnswer: (value: string | null) => void;
  strikethrough?: string[];
  onToggleStrikethrough?: (id: string) => void;
  disabled?: boolean;
}

export function QuestionDisplay({
  question,
  selected,
  onAnswer,
  strikethrough = [],
  onToggleStrikethrough,
  disabled,
}: QuestionDisplayProps) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
      {question.passage && (
        <div className="lg:w-1/2 lg:flex-shrink-0">
          <PassagePanel question={question} />
        </div>
      )}
      <div className="flex-1 space-y-6">
        <div className="question-stem">
          {question.stemIsImage && question.stemImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={question.stemImage}
              alt="Question stem"
              className="max-w-full rounded border border-bluebook-border"
              draggable={false}
            />
          ) : (
            <KatexRenderer text={question.stem} className="text-base" />
          )}
        </div>

        {question.type === 'multiple_choice' && question.choices && (
          <AnswerChoices
            choices={question.choices}
            selected={selected}
            onSelect={(id) => onAnswer(id)}
            strikethrough={strikethrough}
            onToggleStrikethrough={onToggleStrikethrough}
            disabled={disabled}
          />
        )}

        {question.type === 'grid_in' && (
          <GridInInput
            value={selected ?? ''}
            onChange={(v) => onAnswer(v || null)}
            disabled={disabled}
          />
        )}
      </div>
    </div>
  );
}