import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { encrypt } from '@/lib/encryption';
import { MongoClient, ObjectId } from 'mongodb';
import { SecurityManager } from '@/lib/security';
import { auditLogger, createAuditEntry, auditActions, auditResources } from '@/lib/audit';
import { prisma } from '@/lib/db';

// GET /api/credentials - Get credentials (filtered by user role)
export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    // Log the access attempt
    await auditLogger.log(createAuditEntry(
      user,
      auditActions.VIEW_CREDENTIAL,
      auditResources.CREDENTIAL,
      { clientId },
      true,
      undefined,
      { ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown', headers: Object.fromEntries(request.headers) }
    ));

    let whereClause: any = {};

    // Filter by client if specified
    if (clientId) {
      whereClause.clientId = clientId;
    }

    // Filter by user role - CRITICAL: Users can only see their own credentials, Admins can see all
    if (user.role !== 'ADMIN') {
      whereClause.createdById = user.id;
    }

    // Connect to MongoDB
    const client = new MongoClient(process.env.DATABASE_URL || 'mongodb://localhost:27017');
    await client.connect();
    const db = client.db('credential_manager');
    const credentialsCollection = db.collection('credentials');
    const clientsCollection = db.collection('clients');
    const usersCollection = db.collection('users');

    const credentials = await credentialsCollection.find(whereClause).sort({ createdAt: -1 }).toArray();
    
    // Get related data for each credential
    const credentialsWithDetails = await Promise.all(
      credentials.map(async (credDoc) => {
        const clientDoc = await clientsCollection.findOne({ _id: new ObjectId(credDoc.clientId) });
        const createdByUser = await usersCollection.findOne({ _id: new ObjectId(credDoc.createdById) });
        
        return {
          id: credDoc._id.toString(),
          serviceName: credDoc.serviceName,
          username: credDoc.username,
          password: credDoc.password, // This is encrypted
          url: credDoc.url || '',
          notes: credDoc.notes,
          credentialType: credDoc.credentialType || 'general', // Default to general for backward compatibility
          createdAt: credDoc.createdAt,
          updatedAt: credDoc.updatedAt,
          clientId: credDoc.clientId,
          createdById: credDoc.createdById,
          client: clientDoc ? {
            id: clientDoc._id.toString(),
            clientName: clientDoc.clientName,
            contactPerson: clientDoc.contactPerson
          } : null,
          createdByUser: createdByUser ? {
            id: createdByUser._id.toString(),
            name: createdByUser.name,
            email: createdByUser.email
          } : null
        };
      })
    );

    await client.close();

    // Log the access action
    // Log the action (optional - may fail if MongoDB is not a replica set)

    try {

      await prisma.auditLog.create({

            data: {

              userId: user.id,

              action: 'READ',

              resource: 'CREDENTIAL',

              details: { 

                credentialCount: credentials.length,

                clientId: clientId || 'all',

                userRole: user.role

              },

              ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown' || request.headers.get('x-forwarded-for') || 'unknown',

              userAgent: request.headers.get('user-agent') || 'unknown'

            }

          });

      

          

    } catch (auditError) {
      // Silently fail audit logging
    }
    
    return NextResponse.json({ credentials: credentialsWithDetails });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// POST /api/credentials - Create a new credential
export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json();
    const { 
      clientId, 
      serviceName, 
      credentialType = 'general',
      // General credential fields
      email,
      password,
      url,
      notes,
      // Email credential fields
      incomingServer,
      incomingUsername,
      incomingPassword,
      incomingPort,
      incomingSSL,
      outgoingServer,
      outgoingUsername,
      outgoingPassword,
      outgoingPort,
      outgoingSSL
    } = SecurityManager.sanitizeInput(body);

    // Validate required fields based on credential type
    let validationError = null;
    
    if (!clientId || !serviceName) {
      validationError = 'Client ID and service name are required';
    } else if (credentialType === 'general') {
      if (!email || !password) {
        validationError = 'Email and password are required for general credentials';
      }
    } else if (credentialType === 'email') {
      if (!incomingServer || !incomingPort || !incomingUsername || !incomingPassword ||
          !outgoingServer || !outgoingPort || !outgoingUsername || !outgoingPassword) {
        validationError = 'All email server fields are required for email credentials';
      }
    }

    if (validationError) {
      await auditLogger.log(createAuditEntry(
        user,
        auditActions.CREATE_CREDENTIAL,
        auditResources.CREDENTIAL,
        { error: 'Missing required fields', credentialType },
        false,
        'Missing required fields',
        { ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown', headers: Object.fromEntries(request.headers) }
      ));
      
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      );
    }

    // Validate input lengths based on credential type
    let lengthValidationError = null;
    
    if (serviceName.length > 100) {
      lengthValidationError = 'Service name is too long (max 100 characters)';
    } else if (credentialType === 'general') {
      if (email && email.length > 100) {
        lengthValidationError = 'Email is too long (max 100 characters)';
      } else if (password && password.length > 500) {
        lengthValidationError = 'Password is too long (max 500 characters)';
      } else if (url && url.length > 200) {
        lengthValidationError = 'URL is too long (max 200 characters)';
      }
    } else if (credentialType === 'email') {
      if (incomingUsername && incomingUsername.length > 100) {
        lengthValidationError = 'Incoming username is too long (max 100 characters)';
      } else if (incomingPassword && incomingPassword.length > 500) {
        lengthValidationError = 'Incoming password is too long (max 500 characters)';
      } else if (outgoingUsername && outgoingUsername.length > 100) {
        lengthValidationError = 'Outgoing username is too long (max 100 characters)';
      } else if (outgoingPassword && outgoingPassword.length > 500) {
        lengthValidationError = 'Outgoing password is too long (max 500 characters)';
      }
    }

    if (lengthValidationError) {
      await auditLogger.log(createAuditEntry(
        user,
        auditActions.CREATE_CREDENTIAL,
        auditResources.CREDENTIAL,
        { error: 'Input too long', credentialType },
        false,
        'Input validation failed',
        { ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown', headers: Object.fromEntries(request.headers) }
      ));
      
      return NextResponse.json(
        { error: lengthValidationError },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const client = new MongoClient(process.env.DATABASE_URL || 'mongodb://localhost:27017');
    await client.connect();
    const db = client.db('credential_manager');
    const credentialsCollection = db.collection('credentials');
    const clientsCollection = db.collection('clients');

    // Verify client exists
    const clientDoc = await clientsCollection.findOne({ _id: new ObjectId(clientId) });

    if (!clientDoc) {
      await client.close();
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Prepare credential data based on type
    let credentialData;
    
    if (credentialType === 'general') {
      // For general credentials, use email as username and encrypt the password
      const encryptedPassword = encrypt(password);
      
      credentialData = {
        clientId,
        clientName: clientDoc.clientName,
        serviceName,
        username: email, // Use email as username for general credentials
        password: encryptedPassword,
        url: url || '',
        notes: notes || '',
        credentialType: 'general',
        createdById: user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } else {
      // For email credentials, use incoming username and encrypt incoming password
      const encryptedIncomingPassword = encrypt(incomingPassword);
      const encryptedOutgoingPassword = encrypt(outgoingPassword);
      
      // Store email config as JSON in notes
      const emailConfig = {
        incomingServer,
        incomingPort,
        incomingUsername,
        incomingSSL,
        outgoingServer,
        outgoingPort,
        outgoingUsername,
        outgoingPassword: encryptedOutgoingPassword,
        outgoingSSL,
        additionalNotes: notes || ''
      };
      
      credentialData = {
        clientId,
        clientName: clientDoc.clientName,
        serviceName,
        username: incomingUsername, // Use incoming username as main username
        password: encryptedIncomingPassword, // Use incoming password as main password
        url: '', // No URL for email credentials
        notes: JSON.stringify(emailConfig),
        credentialType: 'email',
        createdById: user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }

    const result = await credentialsCollection.insertOne(credentialData);
    const credentialId = result.insertedId.toString();

    const credential = {
      id: credentialId,
      serviceName: credentialData.serviceName,
      username: credentialData.username,
      password: credentialData.password, // This is encrypted
      url: credentialData.url,
      notes: credentialData.notes,
      credentialType: credentialData.credentialType,
      createdAt: credentialData.createdAt,
      updatedAt: credentialData.updatedAt,
      clientId: credentialData.clientId,
      createdById: credentialData.createdById,
      client: {
        id: clientDoc._id.toString(),
        clientName: clientDoc.clientName,
        contactPerson: clientDoc.contactPerson
      },
      createdByUser: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    };

    await client.close();

    // Log successful credential creation
    await auditLogger.log(createAuditEntry(
      user,
      auditActions.CREATE_CREDENTIAL,
      auditResources.CREDENTIAL,
      { 
        credentialId,
        serviceName,
        clientId,
        clientName: clientDoc.clientName
      },
      true,
      undefined,
      { ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown', headers: Object.fromEntries(request.headers) }
    ));

    return NextResponse.json({ credential }, { status: 201 });

  } catch (error) {
    // Log the error
    await auditLogger.log(createAuditEntry(
      user,
      auditActions.CREATE_CREDENTIAL,
      auditResources.CREDENTIAL,
      { error: error instanceof Error ? error.message : 'Unknown error' },
      false,
      'Failed to create credential',
      { ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown', headers: Object.fromEntries(request.headers) }
    ));
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
