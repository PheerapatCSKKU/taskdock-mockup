import type { ProviderId } from '../mock/types';

export type { ProviderId };
export type SourceId = ProviderId | 'manual';
export type TaskStatus = 'todo' | 'doing' | 'done';
export type Priority = 'high' | 'medium' | 'low';
export type TaskKind = 'assignment' | 'group' | 'exam' | 'lab';

/** รูปแบบงานกลางของระบบ หลังแปลงจากข้อมูลดิบของทุกแพลตฟอร์ม */
export interface Task {
  id: string;
  title: string;
  detail: string;
  courseCode: string;
  courseName: string;
  source: SourceId;
  kind: TaskKind;
  dueAt: string;
  status: TaskStatus;
  priority: Priority;
  points: number | null;
  url: string;
  updatedAt: string;
}

export interface NewTaskInput {
  title: string;
  detail: string;
  courseCode: string;
  courseName: string;
  dueAt: string;
  priority: Priority;
  url: string;
}

export type Page = 'dashboard' | 'tasks' | 'calendar' | 'sources' | 'stats';
