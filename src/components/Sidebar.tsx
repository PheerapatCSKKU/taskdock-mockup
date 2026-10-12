import { CalendarDays, ChartNoAxesColumn, ChevronsUpDown, LayoutDashboard, ListChecks, Waypoints, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useStore, useUi } from '../store';
import type { Page } from '../types';

interface NavItem {
  page: Page;
  label: string;
  icon: ReactNode;
}

const OVERVIEW: NavItem[] = [
  { page: 'dashboard', label: 'แดชบอร์ด', icon: <LayoutDashboard size={18} /> },
  { page: 'tasks', label: 'งานทั้งหมด', icon: <ListChecks size={18} /> },
  { page: 'calendar', label: 'ปฏิทิน', icon: <CalendarDays size={18} /> },
];

const MANAGE: NavItem[] = [
  { page: 'sources', label: 'แหล่งข้อมูล', icon: <Waypoints size={18} /> },
  { page: 'stats', label: 'สถิติของฉัน', icon: <ChartNoAxesColumn size={18} /> },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { tasks } = useStore();
  const { page, go } = useUi();

  const renderItem = (item: NavItem) => (
    <button
      key={item.page}
      type="button"
      className={`nav-item ${page === item.page ? 'is-active' : ''}`}
      aria-current={page === item.page ? 'page' : undefined}
      onClick={() => go(item.page)}
    >
      {item.icon}
      <span>{item.label}</span>
      {item.page === 'tasks' && <em>{tasks.length}</em>}
    </button>
  );

  return (
    <>
      {open && <div className="scrim" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'is-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">T</div>
          <div>
            <strong>taskdock</strong>
            <span>Academic Command Center</span>
          </div>
          <button type="button" className="icon-btn sidebar-close" aria-label="ปิดเมนู" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="profile">
          <div className="avatar">นศ</div>
          <div className="profile-text">
            <strong>นักศึกษา KKU</strong>
            <span>วิทยาลัยการคอมพิวเตอร์ · วิทยาการคอมพิวเตอร์</span>
          </div>
          <ChevronsUpDown size={16} />
        </div>

        <nav aria-label="เมนูหลัก">
          <p className="nav-label">ภาพรวม</p>
          {OVERVIEW.map(renderItem)}
          <p className="nav-label">จัดการ</p>
          {MANAGE.map(renderItem)}
        </nav>

        <p className="sidebar-note">
          ต้นแบบสำหรับนำเสนอ · ข้อมูลทั้งหมดเป็นข้อมูลสมมติ
          <br />
          โครงงานรายวิชา GE362785
        </p>
      </aside>
    </>
  );
}
