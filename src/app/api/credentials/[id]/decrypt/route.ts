import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { decrypt } from '@/lib/encryption';
import { prisma } from '@/lib/db';

// POST /api/credentials/[id]/decrypt - Decrypt credential password (role-based access)
export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 2]; // Get the credential ID (second to last part)
    
    const credential = await prisma.credential.findUnique({
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

    if (!credential) {
      return NextResponse.json(
        { error: 'Credential not found' },
        { status: 404 }
      );
    }

    // CRITICAL: Role-based access control
    // Admins can decrypt all credentials, users can only decrypt their own
    if (user.role !== 'ADMIN' && credential.createdById !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You can only decrypt credentials you created' },
        { status: 403 }
      );
    }

    // Decrypt the password
    const decryptedPassword = decrypt(credential.password);

    // Update last accessed timestamp
    await prisma.credential.update({
      where: { id },
      data: {
        lastAccessedAt: new Date()
      }
    });

    // Log the decryption action (optional - may fail if MongoDB is not a replica set)
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'DECRYPT',
          resource: 'CREDENTIAL',
          resourceId: credential.id,
          details: { 
            serviceName: credential.serviceName,
            clientName: credential.clientName,
            decryptedBy: user.role === 'ADMIN' ? 'admin' : 'owner'
          },
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      });
    } catch (auditError) {
      // Silently fail audit logging
    }
    
    return NextResponse.json({ 
      password: decryptedPassword,
      serviceName: credential.serviceName,
      username: credential.username
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to decrypt credential' },
      { status: 500 }
    );
  }
});