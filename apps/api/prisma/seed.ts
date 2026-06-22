/**
 * Prisma seed script — SchoolBridge demo data.
 *
 * Idempotent: safe to run repeatedly. Core identities (users, school) are
 * upserted; per-day demo content (messages, attendance, notes, results, …) is
 * cleared for the demo school and re-created so a fresh run yields a clean,
 * fully-exercised dataset for both the parent and teacher mobile flows.
 *
 * Seeded credentials (all passwords use bcrypt cost 10):
 *   Super Admin   : phone=08000000001  password=Password123!
 *   School Admin  : phone=08000000002  password=Password123!
 *   Teacher       : phone=08000000003  password=Password123!
 *   Parent Alice  : phone=08000000004  password=Password123!  (guardian of Chidi)
 *   Parent Bob    : phone=08000000005  password=Password123!  (guardian of Fatima)
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const HASH_ROUNDS = 10;
const PASSWORD = 'Password123!';

/** UTC midnight today, matching the @db.Date columns. */
function dateOnly(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
function daysFromNow(n: number): Date {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000);
}
function atTime(h: number, m: number): Date {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, HASH_ROUNDS);
  const today = dateOnly();

  // ── Users (upserted — stable identities) ──────────────────────────────────
  const superAdmin = await prisma.user.upsert({
    where: { phone: '08000000001' },
    update: {},
    create: {
      fullName: 'Platform Super Admin',
      phone: '08000000001',
      email: 'superadmin@schoolbridge.ng',
      passwordHash,
      phoneVerifiedAt: new Date(),
    },
  });

  const school = await prisma.school.upsert({
    where: { slug: 'demo-secondary-school' },
    update: {},
    create: {
      name: 'Demo Secondary School',
      slug: 'demo-secondary-school',
      plan: 'BASIC',
      status: 'ACTIVE',
      settings: {
        address: '12 Education Avenue, Lagos, Nigeria',
        phone: '0812345678',
        timezone: 'Africa/Lagos',
      },
    },
  });

  // ── Idempotency: clear the demo school's regenerated content ───────────────
  // Order matters for FKs; child rows first. Pupil cascade handles most, but we
  // clear explicitly so a re-run doesn't accumulate duplicate messages/results.
  await prisma.homeworkSubmission.deleteMany({ where: { pupil: { schoolId: school.id } } });
  await prisma.reply.deleteMany({ where: { message: { schoolId: school.id } } });
  await prisma.messageReceipt.deleteMany({ where: { message: { schoolId: school.id } } });
  await prisma.message.deleteMany({ where: { schoolId: school.id } });
  await prisma.daySubjectNote.deleteMany({ where: { schoolId: school.id } });
  await prisma.behaviourRating.deleteMany({ where: { schoolId: school.id } });
  await prisma.assessmentResult.deleteMany({ where: { schoolId: school.id } });
  await prisma.attendance.deleteMany({ where: { schoolId: school.id } });
  await prisma.pupilBadge.deleteMany({ where: { schoolId: school.id } });
  await prisma.subscription.deleteMany({ where: { schoolId: school.id } });

  await prisma.membership.upsert({
    where: { userId_schoolId_role: { userId: superAdmin.id, schoolId: school.id, role: 'SUPER_ADMIN' } },
    update: {},
    create: { userId: superAdmin.id, schoolId: school.id, role: 'SUPER_ADMIN' },
  });

  const schoolAdmin = await prisma.user.upsert({
    where: { phone: '08000000002' },
    update: {},
    create: {
      fullName: 'Adaeze Okonkwo',
      phone: '08000000002',
      email: 'admin@demoschool.ng',
      passwordHash,
      phoneVerifiedAt: new Date(),
    },
  });
  await prisma.membership.upsert({
    where: { userId_schoolId_role: { userId: schoolAdmin.id, schoolId: school.id, role: 'SCHOOL_ADMIN' } },
    update: {},
    create: { userId: schoolAdmin.id, schoolId: school.id, role: 'SCHOOL_ADMIN' },
  });

  const teacher = await prisma.user.upsert({
    where: { phone: '08000000003' },
    update: {},
    create: {
      fullName: 'Emeka Nwosu',
      phone: '08000000003',
      email: 'teacher@demoschool.ng',
      passwordHash,
      phoneVerifiedAt: new Date(),
    },
  });
  await prisma.membership.upsert({
    where: { userId_schoolId_role: { userId: teacher.id, schoolId: school.id, role: 'CLASS_TEACHER' } },
    update: {},
    create: { userId: teacher.id, schoolId: school.id, role: 'CLASS_TEACHER' },
  });

  const parentAlice = await prisma.user.upsert({
    where: { phone: '08000000004' },
    update: {},
    create: { fullName: 'Alice Chukwu', phone: '08000000004', passwordHash, phoneVerifiedAt: new Date() },
  });
  await prisma.membership.upsert({
    where: { userId_schoolId_role: { userId: parentAlice.id, schoolId: school.id, role: 'PARENT' } },
    update: {},
    create: { userId: parentAlice.id, schoolId: school.id, role: 'PARENT' },
  });

  const parentBob = await prisma.user.upsert({
    where: { phone: '08000000005' },
    update: {},
    create: { fullName: 'Bob Adeleke', phone: '08000000005', passwordHash, phoneVerifiedAt: new Date() },
  });
  await prisma.membership.upsert({
    where: { userId_schoolId_role: { userId: parentBob.id, schoolId: school.id, role: 'PARENT' } },
    update: {},
    create: { userId: parentBob.id, schoolId: school.id, role: 'PARENT' },
  });

  // ── Plan catalog (so the super-admin Plans page has data) ──────────────────
  const PLANS = [
    { tier: 'TRIAL' as const, name: 'Trial', priceNaira: 0, maxPupils: 100, maxStaff: 10, smsQuota: 100, description: '30-day free trial.' },
    { tier: 'BASIC' as const, name: 'Basic', priceNaira: 15000, maxPupils: 300, maxStaff: 20, smsQuota: 1000, description: 'For small schools.' },
    { tier: 'STANDARD' as const, name: 'Standard', priceNaira: 40000, maxPupils: 1000, maxStaff: 60, smsQuota: 5000, description: 'Growing schools.' },
    { tier: 'PREMIUM' as const, name: 'Premium', priceNaira: 90000, maxPupils: null, maxStaff: null, smsQuota: null, description: 'Unlimited everything.' },
  ];
  for (const p of PLANS) {
    await prisma.plan.upsert({
      where: { tier: p.tier },
      update: {},
      create: { ...p, billingInterval: 'MONTHLY', isActive: true },
    });
  }

  // ── Academic year + term ──────────────────────────────────────────────────
  const academicYear = await prisma.academicYear.upsert({
    where: { schoolId_label: { schoolId: school.id, label: '2024/2025' } },
    update: {},
    create: {
      schoolId: school.id,
      label: '2024/2025',
      startDate: new Date('2024-09-09'),
      endDate: new Date('2025-07-25'),
      isCurrent: true,
    },
  });
  const term = await prisma.term.upsert({
    where: { academicYearId_label: { academicYearId: academicYear.id, label: 'First Term' } },
    update: {},
    create: {
      academicYearId: academicYear.id,
      schoolId: school.id,
      label: 'First Term',
      startDate: new Date('2024-09-09'),
      endDate: new Date('2024-12-13'),
      isCurrent: true,
    },
  });

  // ── Class + subjects ──────────────────────────────────────────────────────
  const classRoom = await prisma.classRoom.upsert({
    where: { schoolId_name: { schoolId: school.id, name: 'JSS 1A' } },
    update: {},
    create: { schoolId: school.id, name: 'JSS 1A', classTeacherId: teacher.id },
  });

  const subjectNames = ['Mathematics', 'English', 'Basic Science', 'Civic Education'];
  const subjects: Record<string, string> = {};
  for (const name of subjectNames) {
    const s = await prisma.subject.upsert({
      where: { schoolId_name: { schoolId: school.id, name } },
      update: {},
      create: { schoolId: school.id, name },
    });
    subjects[name] = s.id;
  }

  // ── Pupils ────────────────────────────────────────────────────────────────
  const pupil1 = await prisma.pupil.upsert({
    where: { schoolId_admissionNo: { schoolId: school.id, admissionNo: 'DSS/2024/001' } },
    update: {},
    create: {
      schoolId: school.id,
      fullName: 'Chidi Chukwu',
      admissionNo: 'DSS/2024/001',
      gender: 'M',
      dateOfBirth: new Date('2012-04-15'),
    },
  });
  const pupil2 = await prisma.pupil.upsert({
    where: { schoolId_admissionNo: { schoolId: school.id, admissionNo: 'DSS/2024/002' } },
    update: {},
    create: {
      schoolId: school.id,
      fullName: 'Fatima Adeleke',
      admissionNo: 'DSS/2024/002',
      gender: 'F',
      dateOfBirth: new Date('2012-07-22'),
    },
  });

  await prisma.guardianLink.upsert({
    where: { pupilId_userId: { pupilId: pupil1.id, userId: parentAlice.id } },
    update: {},
    create: { pupilId: pupil1.id, userId: parentAlice.id, relationship: 'MOTHER', isPrimary: true },
  });
  await prisma.guardianLink.upsert({
    where: { pupilId_userId: { pupilId: pupil2.id, userId: parentBob.id } },
    update: {},
    create: { pupilId: pupil2.id, userId: parentBob.id, relationship: 'FATHER', isPrimary: true },
  });

  await prisma.enrollment.upsert({
    where: { pupilId_classRoomId: { pupilId: pupil1.id, classRoomId: classRoom.id } },
    update: {},
    create: { pupilId: pupil1.id, classRoomId: classRoom.id },
  });
  await prisma.enrollment.upsert({
    where: { pupilId_classRoomId: { pupilId: pupil2.id, classRoomId: classRoom.id } },
    update: {},
    create: { pupilId: pupil2.id, classRoomId: classRoom.id },
  });

  // ── Messages + receipts + a reply thread (parent inbox / chat) ─────────────
  const announcement = await prisma.message.create({
    data: {
      schoolId: school.id,
      authorId: teacher.id,
      type: 'ANNOUNCEMENT',
      target: 'CLASS',
      classRoomId: classRoom.id,
      title: 'Welcome to JSS 1A — First Term 2024/2025',
      body: 'Dear parents, welcome to the new session. Please ensure your ward is in school by 7:45 AM daily.',
      attachments: [],
    },
  });
  await prisma.messageReceipt.createMany({
    data: [
      { messageId: announcement.id, pupilId: pupil1.id, deliveredAt: new Date(), readAt: new Date() },
      { messageId: announcement.id, pupilId: pupil2.id, deliveredAt: new Date() },
    ],
    skipDuplicates: true,
  });

  const homeworkMessage = await prisma.message.create({
    data: {
      schoolId: school.id,
      authorId: teacher.id,
      type: 'HOMEWORK',
      target: 'PUPIL',
      pupilId: pupil1.id,
      title: 'Mathematics Homework — Chapter 3',
      body: 'Complete exercises 3.1 to 3.5 from the textbook. Show all working.',
      attachments: [],
      dueAt: daysFromNow(3),
    },
  });
  await prisma.messageReceipt.create({
    data: { messageId: homeworkMessage.id, pupilId: pupil1.id, deliveredAt: new Date() },
  });

  // A teacher NOTE for Chidi with a guardian reply → drives the inbox thread.
  const dailyNote = await prisma.message.create({
    data: {
      schoolId: school.id,
      authorId: teacher.id,
      type: 'NOTE',
      target: 'PUPIL',
      pupilId: pupil1.id,
      title: "Chidi's day",
      body: 'Chidi led his group in Basic Science today and helped a classmate with long division. Please revise multiplication tables at home.',
      attachments: [],
    },
  });
  await prisma.messageReceipt.create({
    data: { messageId: dailyNote.id, pupilId: pupil1.id, deliveredAt: new Date(), readAt: new Date() },
  });
  await prisma.reply.create({
    data: { messageId: dailyNote.id, authorId: parentAlice.id, body: 'Thank you so much, ma. We will revise this weekend. 🙏' },
  });

  // Chidi has submitted his homework (so teacher status shows 1/2).
  await prisma.homeworkSubmission.create({
    data: { messageId: homeworkMessage.id, pupilId: pupil1.id },
  });

  // ── Attendance (today) with mood + arrival ─────────────────────────────────
  await prisma.attendance.createMany({
    data: [
      {
        schoolId: school.id, termId: term.id, classRoomId: classRoom.id, pupilId: pupil1.id,
        date: today, status: 'PRESENT', mood: 'Cheerful', arrivedAt: atTime(7, 42), recordedBy: teacher.id,
      },
      {
        schoolId: school.id, termId: term.id, classRoomId: classRoom.id, pupilId: pupil2.id,
        date: today, status: 'LATE', mood: 'Quiet', arrivedAt: atTime(8, 15), recordedBy: teacher.id,
      },
    ],
    skipDuplicates: true,
  });

  // ── Day subject notes (today) for Chidi → parent "Today" report ────────────
  const dayNotes = [
    { subject: 'English', topic: 'Comprehension — "The Clever Tortoise"', note: 'Read aloud confidently', score: null, maxScore: null },
    { subject: 'Mathematics', topic: 'Long division (3-digit numbers)', note: 'Classwork', score: 8, maxScore: 10 },
    { subject: 'Basic Science', topic: 'States of matter — practical', note: 'Led his group', score: null, maxScore: null },
    { subject: 'Civic Education', topic: 'Community helpers', note: 'Group discussion', score: 9, maxScore: 10 },
  ];
  for (const n of dayNotes) {
    await prisma.daySubjectNote.create({
      data: {
        schoolId: school.id,
        pupilId: pupil1.id,
        subjectId: subjects[n.subject]!,
        date: today,
        topic: n.topic,
        note: n.note,
        score: n.score,
        maxScore: n.maxScore,
        createdBy: teacher.id,
      },
    });
  }

  // ── Behaviour ratings (today) for Chidi ────────────────────────────────────
  const ratings: { label: string; value: 'NEEDS_WORK' | 'GOOD' | 'EXCELLENT' }[] = [
    { label: 'Class participation', value: 'EXCELLENT' },
    { label: 'Focus & attention', value: 'GOOD' },
    { label: 'Peer interaction', value: 'EXCELLENT' },
    { label: 'Following rules', value: 'GOOD' },
    { label: 'Neatness', value: 'EXCELLENT' },
  ];
  for (const r of ratings) {
    await prisma.behaviourRating.create({
      data: { schoolId: school.id, pupilId: pupil1.id, date: today, label: r.label, value: r.value, createdBy: teacher.id },
    });
  }

  // ── Assessment results (term) → parent Progress / report card ──────────────
  const results = [
    { pupil: pupil1.id, subject: 'Mathematics', score: 82, grade: 'B' },
    { pupil: pupil1.id, subject: 'English', score: 88, grade: 'A' },
    { pupil: pupil1.id, subject: 'Basic Science', score: 79, grade: 'B' },
    { pupil: pupil1.id, subject: 'Civic Education', score: 91, grade: 'A' },
    { pupil: pupil2.id, subject: 'Mathematics', score: 74, grade: 'C' },
    { pupil: pupil2.id, subject: 'English', score: 80, grade: 'B' },
  ];
  for (const r of results) {
    await prisma.assessmentResult.create({
      data: {
        schoolId: school.id,
        termId: term.id,
        pupilId: r.pupil,
        subjectId: subjects[r.subject]!,
        score: r.score,
        maxScore: 100,
        grade: r.grade,
      },
    });
  }

  // ── Pupil badges (profile milestones) ──────────────────────────────────────
  await prisma.pupilBadge.createMany({
    data: [
      { schoolId: school.id, pupilId: pupil1.id, icon: 'book', label: 'Reading streak', sub: '12 days' },
      { schoolId: school.id, pupilId: pupil1.id, icon: 'arrowUp', label: 'Most improved', sub: 'Mathematics' },
      { schoolId: school.id, pupilId: pupil1.id, icon: 'star', label: 'Star helper', sub: 'This week' },
    ],
  });

  // ── Subscription ──────────────────────────────────────────────────────────
  await prisma.subscription.create({
    data: {
      schoolId: school.id,
      plan: 'BASIC',
      status: 'ACTIVE',
      currentPeriodStart: new Date('2024-09-01'),
      currentPeriodEnd: new Date('2025-08-31'),
    },
  });

  console.log('Seed complete.');
  console.log(`School:      ${school.name}  (id: ${school.id})`);
  console.log(`Super Admin: ${superAdmin.phone}`);
  console.log(`Admin:       ${schoolAdmin.phone}`);
  console.log(`Teacher:     ${teacher.phone}  (class JSS 1A)`);
  console.log(`Parent 1:    ${parentAlice.phone} (guardian of ${pupil1.fullName})`);
  console.log(`Parent 2:    ${parentBob.phone} (guardian of ${pupil2.fullName})`);
  console.log(`All passwords: ${PASSWORD}`);
  console.log(`Term id: ${term.id}  ·  Subjects: ${subjectNames.join(', ')}`);
  console.log('Demo content: attendance(+mood), day notes, behaviour, results, badges, homework + reply thread.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
