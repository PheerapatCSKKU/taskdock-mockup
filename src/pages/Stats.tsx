import { useMemo } from 'react';
import { sourceMeta } from '../api/providers';
import { Donut } from '../components/bits';
import { addDays, dateKey, sameDay, startOfDay, WEEKDAY_SHORT } from '../lib/date';
import { countTasks, percent } from '../lib/tasks';
import { useStore } from '../store';
import type { Task } from '../types';

interface Group {
  key: string;
  label: string;
  sub: string;
  color: string;
  done: number;
  total: number;
}

function groupBy(tasks: Task[], pick: (t: Task) => Omit<Group, 'done' | 'total'>): Group[] {
  const map = new Map<string, Group>();
  for (const t of tasks) {
    const base = pick(t);
    const group = map.get(base.key) ?? { ...base, done: 0, total: 0 };
    group.total += 1;
    if (t.status === 'done') group.done += 1;
    map.set(base.key, group);
  }
  return [...map.values()].sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));
}

function GroupBars({ groups }: { groups: Group[] }) {
  return (
    <ul className="gbars">
      {groups.map((g) => (
        <li key={g.key}>
          <div className="gbar-top">
            <span>
              <b>{g.label}</b>
              <small>{g.sub}</small>
            </span>
            <span className="gbar-num">
              {g.done}/{g.total} · {percent(g.done, g.total)}%
            </span>
          </div>
          <div className="bar" role="img" aria-label={`${g.label} ส่งแล้ว ${g.done} จาก ${g.total} งาน`}>
            <i style={{ width: `${percent(g.done, g.total)}%`, background: g.color }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Stats() {
  const { tasks, now } = useStore();
  const counts = useMemo(() => countTasks(tasks, now), [tasks, now]);

  const byCourse = useMemo(
    () => groupBy(tasks, (t) => ({ key: t.courseCode, label: t.courseCode, sub: t.courseName, color: 'var(--accent)' })),
    [tasks],
  );
  const bySource = useMemo(
    () =>
      groupBy(tasks, (t) => {
        const meta = sourceMeta(t.source);
        return { key: t.source, label: meta.name, sub: '', color: meta.color };
      }),
    [tasks],
  );

  // งานที่ครบกำหนดรายวัน: 7 วันที่ผ่านมา ถึง 7 วันข้างหน้า
  const days = useMemo(() => {
    const today = startOfDay(now);
    return Array.from({ length: 15 }, (_, i) => {
      const day = addDays(today, i - 7);
      const due = tasks.filter((t) => sameDay(new Date(t.dueAt), day));
      return { day, done: due.filter((t) => t.status === 'done').length, pending: due.filter((t) => t.status !== 'done').length };
    });
  }, [tasks, now]);
  const peak = Math.max(2, ...days.map((d) => d.done + d.pending));

  const periods = useMemo(() => {
    const today = startOfDay(now).getTime();
    const day = 86_400_000;
    const range = (label: string, from: number, to: number) => {
      const list = tasks.filter((t) => {
        const due = new Date(t.dueAt).getTime();
        return due >= from && due < to;
      });
      return { label, done: list.filter((t) => t.status === 'done').length, total: list.length };
    };
    return [
      range('7 วันที่ผ่านมา', today - 7 * day, today),
      range('7 วันข้างหน้า', today, today + 7 * day),
      range('หลังจากนั้น', today + 7 * day, Number.MAX_SAFE_INTEGER),
    ];
  }, [tasks, now]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>สถิติของฉัน</h1>
          <p className="lead">ความคืบหน้าของงานทั้งหมด แยกตามวิชา ระบบต้นทาง และช่วงเวลา</p>
        </div>
      </div>

      <section className="stats stats-4">
        <article className="stat stat-donut">
          <Donut value={percent(counts.done, counts.total)} size={72} label="ส่งแล้ว" />
          <div>
            <span>ความคืบหน้ารวม</span>
            <p className="stat-num">
              <b>{counts.done}</b> / {counts.total} งาน
            </p>
          </div>
        </article>
        <article className="stat">
          <header>
            <span>ยังไม่เริ่ม</span>
          </header>
          <p className="stat-num">
            <b>{counts.todo}</b> งาน
          </p>
        </article>
        <article className="stat">
          <header>
            <span>กำลังทำ</span>
          </header>
          <p className="stat-num">
            <b>{counts.doing}</b> งาน
          </p>
        </article>
        <article className={`stat ${counts.overdue > 0 ? 'stat-late' : ''}`}>
          <header>
            <span>เลยกำหนด</span>
          </header>
          <p className="stat-num">
            <b>{counts.overdue}</b> งาน
          </p>
        </article>
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <h2>งานที่ครบกำหนดรายวัน</h2>
            <p>7 วันที่ผ่านมา ถึง 7 วันข้างหน้า</p>
          </div>
          <div className="legend">
            <span>
              <i style={{ background: 'var(--accent)' }} /> ส่งแล้ว
            </span>
            <span>
              <i style={{ background: 'var(--amber-mark)' }} /> ยังไม่ส่ง
            </span>
          </div>
        </div>
        <div className="chart-wrap">
          <div className="chart" role="img" aria-label="จำนวนงานที่ครบกำหนดในแต่ละวัน">
            {days.map(({ day, done, pending }) => (
              <div key={dateKey(day)} className={`chart-col ${sameDay(day, now) ? 'is-today' : ''}`}>
                <div className="chart-stack" title={`ส่งแล้ว ${done} · ยังไม่ส่ง ${pending}`}>
                  {done + pending > 0 && <span className="chart-val">{done + pending}</span>}
                  {pending > 0 && <i className="seg-pending" style={{ height: `${(pending / peak) * 100}%` }} />}
                  {done > 0 && <i className="seg-done" style={{ height: `${(done / peak) * 100}%` }} />}
                </div>
                <b>{day.getDate()}</b>
                <small>{sameDay(day, now) ? 'วันนี้' : WEEKDAY_SHORT[day.getDay()]}</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="two-col">
        <section className="card">
          <div className="card-head">
            <div>
              <h2>แยกตามวิชา</h2>
              <p>ส่งแล้ว / งานทั้งหมดของวิชา</p>
            </div>
          </div>
          <GroupBars groups={byCourse} />
        </section>

        <section className="card">
          <div className="card-head">
            <div>
              <h2>แยกตามระบบต้นทาง</h2>
              <p>ส่งแล้ว / งานทั้งหมดจากระบบนั้น</p>
            </div>
          </div>
          <GroupBars groups={bySource} />
        </section>
      </div>

      <section className="card">
        <div className="card-head">
          <div>
            <h2>แยกตามช่วงเวลา</h2>
            <p>นับตามวันครบกำหนดของงาน</p>
          </div>
        </div>
        <div className="periods">
          {periods.map((p) => (
            <div key={p.label}>
              <span>{p.label}</span>
              <p className="stat-num">
                <b>{p.done}</b> / {p.total} งาน
              </p>
              <div className="bar" role="img" aria-label={`${p.label} ส่งแล้ว ${p.done} จาก ${p.total} งาน`}>
                <i style={{ width: `${percent(p.done, p.total)}%` }} />
              </div>
              <small>{p.total === 0 ? 'ไม่มีงานในช่วงนี้' : `ค้าง ${p.total - p.done} งาน`}</small>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
