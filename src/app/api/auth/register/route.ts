import { NextRequest, NextResponse } from 'next/server';
import { generateToken } from '@/lib/auth';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  const client = new MongoClient(process.env.DATABASE_URL || 'mongodb://localhost:27017');
  
  try {
    const body = await request.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await client.connect();
    const db = client.db('credential_manager');
    const usersCollection = db.collection('users');

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const userData = {
      email,
      password: hashedPassword,
      name,
      role: role || 'USER',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await usersCollection.insertOne(userData);
    const userId = result.insertedId.toString();

    // Create user object for JWT
    const user = {
      id: userId,
      email,
      name,
      role: role || 'USER'
    };

    // Generate JWT token
    const token = generateToken(user);

    return NextResponse.json({
      success: true,
      user,
      token
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}
