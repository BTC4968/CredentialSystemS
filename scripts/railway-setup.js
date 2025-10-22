#!/usr/bin/env node

/**
 * Railway Setup Script
 * This script helps set up the database and create initial admin user
 */

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017';
const DB_NAME = 'credential_manager';

async function setupDatabase() {
  const client = new MongoClient(DATABASE_URL);
  
  try {
    console.log('Connecting to database...');
    await client.connect();
    
    const db = client.db(DB_NAME);
    console.log('Connected to database successfully');
    
    // Check if admin user exists
    const usersCollection = db.collection('users');
    const adminUser = await usersCollection.findOne({ role: 'ADMIN' });
    
    if (adminUser) {
      console.log('Admin user already exists:', adminUser.email);
      return;
    }
    
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const adminData = {
      email: 'admin@gmail.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await usersCollection.insertOne(adminData);
    console.log('Admin user created successfully:', result.insertedId);
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run setup
setupDatabase();
