import { CalendarClock, CircleCheck, ExternalLink, Trash2, X } from 'lucide-react';
import { useEffect } from 'react';
import { fullDate, relativeTime, remainingLabel, timeLabel } from '../lib/date';
import { KIND_LABEL, PRIORITY_LABEL, STATUS_LABEL } from '../lib/tasks';
import { useStore } from '../store';
import type { Priority, TaskStatus } from '../types';
import { SourceTag, StateChip } from './bits';

const STATUSES: TaskStatus[] = ['todo', 'doing', 'done'];
const PRIORITIES: Priority[] = ['high', 'medium', 'low'];

export function TaskDrawer({ taskId, onClose }: { taskId: string; onClose: () => void }) {
  const { tasks, now, setStatus, setPriority, removeTask, toast } = useStore();
  const task = tasks.find((t) => t.id === taskId);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!task) return null;
  const due = new Date(task.dueAt);

  return (
    <div className="overlay overlay-right" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={`รายละเอียดงาน ${task.title}`}>
        <div className="drawer-head">
          <StateChip task={task} />
          <button type="button" className="icon-btn" aria-label="ปิด" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <h2>{task.title}</h2>
        <p className="drawer-course">
          {task.courseCode} {task.courseName}
        </p>

        <div className="due-box">
          <CalendarClock size={20} />
          <div>
            <b>
              {fullDate(due)} · {timeLabel(due)}
            </b>
            <span>{task.status === 'done' ? 'ส่งแล้ว' : remainingLabel(due, now)}</span>
          </div>
        </div>

        <dl className="facts">
          <dt>แหล่งที่มา</dt>
          <dd>
            <SourceTag source={task.source} />
          </dd>
          <dt>ประเภท</dt>
          <dd>{KIND_LABEL[task.kind]}</dd>
          <dt>คะแนนเต็ม</dt>
          <dd>{task.points === null ? 'ไม่ระบุ' : `${task.points} คะแนน`}</dd>
          <dt>อัปเดตล่าสุด</dt>
          <dd>{relativeTime(task.updatedAt, now)}</dd>
        </dl>

        {task.detail && (
          <>
            <h3>รายละเอียด</h3>
            <p className="drawer-detail">{task.detail}</p>
          </>
        )}

        <h3>สถานะ</h3>
        <div className="segmented" role="radiogroup" aria-label="สถานะงาน">
          {STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              role="radio"
              aria-checked={task.status === status}
              className={task.status === status ? 'is-on' : ''}
              onClick={() => {
                setStatus(task.id, status);
                toast(`เปลี่ยนสถานะเป็น "${STATUS_LABEL[status]}"`, status === 'done' ? 'success' : 'info');
              }}
            >
              {STATUS_LABEL[status]}
            </button>
          ))}
        </div>

        <h3>ความสำคัญ</h3>
        <div className="segmented" role="radiogroup" aria-label="ความสำคัญ">
          {PRIORITIES.map((priority) => (
            <button
              key={priority}
              type="button"
              role="radio"
              aria-checked={task.priority === priority}
              className={task.priority === priority ? 'is-on' : ''}
              onClick={() => setPriority(task.id, priority)}
            >
              {PRIORITY_LABEL[priority]}
            </button>
          ))}
        </div>

        <p className="hint">สถานะ “ส่งแล้ว” ที่เลือกในหน้านี้เป็นบันทึกส่วนตัว ไม่ใช่หลักฐานการส่งงานบนระบบต้นทาง</p>

        <div className="drawer-actions">
          {task.status !== 'done' && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setStatus(task.id, 'done');
                toast(`ทำเครื่องหมาย "${task.title}" ว่าส่งแล้ว`, 'success');
              }}
            >
              <CircleCheck size={18} />
              ทำเครื่องหมายว่าส่งแล้ว
            </button>
          )}
          {task.url && (
            <button
              type="button"
              className="btn"
              onClick={() => toast(`ลิงก์จำลอง: ระบบจริงจะเปิด ${task.url}`)}
            >
              <ExternalLink size={16} />
              เปิดในระบบต้นทาง
            </button>
          )}
          {task.source === 'manual' && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                removeTask(task.id);
                onClose();
              }}
            >
              <Trash2 size={16} />
              ลบงานนี้
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}
