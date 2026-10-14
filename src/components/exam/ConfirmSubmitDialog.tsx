'use client';

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
            {isLastModule ? 'Submit final' : 'Submit section'}
          </Button>
        </>
      }
    >
      <p className="text-sm text-bluebook-muted">
        {unanswered > 0
          ? `You have ${unanswered} unanswered question${
              unanswered === 1 ? '' : 's'
            }. Once you submit, you can’t return to this section.`
          : 'All questions answered. Once you submit, you can’t return to this section.'}
      </p>
    </Modal>
  );
}