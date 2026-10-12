// ข้อมูลสมมติทั้งหมด — กำหนดส่งคำนวณจากวันที่ปัจจุบัน เพื่อให้ mockup ดูสมจริงทุกครั้งที่เปิด
import type {
  CanvasResponse,
  CiscoResponse,
  ClassroomResponse,
  ILearningResponse,
  KkuExamResponse,
  MoodleAssignmentsResponse,
  ProviderId,
  RawPayloadMap,
} from './types.ts';

export const COURSES = {
  db: { code: 'CP352001', name: 'ระบบฐานข้อมูล' },
  net: { code: 'CP353002', name: 'เครือข่ายคอมพิวเตอร์' },
  hci: { code: 'CP351003', name: 'ปฏิสัมพันธ์ระหว่างมนุษย์กับคอมพิวเตอร์' },
  se: { code: 'CP354004', name: 'วิศวกรรมซอฟต์แวร์' },
  ge: { code: 'GE362785', name: 'การคิดเชิงสร้างสรรค์และการแก้ปัญหา' },
} as const;

/** เวลาตอบกลับจำลองของแต่ละระบบ (มิลลิวินาที) */
export const MOCK_LATENCY: Record<ProviderId, number> = {
  elearning: 620,
  ilearning: 940,
  classroom: 380,
  kkuexam: 760,
  gecanvas: 520,
  cisco: 1150,
};

const HOST = 'https://mock.taskdock.local';

const pad = (n: number) => String(n).padStart(2, '0');

/** วันที่ = วันนี้ + dayOffset ตามเวลาท้องถิ่น ที่เวลา HH:MM */
function at(now: Date, dayOffset: number, time: string): Date {
  const [h, m] = time.split(':').map(Number);
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset, h, m, 0, 0);
}

const hoursAgo = (now: Date, h: number) => new Date(now.getTime() - h * 3_600_000);
const unix = (d: Date) => Math.floor(d.getTime() / 1000);
const localString = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;

function elearning(now: Date): MoodleAssignmentsResponse {
  return {
    courses: [
      {
        id: 4182,
        shortname: COURSES.db.code,
        fullname: `${COURSES.db.code} ${COURSES.db.name}`,
        assignments: [
          {
            id: 90121,
            cmid: 551201,
            name: 'ออกแบบฐานข้อมูลระบบ (ER Diagram)',
            intro:
              '<p>ออกแบบ ER Diagram ของระบบยืม–คืนหนังสือห้องสมุด พร้อมอธิบายความสัมพันธ์ของแต่ละเอนทิตี</p><p>ส่งเป็นไฟล์ PDF 1 ไฟล์</p>',
            duedate: unix(at(now, 1, '23:59')),
            grade: 20,
            timemodified: unix(hoursAgo(now, 5)),
            submissionstatus: 'new',
          },
          {
            id: 90107,
            cmid: 551164,
            name: 'แบบฝึกหัด SQL ชุดที่ 3',
            intro: '<p>เขียนคำสั่ง SQL แบบ JOIN และ GROUP BY ตามโจทย์ 10 ข้อ</p>',
            duedate: unix(at(now, -3, '23:59')),
            grade: 10,
            timemodified: unix(hoursAgo(now, 80)),
            submissionstatus: 'submitted',
          },
          {
            id: 90133,
            cmid: 551247,
            name: 'รายงานการทำ Normalization',
            intro: '<p>ปรับตารางตัวอย่างให้อยู่ในรูป 3NF พร้อมอธิบายแต่ละขั้นตอน ความยาวไม่เกิน 5 หน้า</p>',
            duedate: unix(at(now, 9, '23:59')),
            grade: 15,
            timemodified: unix(hoursAgo(now, 30)),
            submissionstatus: 'new',
          },
        ],
      },
    ],
    warnings: [],
  };
}

