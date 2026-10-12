import type { ProviderId, SourceId } from '../types';

export interface ProviderMeta {
  id: ProviderId;
  name: string;
  initials: string;
  owner: 'ระบบของมหาวิทยาลัย' | 'แพลตฟอร์มภายนอก';
  format: string;
  /** path ของ API จำลอง (ต่อท้าย /mock-api) */
  endpoint: string;
  color: string;
  soft: string;
}

export const PROVIDERS: Record<ProviderId, ProviderMeta> = {
  elearning: {
    id: 'elearning',
    name: 'E-learning',
    initials: 'EL',
    owner: 'ระบบของมหาวิทยาลัย',
    format: 'จำลองตามรูปแบบ Moodle Web Service',
    endpoint: '/elearning/webservice/rest/server.php?wsfunction=mod_assign_get_assignments',
    color: '#B4531A',
    soft: '#FBEBDD',
  },
  ilearning: {
    id: 'ilearning',
    name: 'I-learning',
    initials: 'IL',
    owner: 'ระบบของมหาวิทยาลัย',
    format: 'จำลอง REST API รายการงานของผู้เรียน',
    endpoint: '/ilearning/api/v1/student/tasks',
    color: '#96690F',
    soft: '#FBF0D2',
  },
  classroom: {
    id: 'classroom',
    name: 'Google Classroom',
    initials: 'GC',
    owner: 'แพลตฟอร์มภายนอก',
    format: 'จำลองตามรูปแบบ Classroom API v1',
    endpoint: '/classroom/v1/courses/-/courseWork',
    color: '#1A7F43',
    soft: '#E0F2E6',
  },
  kkuexam: {
    id: 'kkuexam',
    name: 'KKU Exam',
    initials: 'EX',
    owner: 'ระบบของมหาวิทยาลัย',
    format: 'จำลอง API ตารางสอบออนไลน์',
    endpoint: '/kkuexam/api/exams/upcoming',
    color: '#6F4BB2',
    soft: '#ECE5F8',
  },
  gecanvas: {
    id: 'gecanvas',
    name: 'GE Canvas',
    initials: 'GE',
    owner: 'ระบบของมหาวิทยาลัย',
    format: 'จำลองตามรูปแบบ Canvas LMS API',
    endpoint: '/gecanvas/api/v1/users/self/assignments',
    color: '#2B62B8',
    soft: '#E1EAF8',
  },
  cisco: {
    id: 'cisco',
    name: 'Cisco NetAcad',
    initials: 'CN',
    owner: 'แพลตฟอร์มภายนอก',
    format: 'จำลอง API กิจกรรมของผู้เรียน',
    endpoint: '/cisco/api/learner/assignments',
    color: '#12788F',
    soft: '#DCEFF3',
  },
};

const MANUAL_META = { name: 'เพิ่มเอง', color: '#6B625B', soft: '#EFEAE5' };

export function sourceMeta(source: SourceId): { name: string; color: string; soft: string } {
  return source === 'manual' ? MANUAL_META : PROVIDERS[source];
}
