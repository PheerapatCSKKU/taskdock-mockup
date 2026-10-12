import { Calendar, Ellipsis } from 'lucide-react';
import { dueLabel } from '../lib/date';
import { isOverdue } from '../lib/tasks';
import { useStore, useUi } from '../store';
import type { Task } from '../types';
import { DoneCheck, SourceTag, StateChip } from './bits';

export function TaskRow({ task }: { task: Task }) {
  const { now } = useStore();
  const { openTask } = useUi();
  return (
    <li className={`trow ${task.status === 'done' ? 'is-done' : ''}`}>
      <DoneCheck task={task} />
      <button type="button" className="trow-main" onClick={() => openTask(task.id)}>
        <span className="trow-title">{task.title}</span>
        <span className="trow-meta">
          <SourceTag source={task.source} />
          <span className={`due ${isOverdue(task, now) ? 'is-late' : ''}`}>
            <Calendar size={13} />
            {dueLabel(new Date(task.dueAt), now)}
          </span>
          <span className="course">{task.courseCode}</span>
        </span>
      </button>
      <StateChip task={task} />
      <button type="button" className="icon-btn ghost" aria-label={`รายละเอียด: ${task.title}`} onClick={() => openTask(task.id)}>
        <Ellipsis size={18} />
      </button>
    </li>
  );
}
