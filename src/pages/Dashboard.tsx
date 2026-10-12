import { AlarmClock, ArrowUpRight, CircleCheck, Flag, Layers, TriangleAlert } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Donut, SourceTag } from '../components/bits';
import { MonthCalendar } from '../components/MonthCalendar';
import { TaskRow } from '../components/TaskRow';
import { addDays, dueLabel, fullDate, relativeTime, sameDay, shortDate, startOfDay } from '../lib/date';
import { byDue, countTasks, isDueSoon, isOverdue, percent, SOON_HOURS } from '../lib/tasks';
import { useStore, useUi } from '../store';
import type { Task } from '../types';

type Tab = 'all' | 'todo' | 'doing' | 'done' | 'overdue';

const DEMO_NAME = 'ต้นกล้า';

export function Dashboard() {
  const { tasks, now, booting, sync } = useStore();
  const { go, openTask } = useUi();
  const [tab, setTab] = useState<Tab>('all');
  const [picked, setPicked] = useState<Date | null>(null);

  const counts = useMemo(() => countTasks(tasks, now), [tasks, now]);
  const focus = counts.soon + counts.overdue;

  const laterThisWeek = useMemo(() => {
    const limit = addDays(now, 7).getTime();
    return tasks.filter(
      (t) => t.status !== 'done' && !isDueSoon(t, now) && !isOverdue(t, now) && new Date(t.dueAt).getTime() <= limit,
    ).length;
  }, [tasks, now]);

  // ความคืบหน้าของงานที่ครบกำหนดในสัปดาห์นี้ (อาทิตย์–เสาร์)
  const week = useMemo(() => {
    const start = addDays(startOfDay(now), -now.getDay()).getTime();
    const end = start + 7 * 86_400_000;
    const inWeek = tasks.filter((t) => {
      const due = new Date(t.dueAt).getTime();
      return due >= start && due < end;
    });
    const scope = inWeek.length > 0 ? inWeek : tasks;
    return percent(scope.filter((t) => t.status === 'done').length, scope.length);
  }, [tasks, now]);

  const tabs: { id: Tab; label: string; count: number; test: (t: Task) => boolean }[] = [
    { id: 'all', label: 'ทั้งหมด', count: counts.total, test: () => true },
    { id: 'todo', label: 'ยังไม่เริ่ม', count: counts.todo, test: (t) => t.status === 'todo' },
    { id: 'doing', label: 'กำลังทำ', count: counts.doing, test: (t) => t.status === 'doing' },
    { id: 'done', label: 'ส่งแล้ว', count: counts.done, test: (t) => t.status === 'done' },
    { id: 'overdue', label: 'เลยกำหนด', count: counts.overdue, test: (t) => isOverdue(t, now) },
  ];
  const active = tabs.find((t) => t.id === tab) ?? tabs[0];
  const visible = tasks.filter(active.test).sort(byDue);
  const shown = visible.slice(0, 7);

  const important = tasks.filter((t) => t.status !== 'done' && t.priority === 'high').sort(byDue).slice(0, 3);
  const recent = [...tasks].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 4);
  const pickedTasks = picked ? tasks.filter((t) => sameDay(new Date(t.dueAt), picked)).sort(byDue) : [];
  const sources = Object.values(sync).filter((s) => s.state === 'ok').length;
  const progress = percent(counts.done, counts.total);

  const weekMessage =
    week >= 60 ? 'ทำได้ดีมาก รักษาจังหวะต่อไป' : week >= 30 ? 'มาได้ครึ่งทางแล้ว ค่อย ๆ เก็บทีละงาน' : 'เริ่มจากงานที่ครบกำหนดก่อน';

  return (
    <div className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">{fullDate(now)}</p>
          <h1>
            สวัสดี, {DEMO_NAME} <span aria-hidden="true">👋</span>
          </h1>
          <p className="lead">
            {booting ? (
              'กำลังดึงงานจากทุกระบบ…'
            ) : focus > 0 ? (
              <>
                วันนี้มีงานที่ต้องโฟกัส <b>{focus} รายการ</b> และอีก {laterThisWeek} รายการใน 7 วันข้างหน้า
              </>
            ) : (
              <>ไม่มีงานเร่งด่วนใน {SOON_HOURS} ชั่วโมงนี้ และมีอีก {laterThisWeek} รายการใน 7 วันข้างหน้า</>
            )}
          </p>
        </div>
        <div className="week-card">
          <Donut value={week} label="ส่งแล้ว" />
          <div>
            <b>ภาพรวมสัปดาห์นี้</b>
            <span>{weekMessage}</span>
          </div>
        </div>
      </section>

      <section className="stats">
        <article className="stat">
          <header>
            <span>งานทั้งหมด</span>
            <Layers size={18} />
          </header>
          <p className="stat-num">
            <b>{counts.total}</b> รายการ
          </p>
          <footer>
            จาก {sources} ระบบที่เชื่อมต่อ · ยังไม่เริ่ม {counts.todo} · กำลังทำ {counts.doing}
          </footer>
        </article>

        <article className="stat stat-warn">
          <header>
            <span>ใกล้ครบกำหนด</span>
            <AlarmClock size={18} />
          </header>
          <p className="stat-num">
            <b>{counts.soon}</b> ภายใน {SOON_HOURS} ชม.
          </p>
          <footer>
            {counts.overdue > 0 ? (
              <>
                <em>
                  <TriangleAlert size={14} /> เลยกำหนด {counts.overdue} งาน
                </em>{' '}
                ควรจัดการก่อน
              </>
            ) : counts.soon > 0 ? (
              <>
                <em>
                  <TriangleAlert size={14} /> ต้องจัดการ
                </em>{' '}
                เริ่มจากงานที่เร่งด่วน
              </>
            ) : (
              'ยังไม่มีงานที่ต้องรีบ'
            )}
          </footer>
        </article>

        <article className="stat">
          <header>
            <span>ส่งแล้ว</span>
            <CircleCheck size={18} />
          </header>
          <p className="stat-num">
            <b>{counts.done}</b> / {counts.total} งาน
          </p>
          <div className="bar" role="img" aria-label={`ความคืบหน้า ${progress}%`}>
            <i style={{ width: `${progress}%` }} />
          </div>
          <footer>ความคืบหน้า {progress}%</footer>
        </article>
      </section>

      <div className="dash-grid">
        <section className="card">
          <div className="card-head">
            <div>
              <h2>งานที่ต้องทำ</h2>
              <p>เรียงตามกำหนดส่งที่ใกล้ที่สุด</p>
            </div>
            <button type="button" className="link" onClick={() => go('tasks')}>
              ดูทั้งหมด <ArrowUpRight size={16} />
            </button>
          </div>

          <div className="tabs" role="tablist" aria-label="กรองตามสถานะ">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                className={tab === t.id ? 'is-on' : ''}
                onClick={() => setTab(t.id)}
              >
                {t.label} <span>{t.count}</span>
              </button>
            ))}
          </div>

          {booting ? (
            <ul className="tlist" aria-busy="true">
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className="trow skeleton" />
              ))}
            </ul>
          ) : shown.length === 0 ? (
            <p className="empty">ไม่มีงานในกลุ่มนี้</p>
          ) : (
            <ul className="tlist">
              {shown.map((t) => (
                <TaskRow key={t.id} task={t} />
              ))}
            </ul>
          )}
          {visible.length > shown.length && (
            <button type="button" className="more" onClick={() => go('tasks')}>
              ดูอีก {visible.length - shown.length} รายการ
            </button>
          )}
        </section>

        <div className="side-col">
          <section className="card">
            <MonthCalendar selected={picked} onSelect={(day) => setPicked(picked && sameDay(picked, day) ? null : day)} />
            {picked && (
              <div className="picked">
                <b>งานวันที่ {shortDate(picked)}</b>
                {pickedTasks.length === 0 ? (
                  <p>ไม่มีงานครบกำหนดวันนี้</p>
                ) : (
                  pickedTasks.map((t) => (
                    <button key={t.id} type="button" onClick={() => openTask(t.id)}>
                      {t.title}
                      <small>{dueLabel(new Date(t.dueAt), now)}</small>
                    </button>
                  ))
                )}
              </div>
            )}
          </section>

          <section className="card">
            <div className="card-head">
              <div>
                <h2>งานสำคัญ</h2>
                <p>ความสำคัญสูงและยังไม่ส่ง</p>
              </div>
            </div>
            {important.length === 0 ? (
              <p className="empty">ไม่มีงานสำคัญค้างอยู่</p>
            ) : (
              <ul className="mini-list">
                {important.map((t) => (
                  <li key={t.id}>
                    <button type="button" onClick={() => openTask(t.id)}>
                      <Flag size={15} />
                      <span>
                        <b>{t.title}</b>
                        <small>
                          {t.courseCode} · {dueLabel(new Date(t.dueAt), now)}
                        </small>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card">
            <div className="card-head">
              <div>
                <h2>อัปเดตล่าสุด</h2>
                <p>งานที่มีการเปลี่ยนแปลงล่าสุด</p>
              </div>
            </div>
            <ul className="mini-list">
              {recent.map((t) => (
                <li key={t.id}>
                  <button type="button" onClick={() => openTask(t.id)}>
                    <span>
                      <b>{t.title}</b>
                      <small>
                        <SourceTag source={t.source} /> · {relativeTime(t.updatedAt, now)}
                      </small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
