// รูปแบบข้อมูลดิบ (raw payload) ที่ API จำลองของแต่ละระบบส่งกลับมา
// แต่ละระบบตั้งใจให้โครงสร้างและรูปแบบวันที่ต่างกัน เพื่อแสดงขั้นตอนแปลงข้อมูลให้เป็นรูปแบบเดียว

export type ProviderId = 'elearning' | 'ilearning' | 'classroom' | 'kkuexam' | 'gecanvas' | 'cisco';

export const PROVIDER_IDS: ProviderId[] = ['elearning', 'ilearning', 'classroom', 'kkuexam', 'gecanvas', 'cisco'];

/** E-learning — จำลองตามรูปแบบ Moodle Web Service (วันที่เป็น unix seconds, รายละเอียดเป็น HTML) */
export interface MoodleAssignmentsResponse {
  courses: {
    id: number;
    shortname: string;
    fullname: string;
    assignments: {
      id: number;
      cmid: number;
      name: string;
      intro: string;
      duedate: number;
      grade: number;
      timemodified: number;
      submissionstatus: 'new' | 'submitted';
    }[];
  }[];
  warnings: unknown[];
}

/** i-learning — REST แบบกำหนดเอง (วันที่เป็นข้อความ 'YYYY-MM-DD HH:mm' เวลาไทย) */
export interface ILearningResponse {
  status: 'success';
  semester: string;
  data: {
    task_id: string;
    subject_code: string;
    subject_name: string;
    title: string;
    description: string;
    deadline: string;
    score_full: number;
    is_group_work: boolean;
    is_submitted: boolean;
    updated_at: string;
    link: string;
  }[];
}

/** Google Classroom — จำลองตามรูปแบบ Classroom API v1 (วันและเวลาแยกฟิลด์ เป็น UTC) */
export interface ClassroomResponse {
  courses: { id: string; name: string; section: string }[];
  courseWork: {
    courseId: string;
    id: string;
    title: string;
    description: string;
    state: 'PUBLISHED';
    workType: 'ASSIGNMENT';
    alternateLink: string;
    maxPoints: number;
    dueDate: { year: number; month: number; day: number };
    dueTime: { hours: number; minutes: number };
    updateTime: string;
  }[];
  studentSubmissions: { courseWorkId: string; state: 'NEW' | 'CREATED' | 'TURNED_IN' | 'RETURNED' }[];
}

/** KKU Exam — ระบบสอบออนไลน์ (วันที่เป็น ISO 8601) */
export interface KkuExamResponse {
  result: {
    exams: {
      examId: number;
      courseCode: string;
      courseTitle: string;
      examName: string;
      instruction: string;
      openAt: string;
      closeAt: string;
      durationMinutes: number;
      attemptStatus: 'not_started' | 'finished';
      examUrl: string;
    }[];
  };
}

/** GE Canvas — จำลองตามรูปแบบ Canvas LMS API (snake_case, วันที่เป็น ISO 8601) */
export interface CanvasResponse {
  courses: { id: number; course_code: string; name: string }[];
  assignments: {
    id: number;
    course_id: number;
    name: string;
    description: string;
    due_at: string;
    points_possible: number;
    html_url: string;
    updated_at: string;
    submission: { workflow_state: 'unsubmitted' | 'submitted' | 'graded'; submitted_at: string | null };
  }[];
}

/** Cisco NetAcad — รายการกิจกรรมของผู้เรียน (มีเปอร์เซ็นต์ความคืบหน้า) */
export interface CiscoResponse {
  learner: { academy: string };
  items: {
    uuid: string;
    courseName: string;
    moduleTitle: string;
    summary: string;
    activityType: 'lab' | 'exam' | 'packet_tracer';
    dueDateTime: string;
    completionPercent: number;
    lastActivityAt: string;
    launchUrl: string;
  }[];
}

export interface RawPayloadMap {
  elearning: MoodleAssignmentsResponse;
  ilearning: ILearningResponse;
  classroom: ClassroomResponse;
  kkuexam: KkuExamResponse;
  gecanvas: CanvasResponse;
  cisco: CiscoResponse;
}
