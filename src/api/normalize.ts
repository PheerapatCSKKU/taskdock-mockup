// แปลงข้อมูลดิบของแต่ละแพลตฟอร์มให้เป็น Task รูปแบบเดียวกัน
import type {
  CanvasResponse,
  CiscoResponse,
  ClassroomResponse,
  ILearningResponse,
  KkuExamResponse,
  MoodleAssignmentsResponse,
  RawPayloadMap,
} from '../../mock/types';
import type { Priority, ProviderId, Task, TaskKind } from '../types';

const stripHtml = (html: string) =>
  html
    .replace(/<\/p>\s*<p>/g, ' ')
    .replace(/<[^>]+>/g, '')
    .trim();

/** ระบบต้นทางไม่มีระดับความสำคัญ จึงประเมินจากประเภทงานและคะแนนเต็ม */
function priorityOf(kind: TaskKind, points: number | null): Priority {
  if (kind === 'exam' || (points ?? 0) >= 20) return 'high';
  if ((points ?? 0) >= 10) return 'medium';
  return 'low';
}

/** 'YYYY-MM-DD HH:mm' (เวลาไทย) → Date */
function parseLocal(text: string): Date {
  const [date, time] = text.split(' ');
  const [y, mo, d] = date.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  return new Date(y, mo - 1, d, h, mi);
}

function fromMoodle(p: MoodleAssignmentsResponse): Task[] {
  return p.courses.flatMap((course) =>
    course.assignments.map((a): Task => {
      const kind: TaskKind = 'assignment';
      return {
        id: `elearning:${a.id}`,
        title: a.name,
        detail: stripHtml(a.intro),
        courseCode: course.shortname,
        courseName: course.fullname.replace(course.shortname, '').trim(),
        source: 'elearning',
        kind,
        dueAt: new Date(a.duedate * 1000).toISOString(),
        status: a.submissionstatus === 'submitted' ? 'done' : 'todo',
        priority: priorityOf(kind, a.grade),
        points: a.grade,
        url: `https://mock.taskdock.local/elearning/mod/assign/view.php?id=${a.cmid}`,
        updatedAt: new Date(a.timemodified * 1000).toISOString(),
      };
    }),
  );
}

function fromILearning(p: ILearningResponse): Task[] {
  return p.data.map((t): Task => {
    const kind: TaskKind = t.is_group_work ? 'group' : 'assignment';
    return {
      id: `ilearning:${t.task_id}`,
      title: t.title,
      detail: t.description,
      courseCode: t.subject_code,
      courseName: t.subject_name,
      source: 'ilearning',
      kind,
      dueAt: parseLocal(t.deadline).toISOString(),
      status: t.is_submitted ? 'done' : 'todo',
      priority: priorityOf(kind, t.score_full),
      points: t.score_full,
      url: t.link,
      updatedAt: parseLocal(t.updated_at).toISOString(),
    };
  });
}

function fromClassroom(p: ClassroomResponse): Task[] {
  const courses = new Map(p.courses.map((c) => [c.id, c]));
  const submissions = new Map(p.studentSubmissions.map((s) => [s.courseWorkId, s.state]));
  return p.courseWork.map((w): Task => {
    const [code, ...rest] = (courses.get(w.courseId)?.name ?? '').split(' ');
    const state = submissions.get(w.id) ?? 'NEW';
    const kind: TaskKind = 'assignment';
    // Classroom ส่งวันและเวลาเป็น UTC แยกฟิลด์
    const due = new Date(Date.UTC(w.dueDate.year, w.dueDate.month - 1, w.dueDate.day, w.dueTime.hours, w.dueTime.minutes));
    return {
      id: `classroom:${w.id}`,
      title: w.title,
      detail: w.description,
      courseCode: code,
      courseName: rest.join(' '),
      source: 'classroom',
      kind,
      dueAt: due.toISOString(),
      status: state === 'TURNED_IN' || state === 'RETURNED' ? 'done' : state === 'CREATED' ? 'doing' : 'todo',
      priority: priorityOf(kind, w.maxPoints),
      points: w.maxPoints,
      url: w.alternateLink,
      updatedAt: w.updateTime,
    };
  });
}

function fromKkuExam(p: KkuExamResponse): Task[] {
  return p.result.exams.map(
    (e): Task => ({
      id: `kkuexam:${e.examId}`,
      title: e.examName,
      detail: `${e.instruction} (เวลาทำ ${e.durationMinutes} นาที)`,
      courseCode: e.courseCode,
      courseName: e.courseTitle,
      source: 'kkuexam',
      kind: 'exam',
      dueAt: e.closeAt,
      status: e.attemptStatus === 'finished' ? 'done' : 'todo',
      priority: 'high',
      points: null,
      url: e.examUrl,
      updatedAt: e.openAt < new Date().toISOString() ? e.openAt : new Date().toISOString(),
    }),
  );
}

function fromCanvas(p: CanvasResponse): Task[] {
  const courses = new Map(p.courses.map((c) => [c.id, c]));
  return p.assignments.map((a): Task => {
    const course = courses.get(a.course_id);
    const kind: TaskKind = a.name.includes('กลุ่ม') ? 'group' : 'assignment';
    return {
      id: `gecanvas:${a.id}`,
      title: a.name,
      detail: a.description,
      courseCode: course?.course_code ?? '',
      courseName: course?.name ?? '',
      source: 'gecanvas',
      kind,
      dueAt: a.due_at,
      status: a.submission.workflow_state === 'unsubmitted' ? 'todo' : 'done',
      priority: priorityOf(kind, a.points_possible),
      points: a.points_possible,
      url: a.html_url,
      updatedAt: a.updated_at,
    };
  });
}

function fromCisco(p: CiscoResponse): Task[] {
  return p.items.map((item): Task => {
    const [code, ...rest] = item.courseName.split(' ');
    const kind: TaskKind = item.activityType === 'exam' ? 'exam' : 'lab';
    return {
      id: `cisco:${item.uuid}`,
      title: item.moduleTitle,
      detail: item.summary,
      courseCode: code,
      courseName: rest.join(' '),
      source: 'cisco',
      kind,
      dueAt: item.dueDateTime,
      status: item.completionPercent >= 100 ? 'done' : item.completionPercent > 0 ? 'doing' : 'todo',
      priority: priorityOf(kind, null) === 'high' ? 'high' : 'medium',
      points: null,
      url: item.launchUrl,
      updatedAt: item.lastActivityAt,
    };
  });
}

const NORMALIZERS: { [P in ProviderId]: (payload: RawPayloadMap[P]) => Task[] } = {
  elearning: fromMoodle,
  ilearning: fromILearning,
  classroom: fromClassroom,
  kkuexam: fromKkuExam,
  gecanvas: fromCanvas,
  cisco: fromCisco,
};

export function normalize<P extends ProviderId>(provider: P, payload: RawPayloadMap[P]): Task[] {
  return (NORMALIZERS[provider] as (payload: RawPayloadMap[P]) => Task[])(payload);
}
