'use client';

import { useEffect, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { adminPatch, adminDelete } from '@/lib/admin-client';

interface RowQuestion {
  id: string;
  subject: string;
  type: string;
  difficulty: string;
  domain: string | null;
  stem: string | null;
  stemImage: string | null;
  stemIsImage: boolean;
  isPublished: boolean;
}

interface Row {
  tmqId: string;
  order: number;
  question: RowQuestion;
}

export interface SortableQuestionListProps {
  moduleId: string;
  questions: Row[];
  onChanged: () => void;
  onError: (msg: string) => void;
}

export function SortableQuestionList({
  moduleId,
  questions,
  onChanged,
  onError,
}: SortableQuestionListProps) {
  const [items, setItems] = useState<Row[]>(questions);

  useEffect(() => {
    setItems(questions);
  }, [questions]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.tmqId === active.id);
    const newIndex = items.findIndex((i) => i.tmqId === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);

    try {
      await adminPatch(`/api/admin/modules/${moduleId}/questions/order`, {
        orderedIds: reordered.map((r) => r.tmqId),
      });
      onChanged();
    } catch (err) {
      // Roll back on failure
      setItems(items);
      onError(err instanceof Error ? err.message : 'Reorder failed');
    }
  };

  const removeRow = async (tmqId: string) => {
    try {
      await adminDelete(`/api/admin/modules/${moduleId}/questions/${tmqId}`);
      onChanged();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Remove failed');
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((i) => i.tmqId)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="space-y-2">
          {items.map((row, idx) => (
            <SortableRow
              key={row.tmqId}
              row={row}
              number={idx + 1}
              onRemove={() => removeRow(row.tmqId)}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({
  row,
  number,
  onRemove,
}: {
  row: Row;
  number: number;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: row.tmqId });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  const q = row.question;
  const stemPreview = q.stemIsImage
    ? '(image stem)'
    : (q.stem ?? '').slice(0, 120) || '(no stem)';

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-md border border-border-default bg-surface px-3 py-2"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none rounded p-1 text-text-muted hover:bg-surface-alt active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        ⋮⋮
      </button>
      <span className="font-mono text-xs text-text-muted">{number}.</span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm">{stemPreview}</div>
        <div className="mt-0.5 flex gap-2 text-xs text-text-muted">
          <span>{q.type === 'grid_in' ? 'grid-in' : 'multiple choice'}</span>
          <span>·</span>
          <span>{q.difficulty}</span>
          {q.domain && (
            <>
              <span>·</span>
              <span className="truncate">{q.domain}</span>
            </>
          )}
          {!q.isPublished && (
            <span className="text-amber-600">· unpublished</span>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="rounded p-1 text-xs text-red-500 hover:bg-red-50"
        aria-label="Remove from module"
      >
        ✕
      </button>
    </li>
  );
}
