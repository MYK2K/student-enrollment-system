/**
 * Prisma Seed File
 * Seeds the database with initial data
 */

import { PrismaClient, UserRole } from '@prisma/client';
import { DateTime } from 'luxon';
import { hashPassword } from '../src/utils/bcrypt.utils.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create colleges
  const colleges = await Promise.all([
    prisma.college.upsert({
      where: { code: 'TECH01' },
      update: {},
      create: {
        code: 'TECH01',
        name: 'Technology Institute'
      }
    }),
    prisma.college.upsert({
      where: { code: 'SCI01' },
      update: {},
      create: {
        code: 'SCI01',
        name: 'Science College'
      }
    })
  ]);

  console.log(`✅ Created ${colleges.length} colleges`);

  // Create admin users
  const adminPassword = await hashPassword('Admin@123456');
  
  await prisma.user.upsert({
    where: { email: 'admin@tech.edu' },
    update: {},
    create: {
      email: 'admin@tech.edu',
      password: adminPassword,
      role: UserRole.COLLEGE_ADMIN,
      collegeAdmin: {
        create: {
          collegeId: colleges[0].id
        }
      }
    }
  });

  await prisma.user.upsert({
    where: { email: 'admin@science.edu' },
    update: {},
    create: {
      email: 'admin@science.edu',
      password: adminPassword,
      role: UserRole.COLLEGE_ADMIN,
      collegeAdmin: {
        create: {
          collegeId: colleges[1].id
        }
      }
    }
  });

  console.log('✅ Created admin users');

  // Create student users
  const studentPassword = await hashPassword('Student@123');
  
  await Promise.all([
    prisma.user.upsert({
      where: { email: 'john.doe@student.edu' },
      update: {},
      create: {
        email: 'john.doe@student.edu',
        password: studentPassword,
        role: UserRole.STUDENT,
        student: {
          create: {
            name: 'John Doe',
            studentNumber: 'TECH2024001',
            collegeId: colleges[0].id
          }
        }
      }
    }),
    prisma.user.upsert({
      where: { email: 'jane.smith@student.edu' },
      update: {},
      create: {
        email: 'jane.smith@student.edu',
        password: studentPassword,
        role: UserRole.STUDENT,
        student: {
          create: {
            name: 'Jane Smith',
            studentNumber: 'TECH2024002',
            collegeId: colleges[0].id
          }
        }
      }
    }),
    prisma.user.upsert({
      where: { email: 'alice.johnson@student.edu' },
      update: {},
      create: {
        email: 'alice.johnson@student.edu',
        password: studentPassword,
        role: UserRole.STUDENT,
        student: {
          create: {
            name: 'Alice Johnson',
            studentNumber: 'SCI2024001',
            collegeId: colleges[1].id
          }
        }
      }
    })
  ]);

  console.log(`✅ Created student users`);

  // Helper to create JS Date from time string for Prisma
  const createTime = (timeStr) => DateTime.fromFormat(timeStr, 'HH:mm:ss').toJSDate();

  // Create courses for Technology Institute
  const techCourses = await Promise.all([
    prisma.course.upsert({
      where: { collegeId_code: { collegeId: colleges[0].id, code: 'CS101' } },
      update: {},
      create: {
        code: 'CS101',
        name: 'Introduction to Programming',
        description: 'Basic programming concepts using Python',
        collegeId: colleges[0].id,
        timetables: {
          create: [
            { dayOfWeek: 1, startTime: createTime('09:00:00'), endTime: createTime('10:00:00') },
            { dayOfWeek: 3, startTime: createTime('09:00:00'), endTime: createTime('10:00:00') },
            { dayOfWeek: 5, startTime: createTime('09:00:00'), endTime: createTime('10:00:00') }
          ]
        }
      }
    }),
    prisma.course.upsert({
      where: { collegeId_code: { collegeId: colleges[0].id, code: 'CS102' } },
      update: {},
      create: {
        code: 'CS102',
        name: 'Data Structures',
        description: 'Fundamental data structures and algorithms',
        collegeId: colleges[0].id,
        timetables: {
          create: [
            { dayOfWeek: 2, startTime: createTime('10:00:00'), endTime: createTime('11:30:00') },
            { dayOfWeek: 4, startTime: createTime('10:00:00'), endTime: createTime('11:30:00') }
          ]
        }
      }
    }),
    prisma.course.upsert({
      where: { collegeId_code: { collegeId: colleges[0].id, code: 'MA101' } },
      update: {},
      create: {
        code: 'MA101',
        name: 'Calculus I',
        description: 'Differential and integral calculus',
        collegeId: colleges[0].id,
        timetables: {
          create: [
            { dayOfWeek: 1, startTime: createTime('11:00:00'), endTime: createTime('12:00:00') },
            { dayOfWeek: 3, startTime: createTime('11:00:00'), endTime: createTime('12:00:00') },
            { dayOfWeek: 5, startTime: createTime('11:00:00'), endTime: createTime('12:00:00') }
          ]
        }
      }
    })
  ]);

  // Create courses for Science College
  await Promise.all([
    prisma.course.upsert({
      where: { collegeId_code: { collegeId: colleges[1].id, code: 'PHY101' } },
      update: {},
      create: {
        code: 'PHY101',
        name: 'Physics I',
        description: 'Classical mechanics and thermodynamics',
        collegeId: colleges[1].id,
        timetables: {
          create: [
            { dayOfWeek: 1, startTime: createTime('14:00:00'), endTime: createTime('15:30:00') },
            { dayOfWeek: 3, startTime: createTime('14:00:00'), endTime: createTime('15:30:00') }
          ]
        }
      }
    }),
    prisma.course.upsert({
      where: { collegeId_code: { collegeId: colleges[1].id, code: 'CHE101' } },
      update: {},
      create: {
        code: 'CHE101',
        name: 'Chemistry I',
        description: 'General chemistry principles',
        collegeId: colleges[1].id,
        timetables: {
          create: [
            { dayOfWeek: 2, startTime: createTime('09:00:00'), endTime: createTime('10:30:00') },
            { dayOfWeek: 4, startTime: createTime('09:00:00'), endTime: createTime('10:30:00') }
          ]
        }
      }
    })
  ]);

  console.log(`✅ Created courses with timetables`);

  // Create some enrollments
  const student1 = await prisma.student.findFirst({
    where: { user: { email: 'john.doe@student.edu' } }
  });

  const student2 = await prisma.student.findFirst({
    where: { user: { email: 'jane.smith@student.edu' } }
  });

  if (student1 && student2) {
    await prisma.enrollment.createMany({
      data: [
        { studentId: student1.id, courseId: techCourses[0].id },
        { studentId: student1.id, courseId: techCourses[2].id },
        { studentId: student2.id, courseId: techCourses[0].id },
        { studentId: student2.id, courseId: techCourses[1].id }
      ],
      skipDuplicates: true,
    });

    console.log('✅ Created sample enrollments (skipped duplicates)');
  }

  console.log('🎉 Seed completed successfully!');
  console.log('\n📝 Login credentials:');
  console.log('Admin (Tech): admin@tech.edu / Admin@123456');
  console.log('Admin (Science): admin@science.edu / Admin@123456');
  console.log('Student: john.doe@student.edu / Student@123');
  console.log('Student: jane.smith@student.edu / Student@123');
  console.log('Student: alice.johnson@student.edu / Student@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
