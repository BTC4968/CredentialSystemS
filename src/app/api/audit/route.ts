import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { auditLogger } from '@/lib/audit';

// GET /api/audit - Get audit logs (Admin only)
export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    // Only admins can view audit logs
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const resource = searchParams.get('resource');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Validate limit and offset
    if (limit > 1000) {
      return NextResponse.json(
        { error: 'Limit cannot exceed 1000' },
        { status: 400 }
      );
    }

    const logs = await auditLogger.getAuditLogs(
      userId || undefined,
      action || undefined,
      resource || undefined,
      limit,
      offset
    );

    return NextResponse.json({ 
      logs,
      pagination: {
        limit,
        offset,
        total: logs.length
      }
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});