function ilearning(now: Date): ILearningResponse {
  return {
    status: 'success',
    semester: '1/2569',
    data: [
      {
        task_id: 'IL-2301',
        subject_code: COURSES.hci.code,
        subject_name: COURSES.hci.name,
        title: 'อ่านบทความ HCI และสรุป 1 หน้า',
        description: 'อ่านบทความเรื่อง Usability Heuristics แล้วสรุปประเด็นสำคัญ 1 หน้า A4 ด้วยภาษาของตนเอง',
        deadline: localString(at(now, 0, '23:59')),
        score_full: 10,
        is_group_work: false,
        is_submitted: false,
        updated_at: localString(hoursAgo(now, 2)),
        link: `${HOST}/ilearning/course/${COURSES.hci.code}/task/IL-2301`,
      },
      {
        task_id: 'IL-2302',
        subject_code: COURSES.hci.code,
        subject_name: COURSES.hci.name,
        title: 'งานกลุ่ม: แผนทดสอบ Usability',
        description: 'จัดทำแผนทดสอบการใช้งานของต้นแบบแอป ระบุผู้ทดสอบ 5 คน งานที่ให้ทำ และเกณฑ์วัดผล',
        deadline: localString(at(now, 6, '23:59')),
        score_full: 20,
        is_group_work: true,
        is_submitted: false,
        updated_at: localString(hoursAgo(now, 26)),
        link: `${HOST}/ilearning/course/${COURSES.hci.code}/task/IL-2302`,
      },
    ],
  };
}

function classroom(now: Date): ClassroomResponse {
  const utcParts = (d: Date) => ({
    dueDate: { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() },
    dueTime: { hours: d.getUTCHours(), minutes: d.getUTCMinutes() },
  });
  const courseId = '718203945611';
  return {
    courses: [{ id: courseId, name: `${COURSES.se.code} ${COURSES.se.name}`, section: 'Sec 1' }],
    courseWork: [
      {
        courseId,
        id: 'cw-201',
        title: 'Sprint Backlog ครั้งที่ 2',
        description: 'จัดทำ Sprint Backlog ของทีม ระบุ User Story ผู้รับผิดชอบ และประมาณเวลาแต่ละงาน',
        state: 'PUBLISHED',
        workType: 'ASSIGNMENT',
        alternateLink: `${HOST}/classroom/c/${courseId}/a/cw-201`,
        maxPoints: 15,
        ...utcParts(at(now, 4, '18:00')),
        updateTime: hoursAgo(now, 9).toISOString(),
      },
      {
        courseId,
        id: 'cw-198',
        title: 'สไลด์นำเสนอ Requirement',
        description: 'เตรียมสไลด์นำเสนอความต้องการของระบบ ไม่เกิน 8 หน้า สำหรับนำเสนอในชั้นเรียน',
        state: 'PUBLISHED',
        workType: 'ASSIGNMENT',
        alternateLink: `${HOST}/classroom/c/${courseId}/a/cw-198`,
        maxPoints: 10,
        ...utcParts(at(now, -1, '09:00')),
        updateTime: hoursAgo(now, 50).toISOString(),
      },
      {
        courseId,
        id: 'cw-190',
        title: 'บันทึกผล Code Review',
        description: 'สรุปข้อเสนอแนะที่ได้รับจากการ Review โค้ดของเพื่อนในทีม และสิ่งที่แก้ไขแล้ว',
        state: 'PUBLISHED',
        workType: 'ASSIGNMENT',
        alternateLink: `${HOST}/classroom/c/${courseId}/a/cw-190`,
        maxPoints: 5,
        ...utcParts(at(now, -6, '23:59')),
        updateTime: hoursAgo(now, 150).toISOString(),
      },
    ],
    studentSubmissions: [
      { courseWorkId: 'cw-201', state: 'CREATED' },
      { courseWorkId: 'cw-198', state: 'NEW' },
      { courseWorkId: 'cw-190', state: 'TURNED_IN' },
    ],
  };
}

function kkuexam(now: Date): KkuExamResponse {
  return {
    result: {
      exams: [
        {
          examId: 7712,
          courseCode: COURSES.db.code,
          courseTitle: COURSES.db.name,
          examName: 'สอบย่อยครั้งที่ 2: SQL และ Normalization',
          instruction: 'ข้อสอบปรนัย 20 ข้อ ทำได้ 1 ครั้ง ระบบปิดรับคำตอบตามเวลาที่กำหนด',
          openAt: at(now, 3, '09:00').toISOString(),
          closeAt: at(now, 3, '12:00').toISOString(),
          durationMinutes: 45,
          attemptStatus: 'not_started',
          examUrl: `${HOST}/kkuexam/exam/7712`,
        },
        {
          examId: 7698,
          courseCode: COURSES.hci.code,
          courseTitle: COURSES.hci.name,
          examName: 'Quiz บทที่ 4: หลักการออกแบบ',
          instruction: 'ข้อสอบปรนัย 10 ข้อ ใช้เวลา 15 นาที',
          openAt: at(now, -2, '08:00').toISOString(),
          closeAt: at(now, -2, '20:00').toISOString(),
          durationMinutes: 15,
          attemptStatus: 'finished',
          examUrl: `${HOST}/kkuexam/exam/7698`,
        },
      ],
    },
  };
}

