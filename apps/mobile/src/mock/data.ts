/**
 * src/mock/data.ts
 * Mock data ported verbatim from the SchoolBridge mockup (data.jsx).
 * Screens render from these by default; live API data is layered on top where
 * endpoints exist (see src/screens/* — they accept props that override these).
 */
import type { Tone } from '../design/theme';

export const SCHOOL = 'Crescent Heights School';

export const CHILD = {
  name: 'Amara Okafor',
  first: 'Amara',
  klass: 'Primary 4 — Sapphire',
  age: 9,
  teacher: 'Mrs. Folake Adeyemi',
  initials: 'AO',
  hue: 255,
};

export const TODAY = 'Thursday, 19 June';

export const ATTENDANCE_TODAY = { status: 'Present', arrived: '7:42 AM', mood: 'Cheerful' };

export interface SubjectToday {
  icon: string;
  subj: string;
  topic: string;
  note: string;
  score: string | null;
  tone: Tone;
}
export const SUBJECTS_TODAY: SubjectToday[] = [
  { icon: 'abc', subj: 'English', topic: 'Comprehension — “The Clever Tortoise”', note: 'Read aloud confidently', score: null, tone: 'green' },
  { icon: 'report', subj: 'Mathematics', topic: 'Long division (3-digit numbers)', note: 'Classwork', score: '8/10', tone: 'green' },
  { icon: 'beaker', subj: 'Basic Science', topic: 'States of matter — practical', note: 'Led her group', score: null, tone: 'green' },
  { icon: 'sparkle', subj: 'Quant. Reasoning', topic: 'Number patterns & sequences', note: 'Classwork', score: '9/10', tone: 'green' },
  { icon: 'globe', subj: 'Civic Education', topic: 'Community helpers', note: 'Group discussion', score: null, tone: 'primary' },
];

export interface RatingRow {
  label: string;
  icon: string;
  value: string;
}
export const RATINGS_TODAY: RatingRow[] = [
  { label: 'Class participation', icon: 'star', value: 'Excellent' },
  { label: 'Focus & attention', icon: 'clock', value: 'Good' },
  { label: 'Peer interaction', icon: 'smile', value: 'Excellent' },
  { label: 'Following rules', icon: 'shield', value: 'Good' },
  { label: 'Neatness', icon: 'check', value: 'Excellent' },
];

export interface HomeworkItem {
  id: string;
  subj: string;
  icon: string;
  task: string;
  due: string;
  done: boolean;
}
export const HOMEWORK: HomeworkItem[] = [
  { id: 'h1', subj: 'Mathematics', icon: 'report', task: 'Exercise 4b — Questions 1 to 10', due: 'Tomorrow', done: false },
  { id: 'h2', subj: 'English', icon: 'abc', task: 'Read pages 22–24 and answer the questions', due: 'Tomorrow', done: false },
  { id: 'h3', subj: 'Quant. Reasoning', icon: 'sparkle', task: 'Complete the number-pattern worksheet', due: 'Mon, 23 Jun', done: false },
  { id: 'h4', subj: 'Basic Science', icon: 'beaker', task: 'Draw the 3 states of matter with examples', due: 'Done', done: true },
];

export interface Reminder {
  id: string;
  icon: string;
  text: string;
  when: string;
  tone: Tone;
}
export const REMINDERS: Reminder[] = [
  { id: 'r1', icon: 'camera', text: 'Bring coloured pencils for Art', when: 'Friday', tone: 'primary' },
  { id: 'r2', icon: 'money', text: 'Excursion fee ₦5,000 due', when: 'Friday', tone: 'amber' },
  { id: 'r3', icon: 'calendar', text: 'Mid-term test begins', when: 'Mon, 23 Jun', tone: 'primary' },
  { id: 'r4', icon: 'flag', text: 'PTA meeting in the hall', when: 'Sat, 10 AM', tone: 'primary' },
];

export const TEACHER_NOTE =
  'Amara had a wonderful day! She led her group during the science practical and kindly helped a classmate with long division. Please revise her multiplication tables at home this weekend — she’s almost there.';

export interface ChatMessage {
  id: string;
  from: 'teacher' | 'parent';
  text?: string;
  voice?: string;
  time: string;
}
export const MESSAGES: ChatMessage[] = [
  { id: 'm1', from: 'teacher', text: 'Good morning ma 🌸 Just a heads up — Amara forgot her water bottle today. Please pack one tomorrow.', time: '7:58 AM' },
  { id: 'm2', from: 'parent', text: 'Good morning ma, thank you so much. Noted — I’ll pack it tonight.', time: '8:15 AM' },
  { id: 'm3', from: 'teacher', voice: '0:24', time: '1:10 PM' },
  { id: 'm4', from: 'teacher', text: 'She did beautifully in Quantitative Reasoning today — 9 out of 10! 🎉', time: '2:30 PM' },
  { id: 'm5', from: 'parent', text: 'That’s wonderful, we’re so proud of her. Thank you for the update ma 🙏', time: '2:41 PM' },
];

