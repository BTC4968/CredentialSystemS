import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { MongoClient } from 'mongodb';

// GET /api/clients - Get all clients
export const GET = requireAuth(async (request: NextRequest, user) => {
  const client = new MongoClient(process.env.DATABASE_URL || 'mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('credential_manager');
    const clientsCollection = db.collection('clients');
    const credentialsCollection = db.collection('credentials');
    const usersCollection = db.collection('users');

    const clients = await clientsCollection.find({}).sort({ createdAt: -1 }).toArray();
    
    // Get credential counts and user info for each client
    const clientsWithDetails = await Promise.all(
      clients.map(async (clientDoc) => {
        const credentialCount = await credentialsCollection.countDocuments({ clientId: clientDoc._id.toString() });
        const createdByUser = await usersCollection.findOne({ _id: clientDoc.createdById });
        
        return {
          id: clientDoc._id.toString(),
          clientName: clientDoc.clientName,
          contactPerson: clientDoc.contactPerson,
          address: clientDoc.address,
          notes: clientDoc.notes,
          email: clientDoc.email,
          phone: clientDoc.phone,
          createdAt: clientDoc.createdAt,
          updatedAt: clientDoc.updatedAt,
          createdBy: clientDoc.createdBy,
          createdById: clientDoc.createdById,
          createdByUser: createdByUser ? {
            id: createdByUser._id.toString(),
            name: createdByUser.name,
            email: createdByUser.email
          } : null,
          _count: {
            credentials: credentialCount
          }
        };
      })
    );

    return NextResponse.json({ clients: clientsWithDetails });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
});

// POST /api/clients - Create a new client
export const POST = requireAuth(async (request: NextRequest, user) => {
  const client = new MongoClient(process.env.DATABASE_URL || 'mongodb://localhost:27017');
  
  try {
    const body = await request.json();
    const { clientName, contactPerson, address, notes, email, phone } = body;

    if (!clientName || !contactPerson || !address) {
      return NextResponse.json(
        { error: 'Client name, contact person, and address are required' },
        { status: 400 }
      );
    }

    await client.connect();
    const db = client.db('credential_manager');
    const clientsCollection = db.collection('clients');

    const clientData = {
      clientName,
      contactPerson,
      address,
      notes: notes || '',
      email: email || '',
      phone: phone || '',
      createdBy: user.name,
      createdById: user.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await clientsCollection.insertOne(clientData);
    const clientId = result.insertedId.toString();

    const newClient = {
      id: clientId,
      ...clientData,
      createdByUser: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    };

    return NextResponse.json({ client: newClient }, { status: 201 });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
});
