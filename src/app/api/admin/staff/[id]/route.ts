import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { MongoClient, ObjectId } from 'mongodb';

// PUT /api/admin/staff/[id] - Update staff member role (admin only)
export const PUT = requireAuth(async (request: NextRequest, user) => {
  const client = new MongoClient(process.env.DATABASE_URL || 'mongodb://localhost:27017');
  
  try {
    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Access denied. Admin role required.' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    const body = await request.json();
    const { role } = body;

    if (!role) {
      return NextResponse.json(
        { error: 'Role is required' },
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

    // Check if staff member exists
    const staffMember = await usersCollection.findOne({ _id: new ObjectId(id) });
    
    if (!staffMember) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      );
    }

    // Update staff member role
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          role,
          updatedAt: new Date()
        }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to update staff member' },
        { status: 500 }
      );
    }

    // Get updated staff member
    const updatedStaff = await usersCollection.findOne({ _id: new ObjectId(id) });

    if (!updatedStaff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      );
    }

    const responseStaff = {
      id: updatedStaff._id.toString(),
      email: updatedStaff.email,
      name: updatedStaff.name,
      role: updatedStaff.role,
      createdAt: updatedStaff.createdAt,
      updatedAt: updatedStaff.updatedAt
    };

    return NextResponse.json({ staff: responseStaff });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
});

// DELETE /api/admin/staff/[id] - Delete staff member (admin only)
export const DELETE = requireAuth(async (request: NextRequest, user) => {
  const client = new MongoClient(process.env.DATABASE_URL || 'mongodb://localhost:27017');
  
  try {
    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Access denied. Admin role required.' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    await client.connect();
    const db = client.db('credential_manager');
    const usersCollection = db.collection('users');

    // Check if staff member exists
    const staffMember = await usersCollection.findOne({ _id: new ObjectId(id) });
    
    if (!staffMember) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      );
    }

    // Prevent admin from deleting themselves
    if (staffMember._id.toString() === user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Delete staff member
    const result = await usersCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to delete staff member' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Staff member deleted successfully' });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
});
