import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { PROVIDER_IDS } from '../mock/types';
import { fetchProvider } from './api/client';
import { normalize } from './api/normalize';
import { PROVIDERS } from './api/providers';
import type { NewTaskInput, Page, Priority, ProviderId, Task, TaskStatus } from './types';

export interface SyncInfo {
  state: 'idle' | 'loading' | 'ok' | 'error';
  lastSync: string | null;
  ms: number | null;
  via: 'http' | 'local' | null;
  count: number;
  raw: unknown;
}

interface Override {
  status?: TaskStatus;
  priority?: Priority;
  updatedAt: string;
}

interface Persisted {
  connected: Record<ProviderId, boolean>;
  overrides: Record<string, Override>;
  manual: Task[];
}

export interface Toast {
  id: number;
  text: string;
  tone: 'info' | 'success' | 'warn';
}

interface Store {
  now: Date;
  tasks: Task[];
  sync: Record<ProviderId, SyncInfo>;
  connected: Record<ProviderId, boolean>;
  booting: boolean;
  syncOne: (id: ProviderId) => Promise<void>;
  syncAll: () => Promise<void>;
  setConnected: (id: ProviderId, on: boolean) => Promise<void>;
  setStatus: (taskId: string, status: TaskStatus) => void;
  setPriority: (taskId: string, priority: Priority) => void;
  addTask: (input: NewTaskInput) => void;
  removeTask: (taskId: string) => void;
  resetDemo: () => void;
  toasts: Toast[];
  toast: (text: string, tone?: Toast['tone']) => void;
  dismissToast: (id: number) => void;
}

const STORAGE_KEY = 'taskdock-mockup-v1';

const forEachProvider = <T,>(make: (id: ProviderId) => T) =>
  Object.fromEntries(PROVIDER_IDS.map((id) => [id, make(id)])) as Record<ProviderId, T>;

/** สถานะเริ่มต้นของตัวอย่าง: งานที่ผู้ใช้กดเป็น "กำลังทำ" ไว้เองในระบบนี้ */
function defaults(): Persisted {
  const seededAt = new Date(Date.now() - 4 * 3_600_000).toISOString();
  return {
    connected: forEachProvider(() => true),
    overrides: {
      'ilearning:IL-2301': { status: 'doing', updatedAt: seededAt },
      'gecanvas:30551': { status: 'doing', updatedAt: seededAt },
    },
    manual: [],
  };
}

function load(): Persisted {
  try {
    const text = localStorage.getItem(STORAGE_KEY);
    if (!text) return defaults();
    const saved = JSON.parse(text) as Partial<Persisted>;
    const base = defaults();
    return {
      connected: { ...base.connected, ...saved.connected },
      overrides: saved.overrides ?? base.overrides,
      manual: saved.manual ?? [],
    };
  } catch {
    return defaults();
  }
}

