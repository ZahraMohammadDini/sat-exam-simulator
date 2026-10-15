'use client';

import clsx from 'clsx';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export interface ConfirmSubmitDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  unanswered: number;
  isLastModule: boolean;
  submitting?: boolean;
}

export function ConfirmSubmitDialog({
  open,
  onCancel,
  onConfirm,
  unanswered,
  isLastModule,
  submitting,
}: ConfirmSubmitDialogProps) {
  const hasUnanswered = unanswered > 0;

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={isLastModule ? 'Submit final section?' : 'Submit this section?'}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={submitting}>
            Keep working
          </Button>
          <Button onClick={onConfirm} loading={submitting}>
            {isLastModule ? 'Submit & finish' : 'Submit section'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Status banner */}
        <div
          className={clsx(
            'flex items-start gap-3 rounded-lg border p-4',
            hasUnanswered
              ? 'border-state-warning/30 bg-state-warning-bg'
              : 'border-state-success/30 bg-state-success-bg'
          )}
        >
          <span
            className={clsx(
              'mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full text-sm font-bold',
              hasUnanswered
                ? 'bg-state-warning text-white'
                : 'bg-state-success text-white'
            )}
            aria-hidden
          >
            {hasUnanswered ? '!' : '✓'}
          </span>
          <p className={clsx(
            'text-sm font-medium',
            hasUnanswered ? 'text-state-warning' : 'text-state-success'
          )}>
            {hasUnanswered
              ? `${unanswered} question${unanswered === 1 ? '' : 's'} left unanswered`
              : 'All questions answered'}
          </p>
        </div>

        <p className="text-sm text-text-secondary">
          Once you submit{isLastModule ? ' the final section' : ' this section'}, you{' '}
          <strong className="text-text-primary">cannot go back</strong> to change your answers.
        </p>
      </div>
    </Modal>
  );
}
