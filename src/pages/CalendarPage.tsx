import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { sourceMeta } from '../api/providers';
import { TaskRow } from '../components/TaskRow';
import { addDays, dateKey, fullDate, monthGrid, monthTitle, sameDay, startOfDay, timeLabel, WEEKDAY_SHORT } from '../lib/date';
import { byDue, isOverdue } from '../lib/tasks';
import { useStore, useUi } from '../store';
import type { Task } from '../types';

export function CalendarPage() {
  const { tasks, now } = useStore();
  const { openAdd } = useUi();
  const [month, setMonth] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [selected, setSelected] = useState(() => startOfDay(now));

  const byDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of [...tasks].sort(byDue)) {
      const key = dateKey(new Date(t.dueAt));
      map.set(key, [...(map.get(key) ?? []), t]);
    }
    return map;
  }, [tasks]);

  const dayTasks = byDay.get(dateKey(selected)) ?? [];
  const upcoming = useMemo(() => {
    const from = now.getTime();
    const to = addDays(now, 8).getTime();
    return tasks
      .filter((t) => {
        const due = new Date(t.dueAt).getTime();
        return t.status !== 'done' && due >= from && due < to;
      })
      .sort(byDue);
  }, [tasks, now]);

  const shift = (step: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + step, 1));
  const today = () => {
    setMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelected(startOfDay(now));
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>ปฏิทิน</h1>
          <p className="lead">กำหนดส่งงานรายเดือน กดวันที่เพื่อดูงานของวันนั้น</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => openAdd(selected)}>
          <Plus size={18} /> เพิ่มงานวันที่เลือก
        </button>
      </div>

      <div className="cal-layout">
        <section className="card">
          <div className="cal-head">
            <h2>{monthTitle(month)}</h2>
            <div className="cal-nav">
              <button type="button" className="btn btn-sm" onClick={today}>
                วันนี้
              </button>
              <button type="button" className="icon-btn sm" aria-label="เดือนก่อนหน้า" onClick={() => shift(-1)}>
                <ChevronLeft size={16} />
              </button>
              <button type="button" className="icon-btn sm" aria-label="เดือนถัดไป" onClick={() => shift(1)}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="bigcal">
            {WEEKDAY_SHORT.map((day) => (
              <span key={day} className="bigcal-wd">
                {day}
              </span>
            ))}
            {monthGrid(month).map((day) => {
              const list = byDay.get(dateKey(day)) ?? [];
              const classes = ['bigcal-day'];
              if (day.getMonth() !== month.getMonth()) classes.push('is-out');
              if (sameDay(day, now)) classes.push('is-today');
              if (sameDay(day, selected)) classes.push('is-selected');
              return (
                <button
                  key={dateKey(day)}
                  type="button"
                  className={classes.join(' ')}
                  aria-label={`${fullDate(day)} มี ${list.length} งาน`}
                  onClick={() => setSelected(day)}
                >
                  <span className="bigcal-num">{day.getDate()}</span>
                  {list.slice(0, 2).map((t) => (
                    <span
                      key={t.id}
                      className={`pill ${t.status === 'done' ? 'is-done' : ''} ${isOverdue(t, now) ? 'is-late' : ''}`}
                      style={{ borderLeftColor: sourceMeta(t.source).color }}
                    >
                      {t.title}
                    </span>
                  ))}
                  {list.length > 2 && <span className="pill-more">+{list.length - 2} งาน</span>}
                  {list.some((t) => t.status !== 'done') && <i className="bigcal-dot" />}
                </button>
              );
            })}
          </div>
        </section>

        <div className="side-col">
          <section className="card">
            <div className="card-head">
              <div>
                <h2>{fullDate(selected)}</h2>
                <p>{dayTasks.length === 0 ? 'ไม่มีงานครบกำหนด' : `${dayTasks.length} งานครบกำหนด`}</p>
              </div>
            </div>
            {dayTasks.length === 0 ? (
              <p className="empty">วันนี้ว่าง ใช้เวลาเตรียมงานถัดไปได้</p>
            ) : (
              <ul className="tlist compact">
                {dayTasks.map((t) => (
                  <TaskRow key={t.id} task={t} />
                ))}
              </ul>
            )}
          </section>

          <section className="card">
            <div className="card-head">
              <div>
                <h2>กำลังจะถึง</h2>
                <p>งานที่ยังไม่ส่งใน 7 วันข้างหน้า</p>
              </div>
            </div>
            {upcoming.length === 0 ? (
              <p className="empty">ไม่มีงานค้างใน 7 วันข้างหน้า</p>
            ) : (
              <ul className="agenda">
                {upcoming.map((t) => {
                  const due = new Date(t.dueAt);
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(startOfDay(due));
                          setMonth(new Date(due.getFullYear(), due.getMonth(), 1));
                        }}
                      >
                        <span className="agenda-date">
                          <b>{due.getDate()}</b>
                          {WEEKDAY_SHORT[due.getDay()]}
                        </span>
                        <span>
                          <b>{t.title}</b>
                          <small>
                            {t.courseCode} · {timeLabel(due)}
                          </small>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
