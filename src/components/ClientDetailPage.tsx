'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Plus, 
  Eye, 
  EyeOff, 
  Copy, 
  Key,
  User,
  Phone,
  MapPin,
  Mail,
  Calendar,
  Shield
} from 'lucide-react';
import { decrypt } from '@/utils/encryption';

interface Client {
  id: string;
  clientName: string;
  contactPerson: string;
  address: string;
  email?: string;
  phone?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  createdById: string;
  createdByName: string;
}

interface Credential {
  id: string;
  clientId: string;
  clientName: string;
  serviceName: string;
  username: string;
  password: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  lastAccessedAt?: string;
  createdBy: string;
  createdById: string;
  createdByName: string;
  credentialType?: string;
  url?: string;
}

interface ClientDetailPageProps {
  client: Client;
  onBack: () => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (clientId: string) => void;
  onCreateCredential: (client: Client) => void;
  onEditCredential: (credential: Credential) => void;
  onDeleteCredential: (credentialId: string) => void;
  user: any;
}

export default function ClientDetailPage({
  client,
  onBack,
  onEditClient,
  onDeleteClient,
  onCreateCredential,
  onEditCredential,
  onDeleteCredential,
  user
}: ClientDetailPageProps) {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());

  // Fetch credentials for this client
  useEffect(() => {
    const fetchCredentials = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/credentials', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          // Filter credentials for this specific client
          const clientCredentials = data.credentials.filter(
            (cred: Credential) => cred.clientId === client.id
          );
          setCredentials(clientCredentials);
        } else {
          setMessage('Failed to load credentials');
        }
      } catch (error) {
        setMessage('Failed to load credentials');
      } finally {
        setLoading(false);
      }
    };

    fetchCredentials();
  }, [client.id]);

  const togglePasswordVisibility = (credentialId: string) => {
    setVisiblePasswords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(credentialId)) {
        newSet.delete(credentialId);
      } else {
        newSet.add(credentialId);
      }
      return newSet;
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage('Copied to clipboard!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to copy to clipboard');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{client.clientName}</h1>
            <p className="text-muted-foreground">Client Details & Credentials</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEditClient(client)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Client
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCreateCredential(client)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Credential
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDeleteClient(client.id)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Client
          </Button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Information */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Contact Person</Label>
                <div className="flex items-center mt-1">
                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{client.contactPerson}</span>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                <div className="flex items-center mt-1">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{client.email}</span>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                <div className="flex items-center mt-1">
                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{client.phone}</span>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                <div className="flex items-center mt-1">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{client.address}</span>
                </div>
              </div>
              
              {client.notes && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                  <p className="mt-1 text-sm">{client.notes}</p>
                </div>
              )}
              
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Created by</span>
                  <span>{client.createdBy}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground mt-1">
                  <span>Created</span>
                  <span>{formatDate(client.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground mt-1">
                  <span>Last updated</span>
                  <span>{formatDate(client.updatedAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Credentials */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Key className="h-5 w-5 mr-2" />
                  Credentials ({credentials.length})
                </div>
                <Badge variant="secondary">
                  {user?.role === 'ADMIN' ? 'Admin View' : 'Your Credentials'}
                </Badge>
              </CardTitle>
              <CardDescription>
                {user?.role === 'ADMIN' 
                  ? 'All credentials for this client' 
                  : 'Your credentials for this client'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Loading credentials...</p>
                </div>
              ) : credentials.length === 0 ? (
                <div className="text-center py-8">
                  <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No credentials found</h3>
                  <p className="text-muted-foreground mb-4">
                    This client doesn't have any credentials yet.
                  </p>
                  <Button onClick={() => onCreateCredential(client)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Credential
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {credentials.map((credential) => (
                    <Card key={credential.id} className="border-l-4 border-l-primary">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-medium text-foreground">{credential.serviceName}</h4>
                              {credential.credentialType === 'email' && (
                                <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800">
                                  Email
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {credential.createdBy}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <Label className="text-muted-foreground">Username</Label>
                                <div className="flex items-center mt-1">
                                  <span className="font-mono bg-muted px-2 py-1 rounded text-xs">
                                    {credential.username}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="ml-2 h-6 w-6 p-0"
                                    onClick={() => copyToClipboard(credential.username)}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              
                              <div>
                                <Label className="text-muted-foreground">Password</Label>
                                <div className="flex items-center mt-1">
                                  <span className="font-mono bg-muted px-2 py-1 rounded text-xs">
                                    {visiblePasswords.has(credential.id) 
                                      ? decrypt(credential.password)
                                      : '••••••••'
                                    }
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="ml-2 h-6 w-6 p-0"
                                    onClick={() => togglePasswordVisibility(credential.id)}
                                  >
                                    {visiblePasswords.has(credential.id) ? (
                                      <EyeOff className="h-3 w-3" />
                                    ) : (
                                      <Eye className="h-3 w-3" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="ml-1 h-6 w-6 p-0"
                                    onClick={() => copyToClipboard(decrypt(credential.password))}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              
                              {/* URL for General Credentials */}
                              {credential.credentialType === 'general' && credential.url && (
                                <div className="md:col-span-2">
                                  <Label className="text-muted-foreground">URL</Label>
                                  <div className="flex items-center mt-1">
                                    <span className="font-mono bg-muted px-2 py-1 rounded text-xs break-all">
                                      {credential.url}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="ml-2 h-6 w-6 p-0"
                                      onClick={() => copyToClipboard(credential.url!)}
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {credential.notes && (
                              <div className="mt-3">
                                <Label className="text-muted-foreground">
                                  {(() => {
                                    try {
                                      const parsed = JSON.parse(credential.notes);
                                      if (parsed.incomingServer) return 'Email Configuration';
                                    } catch (e) {}
                                    return 'Notes';
                                  })()}
                                </Label>
                                <div className="text-sm mt-1">
                                  {(() => {
                                    try {
                                      const parsed = JSON.parse(credential.notes);
                                      if (parsed.incomingServer) {
                                        return (
                                          <div className="bg-muted/30 p-3 rounded-md space-y-3">
                                            {/* Incoming Server */}
                                            <div>
                                              <h5 className="text-xs font-medium text-muted-foreground mb-2">📥 Incoming Server (IMAP/POP3)</h5>
                                              <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div>
                                                  <span className="text-muted-foreground">Server:</span>
                                                  <span className="ml-1 font-mono">{parsed.incomingServer}</span>
                                                </div>
                                                <div>
                                                  <span className="text-muted-foreground">Port:</span>
                                                  <span className="ml-1 font-mono">{parsed.incomingPort}</span>
                                                </div>
                                                <div>
                                                  <span className="text-muted-foreground">Username:</span>
                                                  <span className="ml-1 font-mono break-all">{parsed.incomingUsername}</span>
                                                </div>
                                                <div>
                                                  <span className="text-muted-foreground">SSL/TLS:</span>
                                                  <span className="ml-1">{parsed.incomingSSL ? '✅ Yes' : '❌ No'}</span>
                                                </div>
                                              </div>
                                            </div>
                                            
                                            {/* Outgoing Server */}
                                            <div>
                                              <h5 className="text-xs font-medium text-muted-foreground mb-2">📤 Outgoing Server (SMTP)</h5>
                                              <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div>
                                                  <span className="text-muted-foreground">Server:</span>
                                                  <span className="ml-1 font-mono">{parsed.outgoingServer}</span>
                                                </div>
                                                <div>
                                                  <span className="text-muted-foreground">Port:</span>
                                                  <span className="ml-1 font-mono">{parsed.outgoingPort}</span>
                                                </div>
                                                <div>
                                                  <span className="text-muted-foreground">Username:</span>
                                                  <span className="ml-1 font-mono break-all">{parsed.outgoingUsername}</span>
                                                </div>
                                                <div>
                                                  <span className="text-muted-foreground">SSL/TLS:</span>
                                                  <span className="ml-1">{parsed.outgoingSSL ? '✅ Yes' : '❌ No'}</span>
                                                </div>
                                              </div>
                                            </div>
                                            
                                            {/* Additional Notes */}
                                            {parsed.additionalNotes && (
                                              <div>
                                                <h5 className="text-xs font-medium text-muted-foreground mb-1">📝 Notes</h5>
                                                <p className="text-xs text-card-foreground break-all">{parsed.additionalNotes}</p>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      }
                                    } catch (e) {}
                                    return (
                                      <div className="break-all">{credential.notes}</div>
                                    );
                                  })()}
                                </div>
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs text-muted-foreground">
                              <div className="flex items-center space-x-4">
                                <span>Created: {formatDate(credential.createdAt)}</span>
                                {credential.lastAccessedAt && (
                                  <span>Last accessed: {formatDate(credential.lastAccessedAt)}</span>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onEditCredential(credential)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onDeleteCredential(credential.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
