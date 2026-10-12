import { Braces, Link2, Link2Off, LoaderCircle, PencilLine, Plus, RefreshCw, RotateCcw, ShieldCheck, X } from 'lucide-react';
import { useState } from 'react';
import { PROVIDER_IDS } from '../../mock/types';
import { PROVIDERS } from '../api/providers';
import { Modal } from '../components/bits';
import { LinePreview } from '../components/NotificationPanel';
import { timeLabel } from '../lib/date';
import { byDue, isDueSoon } from '../lib/tasks';
import { useStore, useUi } from '../store';
import type { ProviderId } from '../types';

export function Sources() {
  const { sync, connected, syncOne, syncAll, setConnected, resetDemo, tasks, now, toast } = useStore();
  const { openAdd } = useUi();
  const [viewing, setViewing] = useState<ProviderId | null>(null);
  const [lineOn, setLineOn] = useState(true);
  const [mailOn, setMailOn] = useState(false);

  const anyLoading = PROVIDER_IDS.some((id) => sync[id].state === 'loading');
  const manualCount = tasks.filter((t) => t.source === 'manual').length;
  const connectedCount = PROVIDER_IDS.filter((id) => connected[id]).length;
  const soon = tasks.filter((t) => isDueSoon(t, now)).sort(byDue);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>แหล่งข้อมูล</h1>
          <p className="lead">
            เชื่อมต่ออยู่ {connectedCount} จาก {PROVIDER_IDS.length} ระบบ · แต่ละระบบส่งข้อมูลคนละรูปแบบ แล้วถูกแปลงเป็นรายการงานแบบเดียวกัน
          </p>
        </div>
        <div className="head-actions">
          <button type="button" className="btn" onClick={resetDemo}>
            <RotateCcw size={16} /> รีเซ็ตข้อมูลตัวอย่าง
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={anyLoading}
            onClick={() => void syncAll().then(() => toast('ซิงก์ข้อมูลจากทุกระบบแล้ว', 'success'))}
          >
            <RefreshCw size={16} className={anyLoading ? 'spin' : ''} /> ซิงก์ทั้งหมด
          </button>
        </div>
      </div>

      <p className="notice">
        <ShieldCheck size={18} />
        <span>
          <b>นี่คือการจำลองเท่านั้น</b> ต้นแบบนี้เรียก API จำลองในเครื่อง (<code>/mock-api</code>) ไม่ได้เชื่อมต่อระบบจริง ไม่มีการเข้าสู่ระบบ
          และไม่ขอรหัสผ่านของแพลตฟอร์มใด
        </span>
      </p>

      <div className="src-grid">
        {PROVIDER_IDS.map((id) => {
          const meta = PROVIDERS[id];
          const info = sync[id];
          const on = connected[id];
          const loading = info.state === 'loading';
          return (
            <article key={id} className={`src ${on ? '' : 'is-off'}`}>
              <header>
                <span className="src-logo" style={{ background: meta.soft, color: meta.color }}>
                  {meta.initials}
                </span>
                <div>
                  <h2>{meta.name}</h2>
                  <p>{meta.owner}</p>
                </div>
                <span className={`conn ${!on ? 'conn-off' : loading ? 'conn-load' : info.state === 'error' ? 'conn-err' : 'conn-on'}`}>
                  {!on ? 'ยังไม่เชื่อมต่อ' : loading ? 'กำลังซิงก์…' : info.state === 'error' ? 'ซิงก์ไม่สำเร็จ' : 'เชื่อมต่อแล้ว'}
                </span>
              </header>

              <p className="src-format">{meta.format}</p>
              <code className="endpoint">GET /mock-api{meta.endpoint}</code>

              <dl>
                <div>
                  <dt>งานที่ดึงได้</dt>
                  <dd>{on ? `${info.count} รายการ` : '–'}</dd>
                </div>
                <div>
                  <dt>ซิงก์ล่าสุด</dt>
                  <dd>{on && info.lastSync ? timeLabel(new Date(info.lastSync)) : '–'}</dd>
                </div>
                <div>
                  <dt>เวลาตอบกลับ</dt>
                  <dd>{on && info.ms !== null ? `${info.ms} ms` : '–'}</dd>
                </div>
              </dl>

              <footer>
                {on ? (
                  <>
                    <button type="button" className="btn btn-sm" disabled={loading} onClick={() => void syncOne(id)}>
                      {loading ? <LoaderCircle size={15} className="spin" /> : <RefreshCw size={15} />} ซิงก์
                    </button>
                    <button type="button" className="btn btn-sm" disabled={!info.raw} onClick={() => setViewing(id)}>
                      <Braces size={15} /> ดูข้อมูลดิบ
                    </button>
                    <button type="button" className="btn btn-sm btn-quiet" onClick={() => void setConnected(id, false)}>
                      <Link2Off size={15} /> ยกเลิก
                    </button>
                  </>
                ) : (
                  <button type="button" className="btn btn-sm btn-primary" disabled={loading} onClick={() => void setConnected(id, true)}>
                    <Link2 size={15} /> เชื่อมต่อ (จำลอง)
                  </button>
                )}
              </footer>
            </article>
          );
        })}

        <article className="src src-manual">
          <header>
            <span className="src-logo">
              <PencilLine size={18} />
            </span>
            <div>
              <h2>เพิ่มงานด้วยตนเอง</h2>
              <p>สำหรับงานนอกระบบ</p>
            </div>
          </header>
          <p className="src-format">
            ใช้กับงานที่สั่งในชั้นเรียน อีเมล หรือเว็บไซต์รายวิชาที่ไม่มีช่องทางเชื่อมต่อ ตอนนี้มี {manualCount} รายการ
          </p>
          <footer>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => openAdd()}>
              <Plus size={15} /> เพิ่มงาน
            </button>
          </footer>
        </article>
      </div>

      <section className="card notify">
        <div>
          <div className="card-head">
            <div>
              <h2>การแจ้งเตือน</h2>
              <p>สรุปงานที่ครบกำหนดภายใน 48 ชั่วโมง ส่งทุกวันเวลา 18:00 น. (จำลอง)</p>
            </div>
          </div>
          <label className="switch">
            <input type="checkbox" checked={lineOn} onChange={(e) => setLineOn(e.target.checked)} />
            <i />
            <span>
              <b>LINE Official Account</b>
              <small>ส่งข้อความสรุปงานเข้า LINE</small>
            </span>
          </label>
          <label className="switch">
            <input type="checkbox" checked={mailOn} onChange={(e) => setMailOn(e.target.checked)} />
            <i />
            <span>
              <b>อีเมล</b>
              <small>ส่งสรุปงานเข้าอีเมลมหาวิทยาลัย</small>
            </span>
          </label>
          <button
            type="button"
            className="btn"
            disabled={!lineOn && !mailOn}
            onClick={() =>
              toast(`ส่งตัวอย่างแจ้งเตือนทาง ${[lineOn && 'LINE', mailOn && 'อีเมล'].filter(Boolean).join(' และ ')} แล้ว (จำลอง)`, 'success')
            }
          >
            ส่งตัวอย่างแจ้งเตือน
          </button>
        </div>
        <LinePreview tasks={soon} now={now} />
      </section>

      {viewing && sync[viewing].raw !== null && (
        <Modal title={`ข้อมูลดิบจาก ${PROVIDERS[viewing].name}`} onClose={() => setViewing(null)} wide>
          <div className="modal-head">
            <div>
              <h2>ข้อมูลดิบจาก {PROVIDERS[viewing].name}</h2>
              <p>
                <code>GET /mock-api{PROVIDERS[viewing].endpoint}</code> · {sync[viewing].ms} ms ·{' '}
                {sync[viewing].via === 'http' ? 'ตอบจาก mock API server' : 'สร้างในเบราว์เซอร์ (ไม่มี server)'}
              </p>
            </div>
            <button type="button" className="icon-btn" aria-label="ปิด" onClick={() => setViewing(null)}>
              <X size={18} />
            </button>
          </div>
          <div className="json-cols">
            <div>
              <h3>สิ่งที่ระบบต้นทางส่งมา</h3>
              <pre>{JSON.stringify(sync[viewing].raw, null, 2)}</pre>
            </div>
            <div>
              <h3>หลังแปลงเป็นรูปแบบกลาง ({tasks.filter((t) => t.source === viewing).length} งาน)</h3>
              <pre>
                {JSON.stringify(
                  tasks
                    .filter((t) => t.source === viewing)
                    .map(({ title, courseCode, dueAt, status, priority }) => ({ title, courseCode, dueAt, status, priority })),
                  null,
                  2,
                )}
              </pre>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
