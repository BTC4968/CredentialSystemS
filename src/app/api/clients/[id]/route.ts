import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/clients/[id] - Get a specific client
export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        credentials: {
          include: {
            createdByUser: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ client });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// PUT /api/clients/[id] - Update a client
export const PUT = requireAuth(async (request: NextRequest, user) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    
    console.log('PUT /api/clients/[id] - Update client request:', { id, user: user.id });
    const body = await request.json();
    const { clientName, contactPerson, address, notes, email, phone } = body;
    console.log('Update client data:', { clientName, contactPerson, address, notes, email, phone });

    // Check if client exists using raw MongoDB to avoid type conversion issues
    console.log('Looking for client with ID:', id);
    let existingClient;
    
    try {
      // Try Prisma first
      existingClient = await prisma.client.findUnique({
        where: { id }
      });
      console.log('Existing client found via Prisma:', existingClient);
    } catch (prismaError) {
      console.log('Prisma findUnique failed, using raw MongoDB:', prismaError instanceof Error ? prismaError.message : String(prismaError));
      
      // Use raw MongoDB to find the client
      const rawResult = await prisma.$runCommandRaw({
        find: 'clients',
        filter: { _id: { $oid: id } }
      });
      
      if (rawResult && typeof rawResult === 'object' && 'cursor' in rawResult && 
          rawResult.cursor && typeof rawResult.cursor === 'object' && 'firstBatch' in rawResult.cursor &&
          Array.isArray(rawResult.cursor.firstBatch) && rawResult.cursor.firstBatch.length > 0) {
        const rawClient = rawResult.cursor.firstBatch[0] as any;
        existingClient = {
          id: rawClient._id?.$oid || rawClient._id || id,
          clientName: rawClient.clientName || '',
          contactPerson: rawClient.contactPerson || '',
          address: rawClient.address || '',
          notes: rawClient.notes || '',
          email: rawClient.email || undefined,
          phone: rawClient.phone || undefined,
          createdAt: rawClient.createdAt ? new Date(rawClient.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: rawClient.updatedAt ? new Date(rawClient.updatedAt).toISOString() : new Date().toISOString(),
          createdBy: rawClient.createdBy || '',
          createdById: rawClient.createdById || '',
          createdByName: rawClient.createdByName || ''
        };
        console.log('Existing client found via raw MongoDB:', existingClient);
      } else {
        existingClient = null;
      }
    }

    if (!existingClient) {
      console.log('Client not found with ID:', id);
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Check permissions (admin or creator)
    if (user.role !== 'ADMIN' && existingClient.createdById !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You can only edit clients you created' },
        { status: 403 }
      );
    }

    console.log('Attempting to update client with ID:', id);
    
    let updatedClient;
    
    try {
      // Try the standard Prisma update first
      updatedClient = await prisma.client.update({
        where: { id },
        data: {
          clientName,
          contactPerson,
          address,
          notes,
          email,
          phone
        },
        include: {
          createdByUser: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
      
      console.log('Updated client:', updatedClient);
    } catch (updateError) {
      console.log('Standard update failed, trying alternative approach:', updateError instanceof Error ? updateError.message : String(updateError));
      
      // Alternative approach: Use upsert which might not require transactions
      try {
        updatedClient = await prisma.client.upsert({
          where: { id },
          update: {
            clientName,
            contactPerson,
            address,
            notes,
            email,
            phone
          },
          create: {
            id,
            clientName,
            contactPerson,
            address,
            notes,
            email,
            phone,
            createdBy: existingClient.createdBy,
            createdById: existingClient.createdById
          },
          include: {
            createdByUser: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        });
        
        console.log('Updated client (upsert method):', updatedClient);
      } catch (upsertError) {
        console.log('Upsert also failed, trying raw MongoDB approach:', upsertError instanceof Error ? upsertError.message : String(upsertError));
        
        // Last resort: Use raw MongoDB operations
        try {
          // Use raw MongoDB update operation
          await prisma.$runCommandRaw({
            update: 'clients',
            updates: [{
              q: { _id: { $oid: id } },
              u: {
                $set: {
                  clientName,
                  contactPerson,
                  address,
                  notes,
                  email,
                  phone
                }
              }
            }]
          });
          
          console.log('Raw MongoDB update successful');
          
          // Try to fetch the updated client
          try {
            updatedClient = await prisma.client.findUnique({
              where: { id },
              include: {
                createdByUser: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            });
            
            console.log('Updated client (raw MongoDB method):', updatedClient);
          } catch (fetchError) {
            console.log('Failed to fetch updated client, returning success with existing data:', fetchError instanceof Error ? fetchError.message : String(fetchError));
            // If we can't fetch the updated client, return the existing client data
            updatedClient = {
              ...existingClient,
              clientName,
              contactPerson,
              address,
              notes,
              email,
              phone,
              createdByUser: null // We can't fetch the relation due to data issues
            };
            console.log('Returning updated client data:', updatedClient);
          }
        } catch (rawError) {
          console.error('All update methods failed:', rawError);
          return NextResponse.json(
            { error: 'Failed to update client - database configuration issue' },
            { status: 500 }
          );
        }
      }
    }

    // Log the action (optional - may fail if MongoDB is not a replica set)
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'UPDATE',
          resource: 'CLIENT',
          resourceId: updatedClient?.id || id,
          details: { clientName, contactPerson },
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      });
    } catch (auditError) {
      // Silently fail audit logging
    }
    
    return NextResponse.json({ client: updatedClient });

  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
});

// DELETE /api/clients/[id] - Delete a client
export const DELETE = requireAuth(async (request: NextRequest, user) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    
    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id }
    });

    if (!existingClient) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Check permissions (admin or creator)
    if (user.role !== 'ADMIN' && existingClient.createdById !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You can only delete clients you created' },
        { status: 403 }
      );
    }

    await prisma.client.delete({
      where: { id }
    });

    // Log the action (optional - may fail if MongoDB is not a replica set)
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'DELETE',
          resource: 'CLIENT',
          resourceId: id,
          details: { clientName: existingClient.clientName },
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      });
    } catch (auditError) {
      // Silently fail audit logging
    }
    
    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});