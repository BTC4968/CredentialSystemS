import { NextRequest, NextResponse } from 'next/server';
import { generateToken } from '@/lib/auth';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  const client = new MongoClient(process.env.DATABASE_URL || 'mongodb://localhost:27017');
  
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await client.connect();
    const db = client.db('credential_manager');
    const usersCollection = db.collection('users');

    // Find user by email
    const userDoc = await usersCollection.findOne({ email });

    if (!userDoc) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, userDoc.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create user object for JWT
    const user = {
      id: userDoc._id.toString(),
      email: userDoc.email,
      name: userDoc.name,
      role: userDoc.role
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
