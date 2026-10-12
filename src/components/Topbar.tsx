import { Bell, ChevronRight, Menu, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { semesterLabel } from '../lib/date';
import { isDueSoon, isOverdue } from '../lib/tasks';
import { useStore, useUi } from '../store';
import type { Page } from '../types';

const PAGE_TITLE: Record<Page, string> = {
  dashboard: 'ภาพรวมของฉัน',
  tasks: 'งานทั้งหมด',
  calendar: 'ปฏิทิน',
  sources: 'แหล่งข้อมูล',
  stats: 'สถิติของฉัน',
};

export function Topbar({ onMenu, onBell }: { onMenu: () => void; onBell: () => void }) {
  const { now, tasks } = useStore();
  const { page, go, openAdd, query, setQuery } = useUi();
  const [searching, setSearching] = useState(false);
  const alerts = tasks.filter((t) => isDueSoon(t, now) || isOverdue(t, now)).length;

  return (
    <header className="topbar">
      <button type="button" className="icon-btn menu-btn" aria-label="เปิดเมนู" onClick={onMenu}>
        <Menu size={18} />
      </button>
      <div className="crumbs">
        <span>{semesterLabel(now)}</span>
        <ChevronRight size={14} />
        <b>{PAGE_TITLE[page]}</b>
      </div>
      <div className="topbar-actions">
        {searching ? (
          <form
            className="search-inline"
            onSubmit={(event) => {
              event.preventDefault();
              go('tasks');
            }}
          >
            <Search size={16} />
            <input
              autoFocus
              type="search"
              placeholder="ค้นหางาน วิชา หรือระบบ…"
              aria-label="ค้นหางาน"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                if (page !== 'tasks') go('tasks');
              }}
              onBlur={() => !query && setSearching(false)}
            />
          </form>
        ) : (
          <button type="button" className="icon-btn" aria-label="ค้นหา" onClick={() => setSearching(true)}>
            <Search size={18} />
          </button>
        )}
        <button type="button" className="icon-btn" aria-label={`การแจ้งเตือน ${alerts} รายการ`} onClick={onBell}>
          <Bell size={18} />
          {alerts > 0 && <i className="dot" />}
        </button>
        <button type="button" className="btn btn-primary" onClick={() => openAdd()}>
          <Plus size={18} />
          <span>เพิ่มงาน</span>
        </button>
      </div>
    </header>
  );
}
