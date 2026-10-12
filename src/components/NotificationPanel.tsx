import { BellRing, X } from 'lucide-react';
import { useEffect } from 'react';
import { dueLabel, remainingLabel, timeLabel } from '../lib/date';
import { byDue, isDueSoon, isOverdue } from '../lib/tasks';
import { useStore, useUi } from '../store';
import type { Task } from '../types';

/** ข้อความสรุปที่ LINE Official Account จะส่งให้ (จำลอง) */
export function LinePreview({ tasks, now }: { tasks: Task[]; now: Date }) {
  return (
    <div className="line">
      <div className="line-head">
        <span className="line-logo">T</span>
        <div>
          <b>taskdock แจ้งเตือน</b>
          <span>LINE Official Account · จำลอง</span>
        </div>
      </div>
      <div className="line-body">
        <div className="line-bubble">
          {tasks.length === 0 ? (
            'ตอนนี้ไม่มีงานใกล้ครบกำหนดใน 48 ชั่วโมง พักได้เลย'
          ) : (
            <>
              <b>มี {tasks.length} งานใกล้ครบกำหนด</b>
              <ol>
                {tasks.map((t) => (
                  <li key={t.id}>
                    {t.title}
                    <small>
                      {t.courseCode} · {dueLabel(new Date(t.dueAt), now)}
                    </small>
                  </li>
                ))}
              </ol>
              เปิด taskdock เพื่อดูรายละเอียดและลิงก์ส่งงาน
            </>
          )}
        </div>
        <time>{timeLabel(now)}</time>
      </div>
    </div>
  );
}

export function NotificationPanel({ onClose }: { onClose: () => void }) {
  const { tasks, now } = useStore();
  const { openTask } = useUi();
  const overdue = tasks.filter((t) => isOverdue(t, now)).sort(byDue);
  const soon = tasks.filter((t) => isDueSoon(t, now)).sort(byDue);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const item = (t: Task, late: boolean) => (
    <li key={t.id}>
      <button
        type="button"
        onClick={() => {
          onClose();
          openTask(t.id);
        }}
      >
        <i className={late ? 'is-late' : ''} />
        <span>
          <b>{t.title}</b>
          <small>
            {late ? 'เลยกำหนด' : 'ครบกำหนด'} {dueLabel(new Date(t.dueAt), now)} · {remainingLabel(new Date(t.dueAt), now)}
          </small>
        </span>
      </button>
    </li>
  );

  return (
    <div className="overlay overlay-clear" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="notif" role="dialog" aria-label="การแจ้งเตือน">
        <div className="notif-head">
          <h2>
            <BellRing size={18} /> การแจ้งเตือน
          </h2>
          <button type="button" className="icon-btn sm" aria-label="ปิด" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        {overdue.length + soon.length === 0 ? (
          <p className="empty">ไม่มีงานเลยกำหนดหรือใกล้ครบกำหนดใน 48 ชั่วโมง</p>
        ) : (
          <ul className="notif-list">
            {overdue.map((t) => item(t, true))}
            {soon.map((t) => item(t, false))}
          </ul>
        )}
        <p className="notif-label">ตัวอย่างข้อความที่ส่งทาง LINE ทุกเย็น</p>
        <LinePreview tasks={soon} now={now} />
      </section>
    </div>
  );
}
