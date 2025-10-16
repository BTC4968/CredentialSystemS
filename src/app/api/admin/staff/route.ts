import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

// GET /api/admin/staff - Get all staff members (admin only)
export const GET = requireAuth(async (request: NextRequest, user) => {
  const client = new MongoClient(process.env.DATABASE_URL || 'mongodb://localhost:27017');
  
  try {
    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Access denied. Admin role required.' },
        { status: 403 }
      );
    }

    await client.connect();
    const db = client.db('credential_manager');
    const usersCollection = db.collection('users');

    const staff = await usersCollection.find({}).sort({ createdAt: -1 }).toArray();
    
    // Remove password field from response
    const staffWithoutPasswords = staff.map(staffMember => ({
      id: staffMember._id.toString(),
      email: staffMember.email,
      name: staffMember.name,
      role: staffMember.role,
      createdAt: staffMember.createdAt,
      updatedAt: staffMember.updatedAt
    }));

    return NextResponse.json({ staff: staffWithoutPasswords });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
});

// POST /api/admin/staff - Create new staff member (admin only)
export const POST = requireAuth(async (request: NextRequest, user) => {
  const client = new MongoClient(process.env.DATABASE_URL || 'mongodb://localhost:27017');
  
  try {
    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Access denied. Admin role required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Name, email, password, and role are required' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['ADMIN', 'USER'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be ADMIN or USER' },
        { status: 400 }
      );
    }

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

    // Create staff member
    const staffData = {
      email,
      password: hashedPassword,
      name,
      role,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await usersCollection.insertOne(staffData);
    const staffId = result.insertedId.toString();

    const newStaff = {
      id: staffId,
      email,
      name,
      role,
      createdAt: staffData.createdAt,
      updatedAt: staffData.updatedAt
    };

    return NextResponse.json({ staff: newStaff }, { status: 201 });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
});
