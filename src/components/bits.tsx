import { BookOpen, Check, FlaskConical, GraduationCap, Network, PencilLine, Presentation, ScrollText } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { sourceMeta } from '../api/providers';
import { DISPLAY_LABEL, displayState, PRIORITY_LABEL } from '../lib/tasks';
import { useStore } from '../store';
import type { Priority, SourceId, Task } from '../types';

const SOURCE_ICON: Record<SourceId, ReactNode> = {
  elearning: <GraduationCap size={14} />,
  ilearning: <BookOpen size={14} />,
  classroom: <Presentation size={14} />,
  kkuexam: <ScrollText size={14} />,
  gecanvas: <FlaskConical size={14} />,
  cisco: <Network size={14} />,
  manual: <PencilLine size={14} />,
};

export function SourceTag({ source }: { source: SourceId }) {
  const meta = sourceMeta(source);
  return (
    <span className="source-tag" style={{ color: meta.color }}>
      {SOURCE_ICON[source]}
      {meta.name}
    </span>
  );
}

export function StateChip({ task }: { task: Task }) {
  const { now } = useStore();
  const state = displayState(task, now);
  return <span className={`chip chip-${state}`}>{DISPLAY_LABEL[state]}</span>;
}

export function PriorityMark({ priority }: { priority: Priority }) {
  return (
    <span className={`priority priority-${priority}`}>
      <i aria-hidden="true" />
      {PRIORITY_LABEL[priority]}
    </span>
  );
}

/** ช่องติ๊ก "ส่งแล้ว" ของงาน */
export function DoneCheck({ task }: { task: Task }) {
  const { setStatus, toast } = useStore();
  const done = task.status === 'done';
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={done ? `ยกเลิกส่งแล้ว: ${task.title}` : `ทำเครื่องหมายว่าส่งแล้ว: ${task.title}`}
      className={`check ${done ? 'is-on' : ''}`}
      onClick={(event) => {
        event.stopPropagation();
        setStatus(task.id, done ? 'todo' : 'done');
        toast(done ? `ย้าย "${task.title}" กลับเป็นยังไม่เริ่ม` : `ทำเครื่องหมาย "${task.title}" ว่าส่งแล้ว`, done ? 'info' : 'success');
      }}
    >
      {done && <Check size={14} strokeWidth={3} />}
    </button>
  );
}

/** วงแหวนแสดงเปอร์เซ็นต์ */
export function Donut({ value, size = 56, label }: { value: number; size?: number; label?: string }) {
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="donut" style={{ width: size, height: size }} role="img" aria-label={`${value}% ${label ?? ''}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--accent-soft)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(value / 100) * circumference} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="donut-text">
        <b>{value}%</b>
        {label && <span>{label}</span>}
      </div>
    </div>
  );
}

export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        {children}
      </div>
    </div>
  );
}
