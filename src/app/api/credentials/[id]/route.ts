import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { encrypt, decrypt } from '@/lib/encryption';
import { prisma } from '@/lib/db';

// GET /api/credentials/[id] - Get a specific credential (with role-based access)
export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    const requestUrl = new URL(request.url);
    const pathParts = requestUrl.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    
    let credential;
    try {
      credential = await prisma.credential.findUnique({
        where: { id },
      include: {
        client: {
          select: {
            id: true,
            clientName: true,
            contactPerson: true
          }
        },
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    } catch (prismaError) {
      console.error('Prisma error when finding credential:', prismaError);
      
      // Try raw MongoDB query as fallback for corrupted DateTime fields
      try {
        console.log('Attempting raw MongoDB query for credential:', id);
        
        // Try different ObjectId formats and collection names
        let rawCredential;
        let credentialData;
        
        // First try with ObjectId format
        try {
          rawCredential = await prisma.$runCommandRaw({
            find: 'credentials',
            filter: { _id: { $oid: id } },
            limit: 1
          });
          console.log('Raw credential result (ObjectId):', rawCredential);
        } catch (oidError) {
          console.log('ObjectId format failed, trying string format:', oidError instanceof Error ? oidError.message : String(oidError));
          
          // Try with string format
          rawCredential = await prisma.$runCommandRaw({
            find: 'credentials',
            filter: { _id: id },
            limit: 1
          });
          console.log('Raw credential result (string):', rawCredential);
        }
        
        if (rawCredential && (rawCredential as any).cursor && (rawCredential as any).cursor.firstBatch && (rawCredential as any).cursor.firstBatch.length > 0) {
          credentialData = (rawCredential as any).cursor.firstBatch[0];
          console.log('Found credential data:', credentialData);
          
          // Handle different _id formats
          let credentialId;
          if (credentialData._id && credentialData._id.$oid) {
            credentialId = credentialData._id.$oid;
          } else if (credentialData._id) {
            credentialId = credentialData._id.toString();
          } else {
            credentialId = id; // fallback to original id
          }
          
          credential = {
            id: credentialId,
            clientId: credentialData.clientId,
            clientName: credentialData.clientName,
            serviceName: credentialData.serviceName,
            username: credentialData.username,
            password: credentialData.password,
            notes: credentialData.notes,
            url: credentialData.url,
            credentialType: credentialData.credentialType || 'general',
            createdAt: new Date(credentialData.createdAt),
            updatedAt: new Date(credentialData.updatedAt),
            lastAccessedAt: credentialData.lastAccessedAt ? new Date(credentialData.lastAccessedAt) : null,
            createdBy: credentialData.createdBy,
            createdById: credentialData.createdById,
            client: null, // We can't fetch the relation due to data issues
            createdByUser: null
          };
          console.log('Successfully retrieved credential via raw MongoDB query');
        } else {
          console.log('No credential found in raw MongoDB query');
          return NextResponse.json(
            { error: 'Credential not found' },
            { status: 404 }
          );
        }
      } catch (rawError) {
        console.error('Raw MongoDB query also failed:', rawError);
        return NextResponse.json(
          { error: 'Failed to access credential due to data inconsistency' },
          { status: 500 }
        );
      }
    }

    if (!credential) {
      return NextResponse.json(
        { error: 'Credential not found' },
        { status: 404 }
      );
    }

    // CRITICAL: Role-based access control
    if (user.role !== 'ADMIN' && credential.createdById !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You can only access credentials you created' },
        { status: 403 }
      );
    }

    // Decrypt password for authorized users only
    const decryptedCredential = {
      ...credential,
      password: decrypt(credential.password)
    };

    // Log the access action (optional - may fail if MongoDB is not a replica set)
    try {
      await prisma.auditLog.create({
            data: {
              userId: user.id,
          action: 'VIEW',
              resource: 'CREDENTIAL',
              resourceId: credential.id,
              details: { 
                serviceName: credential.serviceName,
            clientName: credential.clientName
          },
              ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
              userAgent: request.headers.get('user-agent') || 'unknown'
        }
      });
    } catch (auditError) {
      // Silently fail audit logging
    }
    
    return NextResponse.json({ credential: decryptedCredential });

  } catch (error) {
    console.error('Error in credential operation:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
});

// PUT /api/credentials/[id] - Update a credential
export const PUT = requireAuth(async (request: NextRequest, user) => {
  try {
    const requestUrl = new URL(request.url);
    const pathParts = requestUrl.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    
    const body = await request.json();
    const { 
      clientId, 
      serviceName, 
      credentialType = 'general',
      // General credential fields
      email,
      password,
      url: credentialUrl,
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
    } = body;

    console.log('PUT /api/credentials/[id] - Update credential request:', { id, user: user.id, credentialType });

    // Check if credential exists
    let existingCredential;
    try {
      existingCredential = await prisma.credential.findUnique({
        where: { id }
      });
    } catch (prismaError) {
      console.error('Prisma error when finding credential for update:', prismaError);
      
      // Try raw MongoDB query as fallback for corrupted DateTime fields
      try {
        console.log('Attempting raw MongoDB query for credential:', id);
        
        // Try different ObjectId formats and collection names
        let rawCredential;
        let credentialData;
        
        // First try with ObjectId format
        try {
          rawCredential = await prisma.$runCommandRaw({
            find: 'credentials',
            filter: { _id: { $oid: id } },
            limit: 1
          });
          console.log('Raw credential result (ObjectId):', rawCredential);
        } catch (oidError) {
          console.log('ObjectId format failed, trying string format:', oidError instanceof Error ? oidError.message : String(oidError));
          
          // Try with string format
          rawCredential = await prisma.$runCommandRaw({
            find: 'credentials',
            filter: { _id: id },
            limit: 1
          });
          console.log('Raw credential result (string):', rawCredential);
        }
        
        // If still no results, try to find any credentials to debug
        if (!rawCredential || !(rawCredential as any).cursor || !(rawCredential as any).cursor.firstBatch || (rawCredential as any).cursor.firstBatch.length === 0) {
          console.log('No credential found, trying to list all credentials for debugging...');
          try {
            const allCredentials = await prisma.$runCommandRaw({
              find: 'credentials',
              filter: {},
              limit: 5
            });
            console.log('Sample credentials in database:', allCredentials);
            
            // Also try with different collection names
            const altCredentials = await prisma.$runCommandRaw({
              find: 'credentials',
              filter: {},
              limit: 5
            });
            console.log('Sample credentials (lowercase collection):', altCredentials);
          } catch (debugError) {
            console.log('Debug query failed:', debugError instanceof Error ? debugError.message : String(debugError));
          }
        }
        
        if (rawCredential && (rawCredential as any).cursor && (rawCredential as any).cursor.firstBatch && (rawCredential as any).cursor.firstBatch.length > 0) {
          credentialData = (rawCredential as any).cursor.firstBatch[0];
          console.log('Found credential data:', credentialData);
          
          // Handle different _id formats
          let credentialId;
          if (credentialData._id && credentialData._id.$oid) {
            credentialId = credentialData._id.$oid;
          } else if (credentialData._id) {
            credentialId = credentialData._id.toString();
          } else {
            credentialId = id; // fallback to original id
          }
          
          existingCredential = {
            id: credentialId,
            clientId: credentialData.clientId,
            clientName: credentialData.clientName,
            serviceName: credentialData.serviceName,
            username: credentialData.username,
            password: credentialData.password,
            notes: credentialData.notes,
            url: credentialData.url,
            credentialType: credentialData.credentialType || 'general',
            createdAt: new Date(credentialData.createdAt),
            updatedAt: new Date(credentialData.updatedAt),
            lastAccessedAt: credentialData.lastAccessedAt ? new Date(credentialData.lastAccessedAt) : null,
            createdBy: credentialData.createdBy,
            createdById: credentialData.createdById
          };
          console.log('Successfully retrieved credential via raw MongoDB query');
        } else {
          console.log('No credential found in raw MongoDB query');
          return NextResponse.json(
            { error: 'Credential not found' },
            { status: 404 }
          );
        }
      } catch (rawError) {
        console.error('Raw MongoDB query also failed:', rawError);
        return NextResponse.json(
          { error: 'Failed to access credential due to data inconsistency' },
          { status: 500 }
        );
      }
    }

    if (!existingCredential) {
      return NextResponse.json(
        { error: 'Credential not found' },
        { status: 404 }
      );
    }

    // CRITICAL: Role-based access control
    if (user.role !== 'ADMIN' && existingCredential.createdById !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You can only edit credentials you created' },
        { status: 403 }
      );
    }

    // Verify client exists if clientId is provided
    let clientName = existingCredential.clientName;
    if (clientId && clientId !== existingCredential.clientId) {
      const client = await prisma.client.findUnique({
        where: { id: clientId }
      });

      if (!client) {
        return NextResponse.json(
          { error: 'Client not found' },
          { status: 404 }
        );
      }
      clientName = client.clientName;
    }

    // Prepare update data based on credential type
    let updateData: any = {
        clientId: clientId || existingCredential.clientId,
        clientName,
        serviceName: serviceName || existingCredential.serviceName,
      credentialType: credentialType || existingCredential.credentialType || 'general'
    };

    if (credentialType === 'general') {
      // For general credentials
      updateData.username = email || existingCredential.username;
      updateData.password = password ? encrypt(password) : existingCredential.password;
      updateData.url = credentialUrl !== undefined ? credentialUrl : existingCredential.url;
      updateData.notes = notes !== undefined ? notes : existingCredential.notes;
    } else {
      // For email credentials
      updateData.username = incomingUsername || existingCredential.username;
      updateData.password = incomingPassword ? encrypt(incomingPassword) : existingCredential.password;
      updateData.url = ''; // No URL for email credentials
      
      // Store email config as JSON in notes
      const emailConfig = {
        incomingServer: incomingServer || '',
        incomingPort: incomingPort || '',
        incomingUsername: incomingUsername || '',
        incomingSSL: incomingSSL || false,
        outgoingServer: outgoingServer || '',
        outgoingPort: outgoingPort || '',
        outgoingUsername: outgoingUsername || '',
        outgoingPassword: outgoingPassword ? encrypt(outgoingPassword) : '',
        outgoingSSL: outgoingSSL || false,
        additionalNotes: notes || ''
      };
      
      updateData.notes = JSON.stringify(emailConfig);
    }

    console.log('Attempting to update credential with ID:', id);

    let updatedCredential;

    try {
      // Try the standard Prisma update first
      updatedCredential = await prisma.credential.update({
        where: { id },
        data: updateData,
        include: {
          client: {
            select: {
              id: true,
              clientName: true,
              contactPerson: true
            }
          },
          createdByUser: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      console.log('Updated credential:', updatedCredential);
    } catch (updateError) {
      console.log('Standard update failed, trying alternative approach:', updateError instanceof Error ? updateError.message : String(updateError));

      // Alternative approach: Use upsert which might not require transactions
      try {
        updatedCredential = await prisma.credential.upsert({
          where: { id },
          update: updateData,
          create: {
            id,
            ...updateData,
            createdBy: existingCredential.createdBy,
            createdById: existingCredential.createdById,
            createdAt: existingCredential.createdAt
      },
      include: {
        client: {
          select: {
            id: true,
            clientName: true,
            contactPerson: true
          }
        },
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

        console.log('Updated credential (upsert method):', updatedCredential);
      } catch (upsertError) {
        console.log('Upsert also failed, trying raw MongoDB approach:', upsertError instanceof Error ? upsertError.message : String(upsertError));

        // Last resort: Use raw MongoDB operations
        try {
          // Use raw MongoDB update operation
          await prisma.$runCommandRaw({
            update: 'credentials',
            updates: [{
              q: { _id: { $oid: id } },
              u: {
                $set: {
                  ...updateData,
                  updatedAt: new Date()
                }
              }
            }]
          });

          console.log('Raw MongoDB update successful');

          // Try to fetch the updated credential
          try {
            updatedCredential = await prisma.credential.findUnique({
              where: { id },
              include: {
                client: {
                  select: {
                    id: true,
                    clientName: true,
                    contactPerson: true
                  }
                },
                createdByUser: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            });

            console.log('Updated credential (raw MongoDB method):', updatedCredential);
          } catch (fetchError) {
            console.log('Failed to fetch updated credential via Prisma, trying raw MongoDB query:', fetchError instanceof Error ? fetchError.message : String(fetchError));
            
            // Try raw MongoDB query as fallback for corrupted DateTime fields
            try {
              // Try different ObjectId formats
              let rawUpdatedCredential;
              let credentialData;
              
              // First try with ObjectId format
              try {
                rawUpdatedCredential = await prisma.$runCommandRaw({
                  find: 'credentials',
                  filter: { _id: { $oid: id } },
                  limit: 1
                });
                console.log('Raw updated credential result (ObjectId):', rawUpdatedCredential);
              } catch (oidError) {
                console.log('ObjectId format failed, trying string format:', oidError instanceof Error ? oidError.message : String(oidError));
                
                // Try with string format
                rawUpdatedCredential = await prisma.$runCommandRaw({
                  find: 'credentials',
                  filter: { _id: id },
                  limit: 1
                });
                console.log('Raw updated credential result (string):', rawUpdatedCredential);
              }
              
              if (rawUpdatedCredential && (rawUpdatedCredential as any).cursor && (rawUpdatedCredential as any).cursor.firstBatch && (rawUpdatedCredential as any).cursor.firstBatch.length > 0) {
                credentialData = (rawUpdatedCredential as any).cursor.firstBatch[0];
                console.log('Found updated credential data:', credentialData);
                
                // Handle different _id formats
                let credentialId;
                if (credentialData._id && credentialData._id.$oid) {
                  credentialId = credentialData._id.$oid;
                } else if (credentialData._id) {
                  credentialId = credentialData._id.toString();
                } else {
                  credentialId = id; // fallback to original id
                }
                
                updatedCredential = {
                  id: credentialId,
                  clientId: credentialData.clientId,
                  clientName: credentialData.clientName,
                  serviceName: credentialData.serviceName,
                  username: credentialData.username,
                  password: credentialData.password,
                  notes: credentialData.notes,
                  url: credentialData.url,
                  credentialType: credentialData.credentialType || 'general',
                  createdAt: new Date(credentialData.createdAt),
                  updatedAt: new Date(credentialData.updatedAt),
                  lastAccessedAt: credentialData.lastAccessedAt ? new Date(credentialData.lastAccessedAt) : null,
                  createdBy: credentialData.createdBy,
                  createdById: credentialData.createdById,
                  client: null, // We can't fetch the relation due to data issues
                  createdByUser: null
                };
                console.log('Successfully retrieved updated credential via raw MongoDB query');
              } else {
                console.log('No updated credential found in raw MongoDB query');
                // If we can't fetch the updated credential, return the existing credential data
                updatedCredential = {
                  ...existingCredential,
                  ...updateData,
                  client: null, // We can't fetch the relation due to data issues
                  createdByUser: null
                };
                console.log('Returning updated credential data (fallback):', updatedCredential);
              }
            } catch (rawFetchError) {
              console.log('Raw MongoDB fetch also failed, returning success with existing data:', rawFetchError instanceof Error ? rawFetchError.message : String(rawFetchError));
              // If we can't fetch the updated credential, return the existing credential data
              updatedCredential = {
                ...existingCredential,
                ...updateData,
                client: null, // We can't fetch the relation due to data issues
                createdByUser: null
              };
              console.log('Returning updated credential data (final fallback):', updatedCredential);
            }
          }
        } catch (rawError) {
          console.error('All update methods failed:', rawError);
          return NextResponse.json(
            { error: 'Failed to update credential - database configuration issue' },
            { status: 500 }
          );
        }
      }
    }

    // Log the update action (optional - may fail if MongoDB is not a replica set)
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
              action: 'UPDATE',
              resource: 'CREDENTIAL',
          resourceId: updatedCredential.id,
              details: { 
            serviceName: updatedCredential.serviceName,
            clientName: updatedCredential.clientName,
            credentialType: updatedCredential.credentialType,
                fieldsUpdated: Object.keys(body).filter(key => body[key] !== undefined)
              },
              ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
              userAgent: request.headers.get('user-agent') || 'unknown'
        }
      });
    } catch (auditError) {
      // Silently fail audit logging
    }
    
    return NextResponse.json({ credential: updatedCredential });

  } catch (error) {
    console.error('Error in credential operation:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
});

// DELETE /api/credentials/[id] - Delete a credential
export const DELETE = requireAuth(async (request: NextRequest, user) => {
  try {
    const requestUrl = new URL(request.url);
    const pathParts = requestUrl.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    
    console.log('DELETE /api/credentials/[id] - Delete credential request:', { id, user: user.id });
    // Check if credential exists
    let existingCredential;
    try {
      existingCredential = await prisma.credential.findUnique({
        where: { id }
      });
    } catch (prismaError) {
      console.error('Prisma error when finding credential:', prismaError);
      // If there's a data inconsistency, try to delete directly
      try {
        await prisma.credential.delete({
          where: { id }
        });
        console.log('Credential deleted successfully despite data inconsistency:', id);
        return NextResponse.json({ success: true });
      } catch (deleteError) {
        console.error('Error deleting credential:', deleteError);
        return NextResponse.json(
          { error: 'Failed to delete credential due to data inconsistency' },
          { status: 500 }
        );
      }
    }

    if (!existingCredential) {
      return NextResponse.json(
        { error: 'Credential not found' },
        { status: 404 }
      );
    }

    // CRITICAL: Role-based access control
    if (user.role !== 'ADMIN' && existingCredential.createdById !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You can only delete credentials you created' },
        { status: 403 }
      );
    }

    await prisma.credential.delete({
      where: { id }
    });

    console.log('Credential deleted successfully:', id);

    // Log the delete action (optional - may fail if MongoDB is not a replica set)
    try {
      await prisma.auditLog.create({
            data: {
              userId: user.id,
              action: 'DELETE',
              resource: 'CREDENTIAL',
          resourceId: id,
              details: { 
                serviceName: existingCredential.serviceName,
                clientName: existingCredential.clientName
              },
              ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
              userAgent: request.headers.get('user-agent') || 'unknown'
        }
      });
    } catch (auditError) {
      // Silently fail audit logging
    }
    
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in credential operation:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
});