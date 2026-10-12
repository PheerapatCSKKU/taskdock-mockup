import { useCallback, useEffect, useMemo, useState } from 'react';
import { AddTaskModal } from './components/AddTaskModal';
import { NotificationPanel } from './components/NotificationPanel';
import { Sidebar } from './components/Sidebar';
import { TaskDrawer } from './components/TaskDrawer';
import { Toasts } from './components/Toasts';
import { Topbar } from './components/Topbar';
import { CalendarPage } from './pages/CalendarPage';
import { Dashboard } from './pages/Dashboard';
import { Sources } from './pages/Sources';
import { Stats } from './pages/Stats';
import { Tasks } from './pages/Tasks';
import { StoreProvider, UiContext, type Ui } from './store';
import type { Page } from './types';

const PAGES: Page[] = ['dashboard', 'tasks', 'calendar', 'sources', 'stats'];

function pageFromHash(): Page {
  const name = window.location.hash.replace(/^#\/?/, '');
  return PAGES.includes(name as Page) ? (name as Page) : 'dashboard';
}

function Shell() {
  const [page, setPage] = useState<Page>(pageFromHash);
  const [navOpen, setNavOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [taskId, setTaskId] = useState<string | null>(null);
  const [adding, setAdding] = useState<{ date?: Date } | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    const onHash = () => setPage(pageFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const go = useCallback((next: Page) => {
    window.location.hash = `/${next}`;
    setPage(next);
    setNavOpen(false);
    window.scrollTo({ top: 0 });
  }, []);

  const ui = useMemo<Ui>(
    () => ({
      page,
      go,
      openTask: setTaskId,
      openAdd: (date) => setAdding({ date }),
      query,
      setQuery,
    }),
    [page, go, query],
  );

  return (
    <UiContext.Provider value={ui}>
      <div className="app">
        <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
        <main className="main">
          <Topbar onMenu={() => setNavOpen(true)} onBell={() => setNotifOpen(true)} />
          {page === 'dashboard' && <Dashboard />}
          {page === 'tasks' && <Tasks />}
          {page === 'calendar' && <CalendarPage />}
          {page === 'sources' && <Sources />}
          {page === 'stats' && <Stats />}
        </main>
      </div>
      {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} />}
      {taskId && <TaskDrawer taskId={taskId} onClose={() => setTaskId(null)} />}
      {adding && <AddTaskModal initialDate={adding.date} onClose={() => setAdding(null)} />}
      <Toasts />
    </UiContext.Provider>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
