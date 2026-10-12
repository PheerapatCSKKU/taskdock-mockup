const WEEKDAY = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
export const WEEKDAY_SHORT = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
const MONTH = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];
const MONTH_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

const DAY_MS = 86_400_000;
const pad = (n: number) => String(n).padStart(2, '0');

export const beYear = (d: Date) => d.getFullYear() + 543;
export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const sameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime();
export const dayDiff = (a: Date, b: Date) => Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / DAY_MS);
export const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const fullDate = (d: Date) => `วัน${WEEKDAY[d.getDay()]}ที่ ${d.getDate()} ${MONTH[d.getMonth()]} ${beYear(d)}`;
export const monthTitle = (d: Date) => `${MONTH[d.getMonth()]} ${beYear(d)}`;
export const shortDate = (d: Date) => `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
export const timeLabel = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())} น.`;

/** เช่น "พรุ่งนี้ · 23:59 น." หรือ "ศุกร์ 19 ก.ย. · 17:00 น." */
export function dueLabel(due: Date, now: Date): string {
  const diff = dayDiff(due, now);
  const day =
    diff === 0
      ? 'วันนี้'
      : diff === 1
        ? 'พรุ่งนี้'
        : diff === -1
          ? 'เมื่อวาน'
          : `${WEEKDAY[due.getDay()]} ${shortDate(due)}`;
  return `${day} · ${timeLabel(due)}`;
}

/** เช่น "อีก 5 ชม." หรือ "เลยมา 2 วัน" */
export function remainingLabel(due: Date, now: Date): string {
  const ms = due.getTime() - now.getTime();
  const abs = Math.abs(ms);
  const amount =
    abs < 3_600_000
      ? `${Math.max(1, Math.round(abs / 60_000))} นาที`
      : abs < DAY_MS
        ? `${Math.floor(abs / 3_600_000)} ชม.`
        : `${Math.floor(abs / DAY_MS)} วัน`;
  return ms >= 0 ? `อีก ${amount}` : `เลยมา ${amount}`;
}

export function relativeTime(iso: string, now: Date): string {
  const ms = now.getTime() - new Date(iso).getTime();
  if (ms < 60_000) return 'เมื่อสักครู่';
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)} นาทีที่แล้ว`;
  if (ms < DAY_MS) return `${Math.round(ms / 3_600_000)} ชม. ที่แล้ว`;
  return `${Math.round(ms / DAY_MS)} วันที่แล้ว`;
}

/** วันทั้งหมดในตารางเดือน (เริ่มวันอาทิตย์ เติมวันของเดือนข้างเคียงให้เต็มสัปดาห์) */
export function monthGrid(month: Date): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Math.ceil((first.getDay() + daysInMonth) / 7) * 7;
  return Array.from({ length: cells }, (_, i) => addDays(first, i - first.getDay()));
}

export const weekOfMonth = (d: Date) => Math.ceil((d.getDate() + new Date(d.getFullYear(), d.getMonth(), 1).getDay()) / 7);

export function semesterLabel(d: Date): string {
  const m = d.getMonth() + 1;
  const be = beYear(d);
  if (m >= 6 && m <= 10) return `ภาคการศึกษาที่ 1/${be}`;
  if (m >= 11) return `ภาคการศึกษาที่ 2/${be}`;
  if (m <= 3) return `ภาคการศึกษาที่ 2/${be - 1}`;
  return `ภาคการศึกษาฤดูร้อน/${be - 1}`;
}

/** ค่าเริ่มต้นสำหรับ <input type="date"> และ <input type="time"> */
export const toDateInput = (d: Date) => dateKey(d);
export const toTimeInput = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
