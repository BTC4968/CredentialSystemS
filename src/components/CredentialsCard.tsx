'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Key, 
  Plus, 
  Eye, 
  EyeOff, 
  Copy, 
  Edit, 
  Trash2,
  User,
  Lock
} from 'lucide-react';

interface Credential {
  id: string;
  clientId: string;
  clientName: string;
  serviceName: string;
  username: string;
  password: string;
  notes: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt?: string;
  lastAccessedAt?: string;
  credentialType?: string;
  url?: string;
}

interface CredentialsCardProps {
  credentials: Credential[];
  user: any;
  onAddCredential: () => void;
  onEditCredential: (credential: Credential) => void;
  onDeleteCredential: (credentialId: string) => void;
  onDecryptPassword: (credentialId: string) => Promise<string>;
}

export default function CredentialsCard({ 
  credentials, 
  user, 
  onAddCredential, 
  onEditCredential, 
  onDeleteCredential,
  onDecryptPassword
}: CredentialsCardProps) {
  const [showPasswords, setShowPasswords] = useState<{[key: string]: boolean}>({});
  const [decryptedPasswords, setDecryptedPasswords] = useState<{[key: string]: string}>({});
  const [expandedNotes, setExpandedNotes] = useState<{[key: string]: boolean}>({});

  const togglePasswordVisibility = (credentialId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [credentialId]: !prev[credentialId]
    }));
  };

  const handleDecryptPassword = async (credentialId: string) => {
    if (decryptedPasswords[credentialId]) {
      return decryptedPasswords[credentialId];
    }
    
    try {
      const decryptedPassword = await onDecryptPassword(credentialId);
      setDecryptedPasswords(prev => ({
        ...prev,
        [credentialId]: decryptedPassword
      }));
      return decryptedPassword;
    } catch (error) {
      return '[DECRYPTION FAILED]';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatNotes = (credential: Credential) => {
    if (!credential.notes) return null;
    
    // Try to parse as JSON for email credentials
    try {
      const parsed = JSON.parse(credential.notes);
      if (parsed.incomingServer) {
        // This is an email credential
        return {
          type: 'email',
          summary: `Email Server: ${parsed.incomingServer}:${parsed.incomingPort}`,
          full: credential.notes,
          additionalNotes: parsed.additionalNotes || '',
          emailConfig: parsed
        };
      }
    } catch (e) {
      // Not JSON, treat as regular notes
    }
    
    // Regular notes
    return {
      type: 'general',
      summary: credential.notes.length > 100 ? credential.notes.substring(0, 100) + '...' : credential.notes,
      full: credential.notes,
      additionalNotes: '',
      emailConfig: null
    };
  };

  const toggleNotesExpansion = (credentialId: string) => {
    setExpandedNotes(prev => ({
      ...prev,
      [credentialId]: !prev[credentialId]
    }));
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Key className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg font-semibold text-card-foreground">
                Credentials ({credentials.length})
              </CardTitle>
              <p className="text-sm text-muted-foreground">Manage credentials for this client</p>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onAddCredential}
            className="text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            New Credential
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {credentials.length === 0 ? (
          <div className="text-center py-8">
            <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No credentials found for this client.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={onAddCredential}
              className="mt-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Credential
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {credentials.map((credential) => (
              <Card key={credential.id} className="bg-muted/50 border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-card-foreground">{credential.serviceName}</h4>
                      {credential.credentialType === 'email' && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          Email
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditCredential(credential)}
                        className="h-6 w-6 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteCredential(credential.id)}
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Username */}
                    <div className="flex items-start space-x-3">
                      <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span className="text-sm text-muted-foreground min-w-[60px]">Username</span>
                      <span className="text-sm text-card-foreground flex-1 break-all">{credential.username}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(credential.username)}
                        className="h-6 w-6 p-0 flex-shrink-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    {/* Password */}
                    <div className="flex items-start space-x-3">
                      <Lock className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span className="text-sm text-muted-foreground min-w-[60px]">Password</span>
                      <span className="text-sm text-card-foreground flex-1 break-all">
                        {showPasswords[credential.id] 
                          ? (decryptedPasswords[credential.id] || credential.password)
                          : '••••••••'
                        }
                      </span>
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePasswordVisibility(credential.id)}
                          className="h-6 w-6 p-0"
                        >
                          {showPasswords[credential.id] ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(
                            showPasswords[credential.id] 
                              ? (decryptedPasswords[credential.id] || credential.password)
                              : credential.password
                          )}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Notes/Configuration */}
                    {(() => {
                      const notesData = formatNotes(credential);
                      if (!notesData) return null;
                      
                      if (notesData.type === 'email' && notesData.emailConfig) {
                        const isExpanded = expandedNotes[credential.id];
                        const config = notesData.emailConfig;
                        
                        return (
                          <div className="space-y-3">
                            {/* Email Configuration Summary */}
                            <div className="flex items-start space-x-3">
                              <span className="text-sm text-muted-foreground mt-0.5 min-w-[60px]">Config</span>
                              <div className="flex-1">
                                <div className="text-sm text-card-foreground">
                                  <div className="flex items-center space-x-2">
                                    <span>📧 Email Server: {config.incomingServer}:{config.incomingPort}</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleNotesExpansion(credential.id)}
                                      className="h-6 px-2 text-xs"
                                    >
                                      {isExpanded ? 'Show Less' : 'Show More'}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Expanded Email Configuration */}
                            {isExpanded && (
                              <div className="ml-16 space-y-3 bg-muted/30 p-3 rounded-md">
                                {/* Incoming Server */}
                                <div>
                                  <h5 className="text-xs font-medium text-muted-foreground mb-2">📥 Incoming Server (IMAP/POP3)</h5>
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                      <span className="text-muted-foreground">Server:</span>
                                      <span className="ml-1 font-mono">{config.incomingServer}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Port:</span>
                                      <span className="ml-1 font-mono">{config.incomingPort}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Username:</span>
                                      <span className="ml-1 font-mono break-all">{config.incomingUsername}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">SSL/TLS:</span>
                                      <span className="ml-1">{config.incomingSSL ? '✅ Yes' : '❌ No'}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Outgoing Server */}
                                <div>
                                  <h5 className="text-xs font-medium text-muted-foreground mb-2">📤 Outgoing Server (SMTP)</h5>
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                      <span className="text-muted-foreground">Server:</span>
                                      <span className="ml-1 font-mono">{config.outgoingServer}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Port:</span>
                                      <span className="ml-1 font-mono">{config.outgoingPort}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Username:</span>
                                      <span className="ml-1 font-mono break-all">{config.outgoingUsername}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">SSL/TLS:</span>
                                      <span className="ml-1">{config.outgoingSSL ? '✅ Yes' : '❌ No'}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Additional Notes */}
                                {config.additionalNotes && (
                                  <div>
                                    <h5 className="text-xs font-medium text-muted-foreground mb-1">📝 Notes</h5>
                                    <p className="text-xs text-card-foreground break-all">{config.additionalNotes}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      } else {
                        // Regular notes
                        const isExpanded = expandedNotes[credential.id];
                        const shouldShowExpand = notesData.summary !== notesData.full;
                        
                        return (
                          <div className="flex items-start space-x-3">
                            <span className="text-sm text-muted-foreground mt-0.5 min-w-[60px]">Notes</span>
                            <div className="flex-1">
                              <span className="text-sm text-card-foreground break-all">
                                {isExpanded ? notesData.full : notesData.summary}
                              </span>
                              {shouldShowExpand && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleNotesExpansion(credential.id)}
                                  className="ml-2 h-6 px-2 text-xs"
                                >
                                  {isExpanded ? 'Show Less' : 'Show More'}
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      }
                    })()}
                  </div>
                  
                  <div className="pt-2 mt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Created by: {credential.createdByName} on {new Date(credential.createdAt).toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
