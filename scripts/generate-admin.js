#!/usr/bin/env node

/**
 * Generate Admin User Script
 * Creates a new college admin user
 */

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/bcrypt.utils.js';
import { USER_ROLES } from '../src/config/constants.js';
import readline from 'readline';
import { promisify } from 'util';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = promisify(rl.question).bind(rl);

async function generateAdmin() {
  console.log('🔧 Generate College Admin User\n');

  try {
    // Get colleges
    const colleges = await prisma.college.findMany({
      orderBy: { name: 'asc' }
    });

    if (colleges.length === 0) {
      console.error('❌ No colleges found. Please create a college first.');
      process.exit(1);
    }

    // Display colleges
    console.log('Available colleges:');
    colleges.forEach((college, index) => {
      console.log(`${index + 1}. ${college.name} (${college.code})`);
    });

    // Get user input
    const collegeIndex = await question('\nSelect college number: ');
    const selectedCollege = colleges[parseInt(collegeIndex) - 1];

    if (!selectedCollege) {
      console.error('❌ Invalid college selection');
      process.exit(1);
    }

    const email = await question('Admin email: ');
    const password = await question('Admin password (min 8 chars): ');
    const confirmPassword = await question('Confirm password: ');

    // Validate input
    if (!email.includes('@')) {
      console.error('❌ Invalid email format');
      process.exit(1);
    }

    if (password.length < 8) {
      console.error('❌ Password must be at least 8 characters');
      process.exit(1);
    }

    if (password !== confirmPassword) {
      console.error('❌ Passwords do not match');
      process.exit(1);
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.error('❌ User with this email already exists');
      process.exit(1);
    }

    // Create admin user
    console.log('\n⏳ Creating admin user...');
    
    const hashedPassword = await hashPassword(password);
    
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: USER_ROLES.COLLEGE_ADMIN,
        collegeAdmin: {
          create: {
            collegeId: selectedCollege.id
          }
        }
      },
      include: {
        collegeAdmin: {
          include: {
            college: true
          }
        }
      }
    });

    console.log('\n✅ Admin user created successfully!');
    console.log('\n📝 Admin Details:');
    console.log(`Email: ${user.email}`);
    console.log(`College: ${user.collegeAdmin.college.name}`);
    console.log(`Role: ${user.role}`);
    console.log('\n🔐 You can now login with these credentials');

  } catch (error) {
    console.error('\n❌ Failed to create admin:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

// Run the script
generateAdmin();