export const PROGRESS = {
  termAvg: 85,
  grade: 'B — Very Good',
  position: '6th of 28',
  attendance: 96,
  attendanceDays: '58 / 60 days',
  subjects: [
    { subj: 'Quant. Reasoning', pct: 91 },
    { subj: 'English', pct: 88 },
    { subj: 'Mathematics', pct: 82 },
    { subj: 'Verbal Reasoning', pct: 85 },
    { subj: 'Basic Science', pct: 79 },
  ],
  behaviorWeeks: [3.6, 4.0, 3.8, 4.4, 4.2, 4.6],
  badges: [
    { icon: 'book', label: 'Reading streak', sub: '12 days' },
    { icon: 'arrowUp', label: 'Most improved', sub: 'Mathematics' },
    { icon: 'star', label: 'Star helper', sub: 'This week' },
  ],
};

// ── Teacher-side ───────────────────────────────────────────────────────────────
export const TEACHER = { name: 'Mrs. Folake Adeyemi', first: 'Folake', klass: 'Primary 4 — Sapphire', initials: 'FA' };

export interface RosterPupilMock {
  name: string;
  initials: string;
  status: 'sent' | 'draft' | 'pending';
  mood: string;
  hue: number;
}
export const ROSTER: RosterPupilMock[] = [
  { name: 'Amara Okafor', initials: 'AO', status: 'sent', mood: 'Cheerful', hue: 255 },
  { name: 'Tunde Bello', initials: 'TB', status: 'sent', mood: 'Focused', hue: 30 },
  { name: 'Zainab Sani', initials: 'ZS', status: 'draft', mood: 'Quiet', hue: 330 },
  { name: 'Chidi Nwosu', initials: 'CN', status: 'sent', mood: 'Playful', hue: 150 },
  { name: 'Funmi Adeleke', initials: 'FA', status: 'pending', mood: '—', hue: 200 },
  { name: 'Ibrahim Musa', initials: 'IM', status: 'sent', mood: 'Cheerful', hue: 95 },
  { name: 'Ngozi Eze', initials: 'NE', status: 'draft', mood: 'Tired', hue: 290 },
  { name: 'David Okon', initials: 'DO', status: 'pending', mood: '—', hue: 60 },
  { name: 'Aisha Bello', initials: 'AB', status: 'sent', mood: 'Bright', hue: 12 },
  { name: 'Emeka Obi', initials: 'EO', status: 'sent', mood: 'Focused', hue: 175 },
];

export interface InboxThread {
  parent: string;
  child: string;
  initials: string;
  last: string;
  time: string;
  unread: number;
  hue: number;
}
export const INBOX: InboxThread[] = [
  { parent: 'Mrs. Okafor', child: 'Amara', initials: 'AO', last: 'That’s wonderful, we’re so proud of her…', time: '2:41 PM', unread: 0, hue: 255 },
  { parent: 'Mr. Bello', child: 'Tunde', initials: 'TB', last: 'Good afternoon ma, will he need the textbook?', time: '1:22 PM', unread: 2, hue: 30 },
  { parent: 'Mrs. Sani', child: 'Zainab', initials: 'ZS', last: 'Thank you ma 🙏', time: 'Yesterday', unread: 0, hue: 330 },
  { parent: 'Mrs. Eze', child: 'Ngozi', initials: 'NE', last: 'She was a little unwell this morning…', time: 'Yesterday', unread: 1, hue: 290 },
];

export interface ClassHwItem {
  subj: string;
  icon: string;
  task: string;
  due: string;
  submitted: number;
  total: number;
}
export const CLASS_HW: ClassHwItem[] = [
  { subj: 'Mathematics', icon: 'report', task: 'Exercise 4b — Questions 1 to 10', due: 'Tomorrow', submitted: 12, total: 28 },
  { subj: 'English', icon: 'abc', task: 'Read pages 22–24 and answer questions', due: 'Tomorrow', submitted: 9, total: 28 },
  { subj: 'Quant. Reasoning', icon: 'sparkle', task: 'Number-pattern worksheet', due: 'Mon, 23 Jun', submitted: 3, total: 28 },
];

export const PARENT = { name: 'Mrs. Okafor', first: 'Ngozi', initials: 'NO', hue: 12 };
