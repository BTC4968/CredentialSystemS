'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, UserPlus } from 'lucide-react';

interface StaffMember {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  createdAt: string;
  updatedAt: string;
}

interface StaffManagementProps {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export default function StaffManagement({ user }: StaffManagementProps) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER' as 'ADMIN' | 'USER'
  });

  // Fetch staff members
  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/staff', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStaff(data.staff);
      } else {
        setError('Failed to fetch staff members');
      }
    } catch (error) {
      setError('Failed to fetch staff members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const url = editingStaff ? `/api/admin/staff/${editingStaff.id}` : '/api/admin/staff';
      const method = editingStaff ? 'PUT' : 'POST';
      
      const body = editingStaff 
        ? { role: formData.role }
        : { name: formData.name, email: formData.email, password: formData.password, role: formData.role };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setMessage(editingStaff ? 'Staff member updated successfully' : 'Staff member created successfully');
        setShowCreateForm(false);
        setEditingStaff(null);
        setFormData({ name: '', email: '', password: '', role: 'USER' });
        fetchStaff();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save staff member');
      }
    } catch (error) {
      setError('Failed to save staff member');
    }
  };

  // Handle delete staff member
  const handleDelete = async (staffId: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/staff/${staffId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setMessage('Staff member deleted successfully');
        fetchStaff();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete staff member');
      }
    } catch (error) {
      setError('Failed to delete staff member');
    }
  };

  // Handle edit staff member
  const handleEdit = (staffMember: StaffMember) => {
    setEditingStaff(staffMember);
    setFormData({
      name: staffMember.name,
      email: staffMember.email,
      password: '',
      role: staffMember.role
    });
    setShowCreateForm(true);
  };

  // Clear form
  const clearForm = () => {
    setFormData({ name: '', email: '', password: '', role: 'USER' });
    setShowCreateForm(false);
    setEditingStaff(null);
    setError('');
    setMessage('');
  };

  if (loading) {
    return <div className="p-6">Loading staff members...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Staff Management</h2>
        <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Add Staff Member
        </Button>
      </div>

      {message && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {message}
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Create/Edit Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingStaff ? 'Edit Staff Member' : 'Create New Staff Member'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingStaff && (
                <>
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={!editingStaff}
                    />
                  </div>
                </>
              )}
              
              <div>
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'USER' })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingStaff ? 'Update Staff Member' : 'Create Staff Member'}
                </Button>
                <Button type="button" variant="outline" onClick={clearForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Staff List */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Members ({staff.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {staff.map((staffMember) => (
              <div key={staffMember.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{staffMember.name}</h3>
                    <Badge variant={staffMember.role === 'ADMIN' ? 'default' : 'secondary'}>
                      {staffMember.role}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{staffMember.email}</p>
                  <p className="text-xs text-gray-500">
                    Created: {new Date(staffMember.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(staffMember)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {staffMember.id !== user.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(staffMember.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
