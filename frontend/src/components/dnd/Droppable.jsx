import { useDroppable } from '@dnd-kit/core';

export const Droppable = ({ id, children, data }) => {
  const { setNodeRef, isOver } = useDroppable({ id, data });

  return (
    <div
      ref={setNodeRef}
      className={`transition-colors ${isOver ? 'bg-blue-100 ring-2 ring-blue-400' : ''}`}
    >
      {children}
    </div>
  );
};