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
    <div className="flex flex-col gap-8 lg:flex-row">
      {/* Passage — left panel (if present) */}
      {(question.passage || (question.passageIsImage && question.passageImage)) && (
        <div className="lg:w-[48%] lg:flex-shrink-0">
          <PassagePanel question={question} />
        </div>
      )}

      {/* Question side */}
      <div className="flex flex-1 flex-col gap-6">
        {/* Stem */}
        <div className="question-stem">
          {question.stemIsImage && question.stemImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={question.stemImage}
              alt="Question stem"
              className="img-frame"
              draggable={false}
            />
          ) : (
            <KatexRenderer text={question.stem} />
          )}
        </div>

        {/* Divider between stem and choices */}
        <div className="h-px bg-border-subtle" />

        {/* Answer input */}
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
