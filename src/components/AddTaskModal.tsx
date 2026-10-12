import { X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { COURSES } from '../../mock/data';
import { addDays, toDateInput } from '../lib/date';
import { PRIORITY_LABEL } from '../lib/tasks';
import { useStore } from '../store';
import type { Priority } from '../types';
import { Modal } from './bits';

const COURSE_LIST = Object.values(COURSES);
const OTHER = '__other__';

export function AddTaskModal({ initialDate, onClose }: { initialDate?: Date; onClose: () => void }) {
  const { addTask, now } = useStore();
  const [title, setTitle] = useState('');
  const [course, setCourse] = useState<string>(COURSE_LIST[0].code);
  const [otherCourse, setOtherCourse] = useState('');
  const [date, setDate] = useState(() => toDateInput(initialDate ?? addDays(now, 3)));
  const [time, setTime] = useState('23:59');
  const [priority, setPriority] = useState<Priority>('medium');
  const [url, setUrl] = useState('');
  const [detail, setDetail] = useState('');
  const [error, setError] = useState('');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return setError('กรอกชื่องานก่อนบันทึก');
    if (course === OTHER && !otherCourse.trim()) return setError('กรอกชื่อวิชาก่อนบันทึก');
    if (!date || !time) return setError('เลือกวันและเวลาครบกำหนด');
    const [y, mo, d] = date.split('-').map(Number);
    const [h, mi] = time.split(':').map(Number);
    const picked = COURSE_LIST.find((c) => c.code === course);
    addTask({
      title: title.trim(),
      detail: detail.trim(),
      courseCode: picked ? picked.code : 'อื่น ๆ',
      courseName: picked ? picked.name : otherCourse.trim(),
      dueAt: new Date(y, mo - 1, d, h, mi).toISOString(),
      priority,
      url: url.trim(),
    });
    onClose();
  };

  return (
    <Modal title="เพิ่มงาน" onClose={onClose}>
      <form className="form" onSubmit={submit} onChange={() => setError('')} noValidate>
        <div className="modal-head">
          <div>
            <h2>เพิ่มงานด้วยตนเอง</h2>
            <p>สำหรับงานที่สั่งนอกระบบ เช่น ในชั้นเรียน อีเมล หรือเว็บไซต์รายวิชา</p>
          </div>
          <button type="button" className="icon-btn" aria-label="ปิด" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <label>
          ชื่องาน
          <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="เช่น รายงานสรุปบทที่ 5" />
        </label>

        <label>
          วิชา
          <select value={course} onChange={(e) => setCourse(e.target.value)}>
            {COURSE_LIST.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} {c.name}
              </option>
            ))}
            <option value={OTHER}>วิชาอื่น (พิมพ์เอง)</option>
          </select>
        </label>
        {course === OTHER && (
          <label>
            ชื่อวิชา
            <input value={otherCourse} onChange={(e) => setOtherCourse(e.target.value)} placeholder="เช่น ภาษาอังกฤษเพื่อการสื่อสาร" />
          </label>
        )}

        <div className="form-row">
          <label>
            วันครบกำหนด
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label>
            เวลา
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </label>
          <label>
            ความสำคัญ
            <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              {(['high', 'medium', 'low'] as Priority[]).map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABEL[p]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label>
          ลิงก์ต้นทาง (ไม่บังคับ)
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" inputMode="url" />
        </label>

        <label>
          รายละเอียด (ไม่บังคับ)
          <textarea rows={3} value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="สิ่งที่ต้องส่ง รูปแบบไฟล์ หรือหมายเหตุ" />
        </label>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            ยกเลิก
          </button>
          <button type="submit" className="btn btn-primary">
            บันทึกงาน
          </button>
        </div>
      </form>
    </Modal>
  );
}
