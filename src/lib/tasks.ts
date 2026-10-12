import type { Priority, Task, TaskKind, TaskStatus } from '../types';

export const SOON_HOURS = 48;

export const STATUS_LABEL: Record<TaskStatus, string> = { todo: 'ยังไม่เริ่ม', doing: 'กำลังทำ', done: 'ส่งแล้ว' };
export const PRIORITY_LABEL: Record<Priority, string> = { high: 'สูง', medium: 'กลาง', low: 'ต่ำ' };
export const KIND_LABEL: Record<TaskKind, string> = {
  assignment: 'งานเดี่ยว',
  group: 'งานกลุ่ม',
  exam: 'สอบ',
  lab: 'แล็บ',
};

const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

export const isOverdue = (t: Task, now: Date) => t.status !== 'done' && new Date(t.dueAt).getTime() < now.getTime();

export function isDueSoon(t: Task, now: Date): boolean {
  if (t.status === 'done') return false;
  const ms = new Date(t.dueAt).getTime() - now.getTime();
  return ms >= 0 && ms <= SOON_HOURS * 3_600_000;
}

/** สถานะที่ใช้แสดงผล: งานที่เลยกำหนดหรือใกล้ครบกำหนดจะเด่นกว่าสถานะที่ผู้ใช้ตั้งไว้ */
export type DisplayState = 'overdue' | 'urgent' | TaskStatus;

export function displayState(t: Task, now: Date): DisplayState {
  if (isOverdue(t, now)) return 'overdue';
  if (isDueSoon(t, now)) return 'urgent';
  return t.status;
}

export const DISPLAY_LABEL: Record<DisplayState, string> = {
  overdue: 'เลยกำหนด',
  urgent: 'เร่งด่วน',
  ...STATUS_LABEL,
};

/** งานที่ยังไม่ส่งมาก่อน เรียงตามกำหนดส่งใกล้สุด ส่วนงานที่ส่งแล้วไว้ท้ายสุด */
export function byDue(a: Task, b: Task): number {
  const doneA = a.status === 'done' ? 1 : 0;
  const doneB = b.status === 'done' ? 1 : 0;
  if (doneA !== doneB) return doneA - doneB;
  const diff = new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
  return doneA ? -diff : diff;
}

export function byPriority(a: Task, b: Task): number {
  return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || byDue(a, b);
}

export interface Counts {
  total: number;
  todo: number;
  doing: number;
  done: number;
  overdue: number;
  soon: number;
}

export function countTasks(tasks: Task[], now: Date): Counts {
  const counts: Counts = { total: tasks.length, todo: 0, doing: 0, done: 0, overdue: 0, soon: 0 };
  for (const t of tasks) {
    counts[t.status] += 1;
    if (isOverdue(t, now)) counts.overdue += 1;
    if (isDueSoon(t, now)) counts.soon += 1;
  }
  return counts;
}

export const percent = (part: number, whole: number) => (whole === 0 ? 0 : Math.round((part / whole) * 100));
