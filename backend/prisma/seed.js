require('dotenv').config();

const bcrypt = require('bcryptjs');
const prisma = require('../src/config/prisma');

const passwordHash = (password) => bcrypt.hash(password, 12);

const roles = [
  { name: 'student', description: 'Student account', isSystem: true },
  { name: 'mentor', description: 'Mentor account', isSystem: true },
  { name: 'hod', description: 'Head of department account', isSystem: true },
  { name: 'admin', description: 'Administrator account', isSystem: true },
  { name: 'super_admin', description: 'Super administrator account', isSystem: true },
];

const permissions = [
  { name: 'view_dashboard', description: 'View dashboard data' },
  { name: 'submit_work', description: 'Submit project and milestone work' },
  { name: 'manage_projects', description: 'Manage projects and teams' },
  { name: 'manage_registrations', description: 'Create and approve registration forms' },
  { name: 'manage_reviews', description: 'Review submissions and milestones' },
  { name: 'manage_users', description: 'Create and manage users' },
  { name: 'view_reports', description: 'View summary and export reports' },
  { name: 'manage_notifications', description: 'Create and manage notifications' },
];

const rolePermissions = {
  student: ['view_dashboard', 'submit_work'],
  mentor: ['view_dashboard', 'manage_projects', 'manage_reviews', 'view_reports'],
  hod: ['view_dashboard', 'manage_projects', 'manage_registrations', 'manage_reviews', 'manage_users', 'view_reports'],
  admin: ['view_dashboard', 'manage_projects', 'manage_registrations', 'manage_reviews', 'manage_users', 'manage_notifications', 'view_reports'],
  super_admin: permissions.map((permission) => permission.name),
};

async function seedReferenceData() {
  const engineering = await prisma.department.upsert({
    where: { id: 1 },
    create: { id: 1, name: 'Engineering', code: 'ENG' },
    update: { name: 'Engineering', code: 'ENG' },
  });

  const branches = [
    { id: 1, name: 'Computer Science & Engineering', code: 'CSE' },
    { id: 2, name: 'Information Technology', code: 'IT' },
    { id: 3, name: 'Electronics & Communication', code: 'ECE' },
    { id: 4, name: 'Mechanical Engineering', code: 'ME' },
  ];

  for (const branch of branches) {
    await prisma.branch.upsert({
      where: { id: branch.id },
      create: {
        id: branch.id,
        name: branch.name,
        code: branch.code,
        departmentId: engineering.id,
      },
      update: {
        name: branch.name,
        code: branch.code,
        departmentId: engineering.id,
      },
    });
  }

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      create: role,
      update: role,
    });
  }

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      create: permission,
      update: permission,
    });
  }

  const roleRecords = await prisma.role.findMany();
  const permissionRecords = await prisma.permission.findMany();
  const permissionIdByName = Object.fromEntries(permissionRecords.map((permission) => [permission.name, permission.id]));

  for (const roleRecord of roleRecords) {
    const allowedPermissions = rolePermissions[roleRecord.name] || [];
    await prisma.rolePermission.createMany({
      data: allowedPermissions.map((permissionName) => ({
        roleId: roleRecord.id,
        permissionId: permissionIdByName[permissionName],
      })),
      skipDuplicates: true,
    });
  }
}

async function seedUsers() {
  const users = [
    {
      email: 'admin@college.edu',
      fullName: 'ProjectFlow Admin',
      role: 'ADMIN',
    },
    {
      email: 'hod@college.edu',
      fullName: 'ProjectFlow HOD',
      role: 'HOD',
    },
    {
      email: 'mentor@college.edu',
      fullName: 'ProjectFlow Mentor',
      role: 'MENTOR',
    },
    {
      email: 'student@college.edu',
      fullName: 'ProjectFlow Student',
      role: 'STUDENT',
      rollNumber: '2021CS01',
      branchId: 1,
      semester: 6,
      section: '1',
      subsection: '1',
      academicYear: '2025-26',
    },
    {
      email: 'student2@college.edu',
      fullName: 'ProjectFlow Student 2',
      role: 'STUDENT',
      rollNumber: '2021CS02',
      branchId: 1,
      semester: 6,
      section: '1',
      subsection: '2',
      academicYear: '2025-26',
    },
    {
      email: 'student3@college.edu',
      fullName: 'ProjectFlow Student 3',
      role: 'STUDENT',
      rollNumber: '2021IT01',
      branchId: 2,
      semester: 6,
      section: '2',
      subsection: '1',
      academicYear: '2025-26',
    },
  ];

  for (const user of users) {
    const hashedPassword = await passwordHash('password123');
    const record = await prisma.user.upsert({
      where: { email: user.email },
      create: {
        email: user.email,
        fullName: user.fullName,
        passwordHash: hashedPassword,
        role: user.role,
      },
      update: {
        fullName: user.fullName,
        role: user.role,
        isActive: true,
      },
    });

    if (user.role === 'STUDENT') {
      await prisma.studentProfile.upsert({
        where: { userId: record.id },
        create: {
          userId: record.id,
          fullName: user.fullName,
          email: user.email,
          rollNumber: user.rollNumber,
          branchId: user.branchId,
          semester: user.semester,
          section: user.section,
          subsection: user.subsection,
          academicYear: user.academicYear,
          status: 'active',
        },
        update: {
          fullName: user.fullName,
          email: user.email,
          rollNumber: user.rollNumber,
          branchId: user.branchId,
          semester: user.semester,
          section: user.section,
          subsection: user.subsection,
          academicYear: user.academicYear,
          status: 'active',
        },
      });
    }

    if (user.role === 'MENTOR') {
      await prisma.mentorProfile.upsert({
        where: { userId: record.id },
        create: {
          userId: record.id,
          specialization: 'Computer Science',
          designation: 'Mentor',
        },
        update: {
          specialization: 'Computer Science',
          designation: 'Mentor',
        },
      });
    }
  }
}

async function main() {
  await seedReferenceData();
  await seedUsers();
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('Seed completed successfully.');
  })
  .catch(async (error) => {
    console.error('Seed failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
