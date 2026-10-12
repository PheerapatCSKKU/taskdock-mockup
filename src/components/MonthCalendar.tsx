import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { dateKey, monthGrid, monthTitle, sameDay, weekOfMonth, WEEKDAY_SHORT } from '../lib/date';
import { useStore } from '../store';

/** ปฏิทินเดือนขนาดเล็ก: วันนี้เป็นวงกลมสีหลัก วันที่มีงานค้างครบกำหนดมีจุดกำกับ */
export function MonthCalendar({ selected, onSelect }: { selected?: Date | null; onSelect?: (day: Date) => void }) {
  const { now, tasks } = useStore();
  const [month, setMonth] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));

  const pending = useMemo(() => {
    const days = new Set<string>();
    for (const t of tasks) if (t.status !== 'done') days.add(dateKey(new Date(t.dueAt)));
    return days;
  }, [tasks]);

  const shift = (step: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + step, 1));
  const inThisMonth = month.getMonth() === now.getMonth() && month.getFullYear() === now.getFullYear();

  return (
    <div className="mcal">
      <div className="mcal-head">
        <div>
          <h3>{monthTitle(month)}</h3>
          <p>{inThisMonth ? `สัปดาห์ที่ ${weekOfMonth(now)}` : 'กดวันที่เพื่อดูงาน'}</p>
        </div>
        <div className="mcal-nav">
          <button type="button" className="icon-btn sm" aria-label="เดือนก่อนหน้า" onClick={() => shift(-1)}>
            <ChevronLeft size={16} />
          </button>
          <button type="button" className="icon-btn sm" aria-label="เดือนถัดไป" onClick={() => shift(1)}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div className="mcal-grid">
        {WEEKDAY_SHORT.map((day) => (
          <span key={day} className="mcal-wd">
            {day}
          </span>
        ))}
        {monthGrid(month).map((day) => {
          const classes = ['mcal-day'];
          if (day.getMonth() !== month.getMonth()) classes.push('is-out');
          if (sameDay(day, now)) classes.push('is-today');
          if (pending.has(dateKey(day))) classes.push('has-due');
          if (selected && sameDay(day, selected)) classes.push('is-selected');
          return (
            <button key={dateKey(day)} type="button" className={classes.join(' ')} onClick={() => onSelect?.(day)}>
              {day.getDate()}
            </button>
          );
        })}
      </div>
      <div className="mcal-legend">
        <span>
          <i className="lg-today" /> วันนี้
        </span>
        <span>
          <i className="lg-due" /> มีงานครบกำหนด
        </span>
      </div>
    </div>
  );
}
