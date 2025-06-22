#!/usr/bin/env node

/**
 * Test Database Setup Script
 * Creates test database for running tests
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import mysql from 'mysql2/promise';

const execAsync = promisify(exec);

// Use TEST_DATABASE_URL or modify DATABASE_URL
const DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL.replace(/\/[^/]+(\?|$)/, '/student_enrollment_test$1');

// Extract connection details
const urlPattern = /mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/;
const match = DATABASE_URL.match(urlPattern);

if (!match) {
  console.error('❌ Invalid DATABASE_URL format');
  process.exit(1);
}

const [, user, password, host, port, database] = match;

async function setupTestDatabase() {
  console.log('🧪 Setting up test database...\n');

  let connection;

  try {
    // Connect to MySQL
    connection = await mysql.createConnection({
      host,
      port: parseInt(port),
      user,
      password,
      connectTimeout: 60000,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    });

    console.log('✅ Connected to MySQL server');

    // Drop existing test database if exists
    console.log(`🗑️  Dropping existing test database if exists...`);
    await connection.execute(`DROP DATABASE IF EXISTS \`${database}\``);
    
    // Create test database
    console.log(`📦 Creating test database '${database}'...`);
    await connection.execute(
      `CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log('✅ Test database created');

    // Update environment variable for Prisma
    process.env.DATABASE_URL = DATABASE_URL;

    // Run migrations
    console.log('\n🔄 Running Prisma migrations...');
    const { stdout, stderr } = await execAsync('npx prisma migrate deploy');
    
    if (stdout) console.log(stdout);
    if (stderr && !stderr.includes('warning')) console.error(stderr);

    console.log('✅ Migrations completed');

    console.log('\n🎉 Test database setup completed successfully!');
    console.log(`📝 Test database URL: ${DATABASE_URL}`);

  } catch (error) {
    console.error('\n❌ Test database setup failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run setup
setupTestDatabase();
