#!/usr/bin/env node

/**
 * Database Setup Script
 * Creates database and runs migrations
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import mysql from 'mysql2/promise';

const execAsync = promisify(exec);

// Parse DATABASE_URL
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Extract connection details from DATABASE_URL
const urlPattern = /mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/;
const match = DATABASE_URL.match(urlPattern);

if (!match) {
  console.error('❌ Invalid DATABASE_URL format');
  process.exit(1);
}

const [, user, password, host, port, database] = match;

async function setupDatabase() {
  console.log('🚀 Starting database setup...\n');

  let connection;

  try {
    // Connect to MySQL without specifying database
    connection = await mysql.createConnection({
      host,
      port: parseInt(port),
      user,
      password,
      // MySQL2 specific options
      connectTimeout: 60000,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    });

    console.log('✅ Connected to MySQL server');

    // Create database if it doesn't exist
    console.log(`📦 Creating database '${database}' if not exists...`);
    await connection.execute(
      `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log('✅ Database created/verified');

    // Run Prisma migrations
    console.log('\n🔄 Running Prisma migrations...');
    const { stdout, stderr } = await execAsync('npx prisma migrate deploy');
    
    if (stdout) console.log(stdout);
    if (stderr && !stderr.includes('warning')) console.error(stderr);

    console.log('✅ Migrations completed');

    // Generate Prisma client
    console.log('\n🔧 Generating Prisma client...');
    await execAsync('npx prisma generate');
    console.log('✅ Prisma client generated');

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Run "yarn prisma:seed" to seed the database with sample data');
    console.log('2. Run "yarn dev" to start the development server');

  } catch (error) {
    console.error('\n❌ Database setup failed:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n🔐 Access denied. Please check your database credentials in .env file');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n🔌 Connection refused. Please ensure MySQL is running on the specified host and port');
    } else if (error.code === 'ER_NOT_SUPPORTED_AUTH_MODE') {
      console.error('\n🔐 Authentication method not supported. You may need to update your MySQL user authentication plugin');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run setup
setupDatabase();