function gecanvas(now: Date): CanvasResponse {
  const courseId = 2785;
  return {
    courses: [{ id: courseId, course_code: COURSES.ge.code, name: COURSES.ge.name }],
    assignments: [
      {
        id: 30551,
        course_id: courseId,
        name: 'ข้อเสนอโครงงานกลุ่ม (Proposal)',
        description: 'ส่งเอกสารข้อเสนอโครงงานของกลุ่มย่อย ครบทุกหัวข้อตามแบบฟอร์มของรายวิชา',
        due_at: at(now, 5, '23:59').toISOString(),
        points_possible: 30,
        html_url: `${HOST}/gecanvas/courses/${courseId}/assignments/30551`,
        updated_at: hoursAgo(now, 14).toISOString(),
        submission: { workflow_state: 'unsubmitted', submitted_at: null },
      },
      {
        id: 30540,
        course_id: courseId,
        name: 'ใบกิจกรรม 4.1.1 ค้นหาหัวข้อโครงงาน',
        description: 'เลือกปัญหาจริงและสรุปเป็นหัวข้อโครงงานรายบุคคล พร้อมแหล่งอ้างอิง',
        due_at: at(now, -8, '23:59').toISOString(),
        points_possible: 10,
        html_url: `${HOST}/gecanvas/courses/${courseId}/assignments/30540`,
        updated_at: hoursAgo(now, 200).toISOString(),
        submission: { workflow_state: 'graded', submitted_at: at(now, -9, '21:10').toISOString() },
      },
      {
        id: 30562,
        course_id: courseId,
        name: 'สไลด์นำเสนอข้อเสนอโครงงาน',
        description: 'เตรียมสื่อนำเสนอข้อเสนอโครงงาน ใช้เวลานำเสนอกลุ่มละ 10 นาที',
        due_at: at(now, 12, '13:00').toISOString(),
        points_possible: 20,
        html_url: `${HOST}/gecanvas/courses/${courseId}/assignments/30562`,
        updated_at: hoursAgo(now, 40).toISOString(),
        submission: { workflow_state: 'unsubmitted', submitted_at: null },
      },
    ],
  };
}

function cisco(now: Date): CiscoResponse {
  const courseName = `${COURSES.net.code} ${COURSES.net.name}`;
  return {
    learner: { academy: 'Mock Networking Academy' },
    items: [
      {
        uuid: 'a41f-lab-0502',
        courseName,
        moduleTitle: 'Network Configuration Lab',
        summary: 'ตั้งค่า Router และ Switch ตามโทโพโลยีที่กำหนด แล้วทดสอบการเชื่อมต่อระหว่างเครือข่าย',
        activityType: 'lab',
        dueDateTime: at(now, 1, '17:00').toISOString(),
        completionPercent: 40,
        lastActivityAt: hoursAgo(now, 3).toISOString(),
        launchUrl: `${HOST}/cisco/launch/a41f-lab-0502`,
      },
      {
        uuid: 'a41f-exam-05',
        courseName,
        moduleTitle: 'Module 5 Exam: Network Access',
        summary: 'แบบทดสอบท้ายโมดูล 5 จำนวน 25 ข้อ',
        activityType: 'exam',
        dueDateTime: at(now, 7, '23:59').toISOString(),
        completionPercent: 0,
        lastActivityAt: hoursAgo(now, 60).toISOString(),
        launchUrl: `${HOST}/cisco/launch/a41f-exam-05`,
      },
      {
        uuid: 'a41f-pt-0432',
        courseName,
        moduleTitle: 'Packet Tracer 4.3.2: VLAN',
        summary: 'จำลองการแบ่ง VLAN ด้วย Packet Tracer และบันทึกผลการทดสอบ',
        activityType: 'packet_tracer',
        dueDateTime: at(now, -4, '23:59').toISOString(),
        completionPercent: 100,
        lastActivityAt: hoursAgo(now, 110).toISOString(),
        launchUrl: `${HOST}/cisco/launch/a41f-pt-0432`,
      },
    ],
  };
}

const BUILDERS: { [P in ProviderId]: (now: Date) => RawPayloadMap[P] } = {
  elearning,
  ilearning,
  classroom,
  kkuexam,
  gecanvas,
  cisco,
};

export function buildPayload<P extends ProviderId>(provider: P, now: Date = new Date()): RawPayloadMap[P] {
  return BUILDERS[provider](now);
}
