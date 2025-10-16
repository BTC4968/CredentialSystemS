'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Eye, Filter, Download, RefreshCw } from 'lucide-react';

interface AuditLog {
  _id: string;
  userId: string;
  userEmail: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  success: boolean;
  errorMessage?: string;
}

interface AuditLogsViewerProps {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export default function AuditLogsViewer({ user }: AuditLogsViewerProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    userId: '',
    action: '',
    resource: '',
    limit: '50'
  });
  const [showFilters, setShowFilters] = useState(false);

  const fetchLogs = async () => {
    if (user.role !== 'ADMIN') {
      setError('Access denied. Admin privileges required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.action) params.append('action', filters.action);
      if (filters.resource) params.append('resource', filters.resource);
      if (filters.limit) params.append('limit', filters.limit);

      const response = await fetch(`/api/audit?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch audit logs');
      }
    } catch (error) {
      setError('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return 'bg-green-100 text-green-800';
    if (action.includes('UPDATE')) return 'bg-blue-100 text-blue-800';
    if (action.includes('DELETE')) return 'bg-red-100 text-red-800';
    if (action.includes('VIEW') || action.includes('READ')) return 'bg-gray-100 text-gray-800';
    if (action.includes('EXPORT')) return 'bg-purple-100 text-purple-800';
    if (action.includes('LOGIN')) return 'bg-indigo-100 text-indigo-800';
    if (action.includes('FAILED') || action.includes('ERROR')) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getResourceColor = (resource: string) => {
    switch (resource) {
      case 'CREDENTIAL': return 'bg-yellow-100 text-yellow-800';
      case 'CLIENT': return 'bg-blue-100 text-blue-800';
      case 'USER': return 'bg-green-100 text-green-800';
      case 'SYSTEM': return 'bg-gray-100 text-gray-800';
      case 'AUTH': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'User', 'Action', 'Resource', 'Success', 'IP Address', 'Details'].join(','),
      ...logs.map(log => [
        formatTimestamp(log.timestamp),
        log.userEmail,
        log.action,
        log.resource,
        log.success ? 'Yes' : 'No',
        log.ipAddress || '',
        JSON.stringify(log.details).replace(/"/g, '""')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (user.role !== 'ADMIN') {
    return (
      <Alert>
        <AlertDescription>
          Access denied. Admin privileges required to view audit logs.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Eye className="h-6 w-6 text-blue-600" />
            <CardTitle>Audit Logs</CardTitle>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLogs}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportLogs}
              disabled={logs.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {showFilters && (
          <div className="mb-6 p-4 border rounded-lg bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="userId">User ID</Label>
                <Input
                  id="userId"
                  value={filters.userId}
                  onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                  placeholder="Filter by user ID"
                />
              </div>
              <div>
                <Label htmlFor="action">Action</Label>
                <Input
                  id="action"
                  value={filters.action}
                  onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                  placeholder="Filter by action"
                />
              </div>
              <div>
                <Label htmlFor="resource">Resource</Label>
                <Input
                  id="resource"
                  value={filters.resource}
                  onChange={(e) => setFilters({ ...filters, resource: e.target.value })}
                  placeholder="Filter by resource"
                />
              </div>
              <div>
                <Label htmlFor="limit">Limit</Label>
                <Input
                  id="limit"
                  type="number"
                  value={filters.limit}
                  onChange={(e) => setFilters({ ...filters, limit: e.target.value })}
                  placeholder="Number of logs"
                  min="1"
                  max="1000"
                />
              </div>
            </div>
            <div className="mt-4">
              <Button onClick={fetchLogs} disabled={loading}>
                Apply Filters
              </Button>
            </div>
          </div>
        )}

        {error && (
          <Alert className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading audit logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No audit logs found.</p>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log._id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Badge className={getActionColor(log.action)}>
                      {log.action}
                    </Badge>
                    <Badge className={getResourceColor(log.resource)}>
                      {log.resource}
                    </Badge>
                    <Badge variant={log.success ? 'default' : 'destructive'}>
                      {log.success ? 'Success' : 'Failed'}
                    </Badge>
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatTimestamp(log.timestamp)}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>User:</strong> {log.userEmail} ({log.userRole})
                  </div>
                  <div>
                    <strong>IP:</strong> {log.ipAddress || 'Unknown'}
                  </div>
                  {log.resourceId && (
                    <div>
                      <strong>Resource ID:</strong> {log.resourceId}
                    </div>
                  )}
                  {log.errorMessage && (
                    <div className="text-red-600">
                      <strong>Error:</strong> {log.errorMessage}
                    </div>
                  )}
                </div>
                
                {Object.keys(log.details).length > 0 && (
                  <div className="mt-2">
                    <strong>Details:</strong>
                    <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
