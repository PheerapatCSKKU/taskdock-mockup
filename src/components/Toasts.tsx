import { CircleCheck, Info, TriangleAlert, X } from 'lucide-react';
import { useStore } from '../store';

const ICON = {
  info: <Info size={16} />,
  success: <CircleCheck size={16} />,
  warn: <TriangleAlert size={16} />,
};

export function Toasts() {
  const { toasts, dismissToast } = useStore();
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.tone}`}>
          {ICON[t.tone]}
          <span>{t.text}</span>
          <button type="button" aria-label="ปิดข้อความ" onClick={() => dismissToast(t.id)}>
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
