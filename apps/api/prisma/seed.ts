/**
 * Prisma seed script — SchoolBridge demo data.
 *
 * Seeded credentials (all passwords use bcrypt cost 10):
 *   Super Admin   : phone=08000000001  password=Password123!
 *   School Admin  : phone=08000000002  password=Password123!
 *   Teacher       : phone=08000000003  password=Password123!
 *   Parent Alice  : phone=08000000004  password=Password123!
 *   Parent Bob    : phone=08000000005  password=Password123!
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const HASH_ROUNDS = 10;
const PASSWORD = 'Password123!';

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, HASH_ROUNDS);

  // ── Super Admin (platform-level, no school membership needed) ──────────────
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

  // ── Demo School ───────────────────────────────────────────────────────────
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

  // Super Admin membership (SUPER_ADMIN is cross-tenant but we still record it)
  await prisma.membership.upsert({
    where: { userId_schoolId_role: { userId: superAdmin.id, schoolId: school.id, role: 'SUPER_ADMIN' } },
    update: {},
    create: { userId: superAdmin.id, schoolId: school.id, role: 'SUPER_ADMIN' },
  });

  // ── School Admin ──────────────────────────────────────────────────────────
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

  // ── Teacher ───────────────────────────────────────────────────────────────
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

  // ── Parents ───────────────────────────────────────────────────────────────
  const parentAlice = await prisma.user.upsert({
    where: { phone: '08000000004' },
    update: {},
    create: {
      fullName: 'Alice Chukwu',
      phone: '08000000004',
      passwordHash,
      phoneVerifiedAt: new Date(),
    },
  });
  await prisma.membership.upsert({
    where: { userId_schoolId_role: { userId: parentAlice.id, schoolId: school.id, role: 'PARENT' } },
    update: {},
    create: { userId: parentAlice.id, schoolId: school.id, role: 'PARENT' },
  });

  const parentBob = await prisma.user.upsert({
    where: { phone: '08000000005' },
    update: {},
    create: {
      fullName: 'Bob Adeleke',
      phone: '08000000005',
      passwordHash,
      phoneVerifiedAt: new Date(),
    },
  });
  await prisma.membership.upsert({
    where: { userId_schoolId_role: { userId: parentBob.id, schoolId: school.id, role: 'PARENT' } },
    update: {},
    create: { userId: parentBob.id, schoolId: school.id, role: 'PARENT' },
  });

  // ── Academic Year + Term ──────────────────────────────────────────────────
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

  // ── ClassRoom ─────────────────────────────────────────────────────────────
  const classRoom = await prisma.classRoom.upsert({
    where: { schoolId_name: { schoolId: school.id, name: 'JSS 1A' } },
    update: {},
    create: {
      schoolId: school.id,
      name: 'JSS 1A',
      classTeacherId: teacher.id,
    },
  });

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

  // ── Guardian Links ────────────────────────────────────────────────────────
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

  // ── Enrollments ───────────────────────────────────────────────────────────
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

  // ── Sample Messages ───────────────────────────────────────────────────────
  const announcement = await prisma.message.create({
    data: {
      schoolId: school.id,
      authorId: teacher.id,
      type: 'ANNOUNCEMENT',
      target: 'CLASS',
      classRoomId: classRoom.id,
      title: 'Welcome to JSS 1A — First Term 2024/2025',
      body: 'Dear parents, welcome to the new academic session. Please ensure your ward is in school by 7:45 AM daily. Thank you.',
      attachments: [],
    },
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
      dueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    },
  });

  // ── Message Receipts ──────────────────────────────────────────────────────
  // Announcement → both pupils in class
  await prisma.messageReceipt.createMany({
    data: [
      {
        messageId: announcement.id,
        pupilId: pupil1.id,
        deliveredAt: new Date(),
        readAt: new Date(),
      },
      {
        messageId: announcement.id,
        pupilId: pupil2.id,
        deliveredAt: new Date(),
      },
    ],
    skipDuplicates: true,
  });

  // Homework → pupil1 only
  await prisma.messageReceipt.createMany({
    data: [
      {
        messageId: homeworkMessage.id,
        pupilId: pupil1.id,
        deliveredAt: new Date(),
      },
    ],
    skipDuplicates: true,
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
  console.log(`Teacher:     ${teacher.phone}`);
  console.log(`Parent 1:    ${parentAlice.phone} (guardian of ${pupil1.fullName})`);
  console.log(`Parent 2:    ${parentBob.phone} (guardian of ${pupil2.fullName})`);
  console.log(`All passwords: ${PASSWORD}`);
  console.log(`Term id: ${term.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
