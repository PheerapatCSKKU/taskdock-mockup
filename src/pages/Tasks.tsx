import { Search, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { PROVIDER_IDS } from '../../mock/types';
import { sourceMeta } from '../api/providers';
import { DoneCheck, PriorityMark, SourceTag, StateChip } from '../components/bits';
import { KanbanBoard } from '../components/KanbanBoard';
import { dueLabel, remainingLabel } from '../lib/date';
import { byDue, byPriority, isOverdue, PRIORITY_LABEL, STATUS_LABEL } from '../lib/tasks';
import { useStore, useUi } from '../store';
import type { Priority, SourceId, TaskStatus } from '../types';

type StatusFilter = 'all' | TaskStatus | 'overdue';
type Sort = 'due' | 'priority';

const SOURCES: SourceId[] = [...PROVIDER_IDS, 'manual'];

export function Tasks() {
  const { tasks, now, setStatus, booting } = useStore();
  const { openTask, query, setQuery } = useUi();
  const [course, setCourse] = useState('all');
  const [status, setStatus_] = useState<StatusFilter>('all');
  const [priority, setPriority] = useState<'all' | Priority>('all');
  const [source, setSource] = useState<'all' | SourceId>('all');
  const [sort, setSort] = useState<Sort>('due');
  const [view, setView] = useState<'table' | 'board'>('table');
  const resultRef = useRef<HTMLSpanElement>(null);

  const courses = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of tasks) map.set(t.courseCode, t.courseName);
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [tasks]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return tasks
      .filter((t) => {
        if (course !== 'all' && t.courseCode !== course) return false;
        if (status === 'overdue' ? !isOverdue(t, now) : status !== 'all' && t.status !== status) return false;
        if (priority !== 'all' && t.priority !== priority) return false;
        if (source !== 'all' && t.source !== source) return false;
        if (!needle) return true;
        const haystack = `${t.title} ${t.courseCode} ${t.courseName} ${sourceMeta(t.source).name}`.toLowerCase();
        return haystack.includes(needle);
      })
      .sort(sort === 'due' ? byDue : byPriority);
  }, [tasks, query, course, status, priority, source, sort, now]);

  const filtering = query !== '' || course !== 'all' || status !== 'all' || priority !== 'all' || source !== 'all';
  const clear = () => {
    setQuery('');
    setCourse('all');
    setStatus_('all');
    setPriority('all');
    setSource('all');
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>งานทั้งหมด</h1>
          <p className="lead">รวมงานจากทุกระบบ ดูเป็นตารางหรือกระดาน และเปลี่ยนสถานะได้ในที่เดียว</p>
        </div>
      </div>

      <section className="card">
        <div className="filters">
          <label className="search">
            <Search size={16} />
            <input
              type="search"
              placeholder="ค้นหาชื่องาน วิชา หรือระบบ"
              aria-label="ค้นหางาน"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <select aria-label="กรองตามวิชา" value={course} onChange={(e) => setCourse(e.target.value)}>
            <option value="all">ทุกวิชา</option>
            {courses.map(([code, name]) => (
              <option key={code} value={code}>
                {code} {name}
              </option>
            ))}
          </select>
          <select aria-label="กรองตามสถานะ" value={status} onChange={(e) => setStatus_(e.target.value as StatusFilter)}>
            <option value="all">ทุกสถานะ</option>
            <option value="todo">{STATUS_LABEL.todo}</option>
            <option value="doing">{STATUS_LABEL.doing}</option>
            <option value="done">{STATUS_LABEL.done}</option>
            <option value="overdue">เลยกำหนด</option>
          </select>
          <select aria-label="กรองตามความสำคัญ" value={priority} onChange={(e) => setPriority(e.target.value as 'all' | Priority)}>
            <option value="all">ทุกความสำคัญ</option>
            <option value="high">ความสำคัญ{PRIORITY_LABEL.high}</option>
            <option value="medium">ความสำคัญ{PRIORITY_LABEL.medium}</option>
            <option value="low">ความสำคัญ{PRIORITY_LABEL.low}</option>
          </select>
          <select aria-label="กรองตามระบบต้นทาง" value={source} onChange={(e) => setSource(e.target.value as 'all' | SourceId)}>
            <option value="all">ทุกระบบ</option>
            {SOURCES.map((id) => (
              <option key={id} value={id}>
                {sourceMeta(id).name}
              </option>
            ))}
          </select>
          <select aria-label="เรียงลำดับ" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="due">เรียงตามวันครบกำหนด</option>
            <option value="priority">เรียงตามความสำคัญ</option>
          </select>
        </div>

        <div className="result-line">
          <span ref={resultRef} tabIndex={-1}>
            แสดง {filtered.length} จาก {tasks.length} รายการ
          </span>
          {filtering && (
            <button type="button" className="link" onClick={clear}>
              <X size={14} /> ล้างตัวกรอง
            </button>
          )}
        </div>

        <div className="task-view-toggle segmented" role="group" aria-label="รูปแบบการแสดงงาน">
          <button type="button" className={view === 'table' ? 'is-on' : ''} aria-pressed={view === 'table'} onClick={() => setView('table')}>ตาราง</button>
          <button type="button" className={view === 'board' ? 'is-on' : ''} aria-pressed={view === 'board'} onClick={() => setView('board')}>กระดาน</button>
        </div>

        {view === 'board' ? <KanbanBoard tasks={filtered} resultRef={resultRef} /> : <div className="table-wrap">
          <table className="ttable">
            <thead>
              <tr>
                <th aria-label="ส่งแล้ว" />
                <th>งาน</th>
                <th>วิชา</th>
                <th>แหล่งที่มา</th>
                <th>วันครบกำหนด</th>
                <th>ความสำคัญ</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const due = new Date(t.dueAt);
                return (
                  <tr key={t.id} className={t.status === 'done' ? 'is-done' : ''} onClick={() => openTask(t.id)}>
                    <td>
                      <DoneCheck task={t} />
                    </td>
                    <td>
                      <button type="button" className="cell-title" onClick={() => openTask(t.id)}>
                        {t.title}
                      </button>
                      <StateChip task={t} />
                    </td>
                    <td>
                      <b className="mono">{t.courseCode}</b>
                      <small>{t.courseName}</small>
                    </td>
                    <td>
                      <SourceTag source={t.source} />
                    </td>
                    <td>
                      {dueLabel(due, now)}
                      <small className={isOverdue(t, now) ? 'is-late' : ''}>
                        {t.status === 'done' ? 'ส่งแล้ว' : remainingLabel(due, now)}
                      </small>
                    </td>
                    <td>
                      <PriorityMark priority={t.priority} />
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <select
                        className={`status-select st-${t.status}`}
                        aria-label={`สถานะของ ${t.title}`}
                        value={t.status}
                        onChange={(e) => setStatus(t.id, e.target.value as TaskStatus)}
                      >
                        <option value="todo">{STATUS_LABEL.todo}</option>
                        <option value="doing">{STATUS_LABEL.doing}</option>
                        <option value="done">{STATUS_LABEL.done}</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="empty">{booting ? 'กำลังดึงงานจากทุกระบบ…' : 'ไม่พบงานที่ตรงกับเงื่อนไข ลองล้างตัวกรองหรือค้นหาด้วยคำอื่น'}</p>
          )}
        </div>}
        {view === 'board' && filtered.length === 0 && <p className="empty">{booting ? 'กำลังดึงงานจากทุกระบบ…' : 'ไม่พบงานที่ตรงกับเงื่อนไข ลองล้างตัวกรองหรือค้นหาด้วยคำอื่น'}</p>}
      </section>
    </div>
  );
}