const emptySync = (): SyncInfo => ({ state: 'idle', lastSync: null, ms: null, via: null, count: 0, raw: null });

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [persisted, setPersisted] = useState<Persisted>(load);
  const [remote, setRemote] = useState<Record<ProviderId, Task[]>>(() => forEachProvider(() => []));
  const [sync, setSync] = useState<Record<ProviderId, SyncInfo>>(() => forEachProvider(emptySync));
  const [now, setNow] = useState(() => new Date());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [booting, setBooting] = useState(true);
  const toastId = useRef(0);
  const booted = useRef(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
    } catch {
      // เก็บไม่ได้ก็ยังใช้งานต่อได้ เพียงแต่ค่าจะไม่อยู่หลังรีเฟรช
    }
  }, [persisted]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const dismissToast = useCallback((id: number) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const toast = useCallback(
    (text: string, tone: Toast['tone'] = 'info') => {
      const id = ++toastId.current;
      setToasts((list) => [...list.slice(-3), { id, text, tone }]);
      setTimeout(() => dismissToast(id), 4000);
    },
    [dismissToast],
  );

  const syncOne = useCallback(async (id: ProviderId) => {
    setSync((s) => ({ ...s, [id]: { ...s[id], state: 'loading' } }));
    try {
      const result = await fetchProvider(id);
      const tasks = normalize(id, result.payload);
      setRemote((r) => ({ ...r, [id]: tasks }));
      setSync((s) => ({
        ...s,
        [id]: {
          state: 'ok',
          lastSync: new Date().toISOString(),
          ms: result.ms,
          via: result.via,
          count: tasks.length,
          raw: result.payload,
        },
      }));
    } catch {
      setSync((s) => ({ ...s, [id]: { ...s[id], state: 'error' } }));
    }
  }, []);

  const connected = persisted.connected;

  const syncAll = useCallback(async () => {
    await Promise.all(PROVIDER_IDS.filter((id) => connected[id]).map(syncOne));
    setNow(new Date());
  }, [connected, syncOne]);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    void syncAll().then(() => setBooting(false));
  }, [syncAll]);

  const setConnected = useCallback(
    async (id: ProviderId, on: boolean) => {
      setPersisted((p) => ({ ...p, connected: { ...p.connected, [id]: on } }));
      if (on) {
        await syncOne(id);
        toast(`เชื่อมต่อ ${PROVIDERS[id].name} แล้ว (จำลอง)`, 'success');
      } else {
        setRemote((r) => ({ ...r, [id]: [] }));
        setSync((s) => ({ ...s, [id]: emptySync() }));
        toast(`ยกเลิกการเชื่อมต่อ ${PROVIDERS[id].name} แล้ว`);
      }
    },
    [syncOne, toast],
  );

  const patch = useCallback((taskId: string, change: Partial<Pick<Task, 'status' | 'priority'>>) => {
    const updatedAt = new Date().toISOString();
    setPersisted((p) =>
      taskId.startsWith('manual:')
        ? { ...p, manual: p.manual.map((t) => (t.id === taskId ? { ...t, ...change, updatedAt } : t)) }
        : { ...p, overrides: { ...p.overrides, [taskId]: { ...p.overrides[taskId], ...change, updatedAt } } },
    );
  }, []);

  const setStatus = useCallback((taskId: string, status: TaskStatus) => patch(taskId, { status }), [patch]);
  const setPriority = useCallback((taskId: string, priority: Priority) => patch(taskId, { priority }), [patch]);

  const addTask = useCallback(
    (input: NewTaskInput) => {
      const task: Task = {
        ...input,
        id: `manual:${Date.now()}`,
        source: 'manual',
        kind: 'assignment',
        status: 'todo',
        points: null,
        updatedAt: new Date().toISOString(),
      };
      setPersisted((p) => ({ ...p, manual: [...p.manual, task] }));
      toast(`เพิ่มงาน "${input.title}" แล้ว`, 'success');
    },
    [toast],
  );

  const removeTask = useCallback(
    (taskId: string) => {
      setPersisted((p) => ({ ...p, manual: p.manual.filter((t) => t.id !== taskId) }));
      toast('ลบงานแล้ว');
    },
    [toast],
  );

  const resetDemo = useCallback(() => {
    const base = defaults();
    setPersisted(base);
    void Promise.all(PROVIDER_IDS.map(syncOne));
    toast('รีเซ็ตข้อมูลตัวอย่างแล้ว', 'success');
  }, [syncOne, toast]);

  const tasks = useMemo(() => {
    const list: Task[] = [];
    for (const id of PROVIDER_IDS) if (connected[id]) list.push(...remote[id]);
    list.push(...persisted.manual);
    return list.map((t) => {
      const override = persisted.overrides[t.id];
      return override ? { ...t, ...override } : t;
    });
  }, [connected, remote, persisted.manual, persisted.overrides]);

  const value: Store = {
    now,
    tasks,
    sync,
    connected,
    booting,
    syncOne,
    syncAll,
    setConnected,
    setStatus,
    setPriority,
    addTask,
    removeTask,
    resetDemo,
    toasts,
    toast,
    dismissToast,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore ต้องใช้ภายใน StoreProvider');
  return store;
}

/** การนำทางและหน้าต่างที่ใช้ร่วมกันทั้งแอป */
export interface Ui {
  page: Page;
  go: (page: Page) => void;
  openTask: (taskId: string) => void;
  openAdd: (date?: Date) => void;
  query: string;
  setQuery: (query: string) => void;
}

export const UiContext = createContext<Ui | null>(null);

export function useUi(): Ui {
  const ui = useContext(UiContext);
  if (!ui) throw new Error('useUi ต้องใช้ภายใน UiContext');
  return ui;
}
