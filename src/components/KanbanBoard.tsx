import { useEffect, useRef, useState } from 'react';
import { SourceTag, PriorityMark, StateChip } from './bits';
import { dueLabel, remainingLabel } from '../lib/date';
import { isOverdue, movableTask, STATUS_LABEL } from '../lib/tasks';
import { useStore, useUi } from '../store';
import type { Task, TaskStatus } from '../types';

const STATUSES: TaskStatus[] = ['todo', 'doing', 'done'];
const DRAG_TYPE = 'application/x-taskdock-task';

export function KanbanBoard({ tasks, resultRef }: { tasks: Task[]; resultRef: React.RefObject<HTMLSpanElement | null> }) {
  const { now, setStatus, toast } = useStore();
  const { openTask } = useUi();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropStatus, setDropStatus] = useState<TaskStatus | null>(null);
  const pendingFocus = useRef<string | null>(null);

  useEffect(() => {
    const id = pendingFocus.current;
    if (!id) return;
    pendingFocus.current = null;
    const card = [...document.querySelectorAll<HTMLElement>('.kanban-card')].find((node) => node.dataset.taskId === id);
    (card?.querySelector('select') ?? resultRef.current)?.focus();
  }, [tasks, resultRef]);

  const move = (task: Task, status: TaskStatus) => {
    if (task.status === status) return;
    pendingFocus.current = task.id;
    setStatus(task.id, status);
    toast(`เปลี่ยนสถานะ "${task.title}" เป็น "${STATUS_LABEL[status]}"`, status === 'done' ? 'success' : 'info');
  };

  return (
    <div className="kanban-board" aria-label="กระดานสถานะงาน">
      {STATUSES.map((status) => {
        const cards = tasks.filter((task) => task.status === status);
        return (
          <section
            key={status}
            className={`kanban-column${dropStatus === status ? ' is-drop-target' : ''}`}
            aria-label={`${STATUS_LABEL[status]} ${cards.length} งาน`}
            onDragOver={(event) => {
              if (!movableTask(tasks, draggedId, draggedId ?? '', status)) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';
              setDropStatus(status);
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node)) setDropStatus(null);
            }}
            onDrop={(event) => {
              event.preventDefault();
              const task = movableTask(tasks, draggedId, event.dataTransfer.getData(DRAG_TYPE), status);
              if (task) move(task, status);
              setDraggedId(null);
              setDropStatus(null);
            }}
          >
            <h2>{STATUS_LABEL[status]} <span>{cards.length}</span></h2>
            <div className="kanban-cards">
              {cards.map((task) => {
                const due = new Date(task.dueAt);
                return (
                  <article
                    key={task.id}
                    data-task-id={task.id}
                    className={`kanban-card${draggedId === task.id ? ' is-dragging' : ''}`}
                    draggable
                    onDragStart={(event) => {
                      setDraggedId(task.id);
                      event.dataTransfer.effectAllowed = 'move';
                      event.dataTransfer.setData(DRAG_TYPE, task.id);
                    }}
                    onDragEnd={() => {
                      setDraggedId(null);
                      setDropStatus(null);
                    }}
                  >
                    <button type="button" className="kanban-title" onClick={() => openTask(task.id)}>{task.title}</button>
                    <p className="kanban-course">{task.courseCode} · {task.courseName}</p>
                    <div className="kanban-meta"><SourceTag source={task.source} /><PriorityMark priority={task.priority} /></div>
                    <div className="kanban-due">
                      <span>{dueLabel(due, now)}</span>
                      <StateChip task={task} />
                    </div>
                    <small className={isOverdue(task, now) ? 'is-late' : ''}>{task.status === 'done' ? 'ส่งแล้ว' : remainingLabel(due, now)}</small>
                    <select
                      className={`status-select st-${task.status}`}
                      aria-label={`สถานะของ ${task.title}`}
                      value={task.status}
                      onChange={(event) => move(task, event.target.value as TaskStatus)}
                    >
                      {STATUSES.map((option) => <option key={option} value={option}>{STATUS_LABEL[option]}</option>)}
                    </select>
                  </article>
                );
              })}
              {cards.length === 0 && <p className="kanban-empty">ยังไม่มีงานในสถานะนี้</p>}
            </div>
          </section>
        );
      })}
    </div>
  );
}
