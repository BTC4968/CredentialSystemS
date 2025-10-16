'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserRole } from '@/types/auth';
import { importClientsFromBexio } from '@/utils/bexioApi';
import { encrypt, decrypt, generateSecurePassword, validatePasswordStrength } from '@/utils/encryption';
import { defaultPDFConfig } from '@/utils/pdfExport';
import PDFConfigModal from '@/components/PDFConfigModal';
import PDFExportModal from '@/components/PDFExportModal';
import StaffManagement from '@/components/StaffManagement';
import AuditLogsViewer from '@/components/AuditLogsViewer';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import ClientCard from '@/components/ClientCard';
import CredentialsCard from '@/components/CredentialsCard';
import ClientDetailPage from '@/components/ClientDetailPage';
import { 
  Plus, 
  FileText, 
  Users, 
  Download, 
  Settings,
  Eye,
  EyeOff,
  Copy,
  Edit,
  Trash2,
  User,
  Phone,
  MapPin,
  Mail,
  Key,
  UserPlus
} from 'lucide-react';

// PDF Configuration Interface
interface PDFConfig {
  companyName: string;
  companyLogo?: string;
  companyAddress: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  greeting: string;
  closing: string;
  includeTimestamp: boolean;
  includePageNumbers: boolean;
  watermark?: string;
}

// Mock data for clients and credentials
interface Client {
  id: string;
  clientName: string;
  contactPerson: string;
  address: string;
  notes: string;
  email?: string;
  phone?: string;
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
  password: string; // This will be encrypted
  notes: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt?: string;
  lastAccessedAt?: string;
  credentialType?: string;
  url?: string;
}

// API functions for data fetching
const fetchClients = async (): Promise<Client[]> => {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/clients', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error('Failed to fetch clients');
  const data = await response.json();
  return data.clients || [];
};

const fetchCredentials = async (): Promise<Credential[]> => {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/credentials', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error('Failed to fetch credentials');
  const data = await response.json();
  return data.credentials || [];
};

export default function DashboardPage() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  
  // State for different features
  const [clients, setClients] = useState<Client[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('clients');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientDetail, setShowClientDetail] = useState(false);
  
  // PDF Export state
  const [showPDFExport, setShowPDFExport] = useState(false);
  const [showPDFConfig, setShowPDFConfig] = useState(false);
  const [pdfConfig, setPdfConfig] = useState<PDFConfig>({
    companyName: 'Credential Management System',
    companyAddress: '123 Business Street, City, State 12345',
    companyPhone: '+1 (555) 123-4567',
    companyEmail: 'info@company.com',
    companyWebsite: 'www.company.com',
    primaryColor: '#2563eb',
    secondaryColor: '#64748b',
    fontFamily: 'Arial, sans-serif',
    greeting: 'Dear Valued Client,',
    closing: 'Thank you for your business.',
    includeTimestamp: true,
    includePageNumbers: true,
    watermark: 'CONFIDENTIAL'
  });
  const [exportingPDF, setExportingPDF] = useState(false);
  const [showCreateStaff, setShowCreateStaff] = useState(false);
  const [showCreateCredential, setShowCreateCredential] = useState(false);
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [showBexioImport, setShowBexioImport] = useState(false);
  const [message, setMessage] = useState('');
  
  // Form states for creating staff
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER' as UserRole
  });
  
  // Form states for creating clients
  const [clientForm, setClientForm] = useState({
    clientName: '',
    contactPerson: '',
    address: '',
    email: '',
    phone: '',
    notes: ''
  });
  
  // Form states for creating/editing credentials
  const [credentialForm, setCredentialForm] = useState({
    clientId: '',
    serviceName: '',
    credentialType: 'general', // 'general' or 'email'
    // General credential fields
    email: '',
    password: '',
    url: '',
    notes: '',
    // Email credential fields
    incomingServer: '',
    incomingUsername: '',
    incomingPassword: '',
    incomingPort: '',
    incomingSSL: false,
    outgoingServer: '',
    outgoingUsername: '',
    outgoingPassword: '',
    outgoingPort: '',
    outgoingSSL: false
  });
  
  // State for credential management
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);
  const [showPassword, setShowPassword] = useState<{[key: string]: boolean}>({});
  const [passwordStrength, setPasswordStrength] = useState<{score: number, feedback: string[]}>({score: 0, feedback: []});
  
  // State for client management
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  // BEXIO integration state
  const [bexioConfig, setBexioConfig] = useState({
    apiKey: '',
    baseUrl: 'https://api.bexio.com'
  });

  // Load data on component mount
  useEffect(() => {
    if (user && !isLoading) {
      loadData();
    }
  }, [user, isLoading]);

  // Redirect to login if no user
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const loadData = async () => {
    if (!user) return;
    
    setDataLoading(true);
    try {
      const [clientsData, credentialsData] = await Promise.all([
        fetchClients(),
        fetchCredentials()
      ]);
      setClients(clientsData);
      setCredentials(credentialsData);
    } catch (error) {
      setMessage('Failed to load data. Please refresh the page.');
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setDataLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(clientForm),
      });

      if (response.ok) {
        const newClient = await response.json();
        setClients(prev => [...prev, newClient.client]);
        setClientForm({
          clientName: '',
          contactPerson: '',
          address: '',
          email: '',
          phone: '',
          notes: ''
        });
        setShowCreateClient(false);
        setMessage('Client created successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Failed to create client. Please try again.');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('Failed to create client. Please try again.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleBexioImport = async () => {
    if (!bexioConfig.apiKey) {
      setMessage('Please enter your BEXIO API key');
      return;
    }

    try {
      const importedClients: Client[] = await importClientsFromBexio(
        bexioConfig.apiKey,
        bexioConfig.baseUrl,
        user?.id || '',
        user?.name || ''
      );
      
      setClients(prev => [...prev, ...importedClients]);
      
      setMessage(`Successfully imported ${importedClients.length} clients from BEXIO!`);
      setShowBexioImport(false);
      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      setMessage('Failed to import from BEXIO. Please check your API key and try again.');
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const handleCreateCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const selectedClient = clients.find(c => c.id === credentialForm.clientId);
    if (!selectedClient) {
      setMessage('Please select a client');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...credentialForm,
          password: credentialForm.credentialType === 'general' 
            ? encrypt(credentialForm.password)
            : encrypt(credentialForm.incomingPassword),
          // For email credentials, we'll store the incoming password as the main password
          // and store all other email config in notes as JSON
          notes: credentialForm.credentialType === 'email' 
            ? JSON.stringify({
                incomingServer: credentialForm.incomingServer,
                incomingPort: credentialForm.incomingPort,
                incomingUsername: credentialForm.incomingUsername,
                incomingSSL: credentialForm.incomingSSL,
                outgoingServer: credentialForm.outgoingServer,
                outgoingPort: credentialForm.outgoingPort,
                outgoingUsername: credentialForm.outgoingUsername,
                outgoingPassword: encrypt(credentialForm.outgoingPassword),
                outgoingSSL: credentialForm.outgoingSSL,
                additionalNotes: credentialForm.notes
              })
            : credentialForm.notes
        }),
      });

      if (response.ok) {
        const newCredential = await response.json();
        setCredentials(prev => [...prev, newCredential.credential]);
        setCredentialForm({
          clientId: '',
          serviceName: '',
          credentialType: 'general',
          email: '',
          password: '',
          url: '',
          notes: '',
          incomingServer: '',
          incomingUsername: '',
          incomingPassword: '',
          incomingPort: '',
          incomingSSL: false,
          outgoingServer: '',
          outgoingUsername: '',
          outgoingPassword: '',
          outgoingPort: '',
          outgoingSSL: false
        });
        setShowCreateCredential(false);
        setMessage('Credential created successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Failed to create credential. Please try again.');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('Failed to create credential. Please try again.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleEditCredential = (credential: Credential) => {
    setEditingCredential(credential);
    
    // Try to parse notes as JSON to determine if it's an email credential
    let credentialType = 'general';
    let emailConfig = {};
    
    try {
      const parsedNotes = JSON.parse(credential.notes || '{}');
      if (parsedNotes.incomingServer) {
        credentialType = 'email';
        emailConfig = parsedNotes;
      }
    } catch (e) {
      // Not JSON, treat as general credential
    }
    
    setCredentialForm({
      clientId: credential.clientId,
      serviceName: credential.serviceName,
      credentialType: credentialType,
      // General fields
      email: credentialType === 'general' ? credential.username : '',
      password: credentialType === 'general' ? credential.password : '',
      url: '',
      notes: credentialType === 'general' ? credential.notes : (emailConfig as any).additionalNotes || '',
      // Email fields
      incomingServer: (emailConfig as any).incomingServer || '',
      incomingUsername: (emailConfig as any).incomingUsername || '',
      incomingPassword: credentialType === 'email' ? credential.password : '',
      incomingPort: (emailConfig as any).incomingPort || '',
      incomingSSL: (emailConfig as any).incomingSSL || false,
      outgoingServer: (emailConfig as any).outgoingServer || '',
      outgoingUsername: (emailConfig as any).outgoingUsername || '',
      outgoingPassword: (emailConfig as any).outgoingPassword || '',
      outgoingPort: (emailConfig as any).outgoingPort || '',
      outgoingSSL: (emailConfig as any).outgoingSSL || false
    });
    setShowCreateCredential(true);
  };

  const handleUpdateCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingCredential) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/credentials/${editingCredential.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...credentialForm,
          password: credentialForm.credentialType === 'general' 
            ? encrypt(credentialForm.password)
            : encrypt(credentialForm.incomingPassword),
          // For email credentials, we'll store the incoming password as the main password
          // and store all other email config in notes as JSON
          notes: credentialForm.credentialType === 'email' 
            ? JSON.stringify({
                incomingServer: credentialForm.incomingServer,
                incomingPort: credentialForm.incomingPort,
                incomingUsername: credentialForm.incomingUsername,
                incomingSSL: credentialForm.incomingSSL,
                outgoingServer: credentialForm.outgoingServer,
                outgoingPort: credentialForm.outgoingPort,
                outgoingUsername: credentialForm.outgoingUsername,
                outgoingPassword: encrypt(credentialForm.outgoingPassword),
                outgoingSSL: credentialForm.outgoingSSL,
                additionalNotes: credentialForm.notes
              })
            : credentialForm.notes
        }),
      });

      if (response.ok) {
        const updatedCredential = await response.json();
        setCredentials(prev => prev.map(c => c.id === editingCredential.id ? updatedCredential.credential : c));
        setEditingCredential(null);
        setShowCreateCredential(false);
        setCredentialForm({
          clientId: '',
          serviceName: '',
          credentialType: 'general',
          email: '',
          password: '',
          url: '',
          notes: '',
          incomingServer: '',
          incomingUsername: '',
          incomingPassword: '',
          incomingPort: '',
          incomingSSL: false,
          outgoingServer: '',
          outgoingUsername: '',
          outgoingPassword: '',
          outgoingPort: '',
          outgoingSSL: false
        });
        setMessage('Credential updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Failed to update credential. Please try again.');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('Failed to update credential. Please try again.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDeleteCredential = async (credentialId: string) => {
    if (!user) return;
    
    if (!confirm('Are you sure you want to delete this credential?')) {
      return;
    }

    try {
      console.log('Deleting credential:', credentialId);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/credentials/${credentialId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('Delete credential response status:', response.status);

      if (response.ok) {
        setCredentials(prev => prev.filter(c => c.id !== credentialId));
        setMessage('Credential deleted successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        const data = await response.json();
        setMessage(data.error || 'Failed to delete credential');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('Failed to delete credential. Please try again.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDecryptPassword = async (credentialId: string): Promise<string> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/credentials/${credentialId}/decrypt`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.password;
      } else {
        return '[DECRYPTION FAILED]';
      }
    } catch (error) {
      return '[DECRYPTION FAILED]';
    }
  };

  // Client detail page handlers
  const handleClientClick = (client: Client) => {
    setSelectedClient(client);
    setShowClientDetail(true);
  };

  const handleBackToClients = () => {
    setShowClientDetail(false);
    setSelectedClient(null);
  };

  const handleEditClientFromDetail = (client: Client) => {
    setEditingClient(client);
    setClientForm({
      clientName: client.clientName,
      contactPerson: client.contactPerson,
      address: client.address,
      email: client.email || '',
      phone: client.phone || '',
      notes: client.notes
    });
    setShowCreateClient(true);
    setShowClientDetail(false);
  };

  const handleDeleteClientFromDetail = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client? This will also delete all associated credentials.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setClients(prev => prev.filter(c => c.id !== clientId));
        setCredentials(prev => prev.filter(c => c.clientId !== clientId));
        setMessage('Client deleted successfully!');
        setTimeout(() => setMessage(''), 3000);
        setShowClientDetail(false);
        setSelectedClient(null);
      } else {
        const data = await response.json();
        setMessage(data.error || 'Failed to delete client');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('Failed to delete client. Please try again.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleCreateCredentialFromDetail = (client: Client) => {
    setCredentialForm({
      clientId: client.id,
      serviceName: '',
      credentialType: 'general',
      email: '',
      password: '',
      url: '',
      notes: '',
      incomingServer: '',
      incomingUsername: '',
      incomingPassword: '',
      incomingPort: '',
      incomingSSL: false,
      outgoingServer: '',
      outgoingUsername: '',
      outgoingPassword: '',
      outgoingPort: '',
      outgoingSSL: false
    });
    setShowCreateCredential(true);
    setShowClientDetail(false);
  };

  const handleEditCredentialFromDetail = (credential: Credential) => {
    setEditingCredential(credential);
    
    // Try to parse notes as JSON to determine if it's an email credential
    let credentialType = 'general';
    let emailConfig = {};
    
    try {
      const parsedNotes = JSON.parse(credential.notes || '{}');
      if (parsedNotes.incomingServer) {
        credentialType = 'email';
        emailConfig = parsedNotes;
      }
    } catch (e) {
      // Not JSON, treat as general credential
    }
    
    setCredentialForm({
      clientId: credential.clientId,
      serviceName: credential.serviceName,
      credentialType: credentialType,
      // General fields
      email: credentialType === 'general' ? credential.username : '',
      password: credentialType === 'general' ? credential.password : '',
      url: '',
      notes: credentialType === 'general' ? credential.notes : (emailConfig as any).additionalNotes || '',
      // Email fields
      incomingServer: (emailConfig as any).incomingServer || '',
      incomingUsername: (emailConfig as any).incomingUsername || '',
      incomingPassword: credentialType === 'email' ? credential.password : '',
      incomingPort: (emailConfig as any).incomingPort || '',
      incomingSSL: (emailConfig as any).incomingSSL || false,
      outgoingServer: (emailConfig as any).outgoingServer || '',
      outgoingUsername: (emailConfig as any).outgoingUsername || '',
      outgoingPassword: (emailConfig as any).outgoingPassword || '',
      outgoingPort: (emailConfig as any).outgoingPort || '',
      outgoingSSL: (emailConfig as any).outgoingSSL || false
    });
    setShowCreateCredential(true);
    setShowClientDetail(false);
  };

  const handleDeleteCredentialFromDetail = async (credentialId: string) => {
    if (!confirm('Are you sure you want to delete this credential?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/credentials/${credentialId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setCredentials(prev => prev.filter(c => c.id !== credentialId));
        setMessage('Credential deleted successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        const data = await response.json();
        setMessage(data.error || 'Failed to delete credential');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('Failed to delete credential. Please try again.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleExportPDF = async (client: Client) => {
    if (!user) return;
    
    setExportingPDF(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          clientId: client.id,
          pdfConfig: pdfConfig
        }),
      });

      if (response.ok) {
        // Get the PDF blob
        const blob = await response.blob();
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${client.clientName}_credentials.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        setMessage(`PDF exported successfully for ${client.clientName}!`);
        setTimeout(() => setMessage(''), 3000);
      } else {
        const data = await response.json();
        setMessage(data.error || 'Failed to export PDF');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('Failed to export PDF. Please try again.');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setExportingPDF(false);
    }
  };

  const handlePDFConfigSave = (newConfig: PDFConfig) => {
    setPdfConfig(newConfig);
    setMessage('PDF configuration saved successfully!');
    setTimeout(() => setMessage(''), 3000);
  };

  const handlePDFExport = () => {
    setShowPDFExport(true);
  };

  // Client management handlers
  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setClientForm({
      clientName: client.clientName,
      contactPerson: client.contactPerson,
      address: client.address,
      email: client.email || '',
      phone: client.phone || '',
      notes: client.notes || ''
    });
    setShowCreateClient(true);
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!user) return;
    
    if (!confirm('Are you sure you want to delete this client? This will also delete all associated credentials.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setClients(prev => prev.filter(c => c.id !== clientId));
        setCredentials(prev => prev.filter(c => c.clientId !== clientId));
        setMessage('Client deleted successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        const data = await response.json();
        setMessage(data.error || 'Failed to delete client');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('Failed to delete client. Please try again.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingClient) return;

    try {
      console.log('Updating client:', editingClient.id, clientForm);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/clients/${editingClient.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(clientForm),
      });
      
      console.log('Update client response status:', response.status);

      if (response.ok) {
        const updatedClient = await response.json();
        setClients(prev => prev.map(c => c.id === editingClient.id ? updatedClient.client : c));
        setEditingClient(null);
        setShowCreateClient(false);
        setClientForm({
          clientName: '',
          contactPerson: '',
          address: '',
          email: '',
          phone: '',
          notes: ''
        });
        setMessage('Client updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        const data = await response.json();
        setMessage(data.error || 'Failed to update client');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('Failed to update client. Please try again.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Filter credentials based on user role
  const getUserCredentials = () => {
    if (user?.role === 'ADMIN') {
      return credentials; // Admin can see all credentials
    }
    return credentials.filter(c => c.createdBy === user?.id); // Users can only see their own
  };

  // Filter clients based on user role - users can see all clients but only their own credentials
  const getUserClients = () => {
    return clients; // Both admin and users can see all clients
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className="flex-shrink-0 self-stretch">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header title="Credential Management System" onLogout={handleLogout} />
        
        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-auto">
          {message && (
            <Alert className="mb-6">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {/* Client Detail View */}
          {showClientDetail && selectedClient && (
            <ClientDetailPage
              client={selectedClient}
              onBack={handleBackToClients}
              onEditClient={handleEditClientFromDetail}
              onDeleteClient={handleDeleteClientFromDetail}
              onCreateCredential={handleCreateCredentialFromDetail}
              onEditCredential={handleEditCredentialFromDetail}
              onDeleteCredential={handleDeleteCredentialFromDetail}
              user={user}
            />
          )}

          {activeTab === 'credentials' && (
            <div className="space-y-6">
              {/* Page Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground flex items-center">
                    <Key className="h-8 w-8 mr-3" />
                    Credentials
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    {user.role === 'ADMIN'
                      ? 'View and manage all credentials (Admin View)' 
                      : 'View and manage your credentials'
                    }
                  </p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Button 
                    onClick={() => {
                      setEditingCredential(null);
                      setShowCreateCredential(!showCreateCredential);
                      if (!showCreateCredential) {
                        setCredentialForm({
                          clientId: '',
                          serviceName: '',
                          credentialType: 'general',
                          email: '',
                          password: '',
                          url: '',
                          notes: '',
                          incomingServer: '',
                          incomingUsername: '',
                          incomingPassword: '',
                          incomingPort: '',
                          incomingSSL: false,
                          outgoingServer: '',
                          outgoingUsername: '',
                          outgoingPassword: '',
                          outgoingPort: '',
                          outgoingSSL: false
                        });
                      }
                    }}
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {showCreateCredential ? 'Cancel' : 'New Credential'}
                  </Button>
                </div>
              </div>

              {/* Create/Edit Credential Form */}
              {showCreateCredential && (
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle>{editingCredential ? 'Edit Credential' : 'Create New Credential'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={editingCredential ? handleUpdateCredential : handleCreateCredential} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="credentialClient">Client *</Label>
                          <select
                            id="credentialClient"
                            value={credentialForm.clientId}
                            onChange={(e) => setCredentialForm({...credentialForm, clientId: e.target.value})}
                            className="w-full p-2 border border-border rounded-md bg-background text-foreground"
                            required
                          >
                            <option value="">Select a client</option>
                            {getUserClients().map((client) => (
                              <option key={client.id} value={client.id}>
                                {client.clientName}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="serviceName">Service Name *</Label>
                          <Input
                            id="serviceName"
                            value={credentialForm.serviceName}
                            onChange={(e) => setCredentialForm({...credentialForm, serviceName: e.target.value})}
                            required
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="credentialType">Credential Type *</Label>
                          <Select
                            value={credentialForm.credentialType}
                            onValueChange={(value) => setCredentialForm({...credentialForm, credentialType: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select credential type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="general">General</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* General Credential Fields */}
                      {credentialForm.credentialType === 'general' && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium text-foreground">General Credential Information</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="generalEmail">Email *</Label>
                              <Input
                                id="generalEmail"
                                type="email"
                                value={credentialForm.email}
                                onChange={(e) => setCredentialForm({...credentialForm, email: e.target.value})}
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="generalPassword">Password *</Label>
                              <Input
                                id="generalPassword"
                                type="password"
                                value={credentialForm.password}
                                onChange={(e) => {
                                  setCredentialForm({...credentialForm, password: e.target.value});
                                  const strength = validatePasswordStrength(e.target.value);
                                  setPasswordStrength(strength);
                                }}
                                required
                              />
                              {passwordStrength.score > 0 && (
                                <div className="mt-2">
                                  <div className="text-sm text-muted-foreground">
                                    Password Strength: {passwordStrength.score}/4
                                  </div>
                                  {passwordStrength.feedback.length > 0 && (
                                    <ul className="text-xs text-muted-foreground mt-1">
                                      {passwordStrength.feedback.map((feedback, index) => (
                                        <li key={index}>• {feedback}</li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="md:col-span-2">
                              <Label htmlFor="generalUrl">URL</Label>
                              <Input
                                id="generalUrl"
                                type="url"
                                value={credentialForm.url}
                                onChange={(e) => setCredentialForm({...credentialForm, url: e.target.value})}
                                placeholder="https://example.com"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <Label htmlFor="generalNotes">Notes</Label>
                              <Input
                                id="generalNotes"
                                value={credentialForm.notes}
                                onChange={(e) => setCredentialForm({...credentialForm, notes: e.target.value})}
                                placeholder="Additional notes about this credential..."
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Email Credential Fields */}
                      {credentialForm.credentialType === 'email' && (
                        <div className="space-y-6">
                          <h3 className="text-lg font-medium text-foreground">Email Server Configuration</h3>
                          
                          {/* Incoming Server */}
                          <div className="space-y-4">
                            <h4 className="text-md font-medium text-foreground">Incoming Server (IMAP/POP3)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="incomingServer">Server *</Label>
                                <Input
                                  id="incomingServer"
                                  value={credentialForm.incomingServer}
                                  onChange={(e) => setCredentialForm({...credentialForm, incomingServer: e.target.value})}
                                  placeholder="imap.example.com"
                                  required
                                />
                              </div>
                              <div>
                                <Label htmlFor="incomingPort">Port *</Label>
                                <Input
                                  id="incomingPort"
                                  type="number"
                                  value={credentialForm.incomingPort}
                                  onChange={(e) => setCredentialForm({...credentialForm, incomingPort: e.target.value})}
                                  placeholder="993"
                                  required
                                />
                              </div>
                              <div>
                                <Label htmlFor="incomingUsername">Username *</Label>
                                <Input
                                  id="incomingUsername"
                                  value={credentialForm.incomingUsername}
                                  onChange={(e) => setCredentialForm({...credentialForm, incomingUsername: e.target.value})}
                                  required
                                />
                              </div>
                              <div>
                                <Label htmlFor="incomingPassword">Password *</Label>
                                <Input
                                  id="incomingPassword"
                                  type="password"
                                  value={credentialForm.incomingPassword}
                                  onChange={(e) => {
                                    setCredentialForm({...credentialForm, incomingPassword: e.target.value});
                                    const strength = validatePasswordStrength(e.target.value);
                                    setPasswordStrength(strength);
                                  }}
                                  required
                                />
                              </div>
                              <div className="md:col-span-2">
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id="incomingSSL"
                                    checked={credentialForm.incomingSSL}
                                    onChange={(e) => setCredentialForm({...credentialForm, incomingSSL: e.target.checked})}
                                    className="rounded border-border"
                                  />
                                  <Label htmlFor="incomingSSL">Use SSL/TLS</Label>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Outgoing Server */}
                          <div className="space-y-4">
                            <h4 className="text-md font-medium text-foreground">Outgoing Server (SMTP)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="outgoingServer">Server *</Label>
                                <Input
                                  id="outgoingServer"
                                  value={credentialForm.outgoingServer}
                                  onChange={(e) => setCredentialForm({...credentialForm, outgoingServer: e.target.value})}
                                  placeholder="smtp.example.com"
                                  required
                                />
                              </div>
                              <div>
                                <Label htmlFor="outgoingPort">Port *</Label>
                                <Input
                                  id="outgoingPort"
                                  type="number"
                                  value={credentialForm.outgoingPort}
                                  onChange={(e) => setCredentialForm({...credentialForm, outgoingPort: e.target.value})}
                                  placeholder="587"
                                  required
                                />
                              </div>
                              <div>
                                <Label htmlFor="outgoingUsername">Username *</Label>
                                <Input
                                  id="outgoingUsername"
                                  value={credentialForm.outgoingUsername}
                                  onChange={(e) => setCredentialForm({...credentialForm, outgoingUsername: e.target.value})}
                                  required
                                />
                              </div>
                              <div>
                                <Label htmlFor="outgoingPassword">Password *</Label>
                                <Input
                                  id="outgoingPassword"
                                  type="password"
                                  value={credentialForm.outgoingPassword}
                                  onChange={(e) => setCredentialForm({...credentialForm, outgoingPassword: e.target.value})}
                                  required
                                />
                              </div>
                              <div className="md:col-span-2">
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id="outgoingSSL"
                                    checked={credentialForm.outgoingSSL}
                                    onChange={(e) => setCredentialForm({...credentialForm, outgoingSSL: e.target.checked})}
                                    className="rounded border-border"
                                  />
                                  <Label htmlFor="outgoingSSL">Use SSL/TLS</Label>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Notes */}
                          <div>
                            <Label htmlFor="emailNotes">Notes</Label>
                            <Input
                              id="emailNotes"
                              value={credentialForm.notes}
                              onChange={(e) => setCredentialForm({...credentialForm, notes: e.target.value})}
                              placeholder="Additional notes about this email configuration..."
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button type="submit">{editingCredential ? 'Update Credential' : 'Create Credential'}</Button>
                        {editingCredential && (
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={() => {
                              setEditingCredential(null);
                              setShowCreateCredential(false);
                              setCredentialForm({
                                clientId: '',
                                serviceName: '',
                                credentialType: 'general',
                                email: '',
                                password: '',
                                url: '',
                                notes: '',
                                incomingServer: '',
                                incomingUsername: '',
                                incomingPassword: '',
                                incomingPort: '',
                                incomingSSL: false,
                                outgoingServer: '',
                                outgoingUsername: '',
                                outgoingPassword: '',
                                outgoingPort: '',
                                outgoingSSL: false
                              });
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Credentials Display */}
              <div className="space-y-4">
                {dataLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading credentials...</p>
                  </div>
                ) : getUserCredentials().length === 0 ? (
                  <Card className="bg-card border-border">
                    <CardContent className="text-center py-8">
                      <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No credentials found.</p>
                      <Button
                        variant="outline"
                        onClick={() => setShowCreateCredential(true)}
                        className="mt-4"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Credential
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  getUserCredentials().map((credential) => (
                    <CredentialsCard
                      key={credential.id}
                      credentials={[credential]}
                      user={user}
                      onAddCredential={() => setShowCreateCredential(true)}
                      onEditCredential={handleEditCredential}
                      onDeleteCredential={handleDeleteCredential}
                      onDecryptPassword={handleDecryptPassword}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'staff' && user?.role === 'ADMIN' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center">
                  <UserPlus className="h-8 w-8 mr-3" />
                  Staff Management
                </h1>
                <p className="text-muted-foreground mt-1">
                  Create staff accounts and assign roles
                </p>
              </div>
              <StaffManagement user={user} />
            </div>
          )}

          {activeTab === 'audit' && user?.role === 'ADMIN' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center">
                  <FileText className="h-8 w-8 mr-3" />
                  Audit Logs
                </h1>
                <p className="text-muted-foreground mt-1">
                  View system activity and security logs
                </p>
              </div>
              <AuditLogsViewer user={user} />
            </div>
          )}

          {activeTab === 'clients' && (
            <div className="space-y-6">
              {/* Page Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground flex items-center">
                    <FileText className="h-8 w-8 mr-3" />
                    Clients
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    {user.role === 'ADMIN'
                      ? 'View and manage all clients & their credentials (Admin View)' 
                      : 'View and manage your clients and credentials'
                    }
                  </p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Button 
                    onClick={() => {
                      setEditingClient(null);
                      setShowCreateClient(!showCreateClient);
                      if (!showCreateClient) {
                        setClientForm({
                          clientName: '',
                          contactPerson: '',
                          address: '',
                          email: '',
                          phone: '',
                          notes: ''
                        });
                      }
                    }}
                    variant="outline"
                  >
                    {showCreateClient ? 'Cancel' : 'New Client'}
                  </Button>
                  {/* <Button 
                    onClick={() => setShowBexioImport(!showBexioImport)}
                    variant="outline"
                  >
                    {showBexioImport ? 'Cancel' : 'Import from BEXIO'}
                  </Button> */}
                </div>
              </div>

              {/* Create/Edit Client Form */}
              {showCreateClient && (
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle>{editingClient ? 'Edit Client' : 'Create New Client'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={editingClient ? handleUpdateClient : handleCreateClient} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="clientName">Client Name *</Label>
                          <Input
                            id="clientName"
                            value={clientForm.clientName}
                            onChange={(e) => setClientForm({...clientForm, clientName: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="contactPerson">Contact Person *</Label>
                          <Input
                            id="contactPerson"
                            value={clientForm.contactPerson}
                            onChange={(e) => setClientForm({...clientForm, contactPerson: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="clientAddress">Address *</Label>
                          <Input
                            id="clientAddress"
                            value={clientForm.address}
                            onChange={(e) => setClientForm({...clientForm, address: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="clientEmail">Email</Label>
                          <Input
                            id="clientEmail"
                            type="email"
                            value={clientForm.email}
                            onChange={(e) => setClientForm({...clientForm, email: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="clientPhone">Phone</Label>
                          <Input
                            id="clientPhone"
                            value={clientForm.phone}
                            onChange={(e) => setClientForm({...clientForm, phone: e.target.value})}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="clientNotes">Notes</Label>
                          <Input
                            id="clientNotes"
                            value={clientForm.notes}
                            onChange={(e) => setClientForm({...clientForm, notes: e.target.value})}
                            placeholder="Additional notes about the client..."
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit">{editingClient ? 'Update Client' : 'Create Client'}</Button>
                        {editingClient && (
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={() => {
                              setEditingClient(null);
                              setShowCreateClient(false);
                              setClientForm({
                                clientName: '',
                                contactPerson: '',
                                address: '',
                                email: '',
                                phone: '',
                                notes: ''
                              });
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* BEXIO Import Form */}
              {showBexioImport && (
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle>Import Clients from BEXIO</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="bexioApiKey">BEXIO API Key *</Label>
                      <Input
                        id="bexioApiKey"
                        type="password"
                        value={bexioConfig.apiKey}
                        onChange={(e) => setBexioConfig({...bexioConfig, apiKey: e.target.value})}
                        placeholder="Enter your BEXIO API key"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="bexioBaseUrl">BEXIO Base URL</Label>
                      <Input
                        id="bexioBaseUrl"
                        value={bexioConfig.baseUrl}
                        onChange={(e) => setBexioConfig({...bexioConfig, baseUrl: e.target.value})}
                      />
                    </div>
                    <Button onClick={handleBexioImport} className="w-full">
                      Import Clients from BEXIO
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      This will fetch all clients from your BEXIO account and import them into the system.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Clients Display */}
              <div className="space-y-4">
                {dataLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading clients...</p>
                  </div>
                ) : getUserClients().length === 0 ? (
                  <Card className="bg-card border-border">
                    <CardContent className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No clients found.</p>
                      <Button
                        variant="outline"
                        onClick={() => setShowCreateClient(true)}
                        className="mt-4"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Client
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  // Table View for both Admin and User
                  <div className="bg-card border border-border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-muted/30 border-b border-border">
                            <th className="text-left p-4 font-medium text-muted-foreground">Client Name</th>
                            <th className="text-left p-4 font-medium text-muted-foreground">Contact Person</th>
                            <th className="text-left p-4 font-medium text-muted-foreground">Address</th>
                            <th className="text-left p-4 font-medium text-muted-foreground">Email</th>
                            <th className="text-left p-4 font-medium text-muted-foreground">Phone</th>
                            <th className="text-left p-4 font-medium text-muted-foreground">Created By</th>
                            <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getUserClients().map((client) => (
                            <tr key={client.id} className="border-b border-border hover:bg-muted/20">
                              <td className="p-4">
                                <button
                                  onClick={() => handleClientClick(client)}
                                  className="text-card-foreground hover:text-primary hover:underline cursor-pointer text-left font-medium"
                                >
                                  {client.clientName}
                                </button>
                              </td>
                              <td className="p-4 text-card-foreground">{client.contactPerson}</td>
                              <td className="p-4 text-card-foreground">{client.address}</td>
                              <td className="p-4 text-card-foreground">{client.email || '-'}</td>
                              <td className="p-4 text-card-foreground">{client.phone || '-'}</td>
                              <td className="p-4 text-card-foreground">{client.createdByName || '-'}</td>
                              <td className="p-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditClient(client)}
                                  className="bg-muted text-card-foreground hover:bg-muted/80 border-border"
                                >
                                  Edit
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* PDF Configuration Modal */}
      <PDFConfigModal
        isOpen={showPDFConfig}
        onClose={() => setShowPDFConfig(false)}
        onSave={handlePDFConfigSave}
        initialConfig={pdfConfig}
      />

      {/* PDF Export Modal */}
      <PDFExportModal
        isOpen={showPDFExport}
        onClose={() => setShowPDFExport(false)}
        clients={clients}
        onConfigSave={handlePDFConfigSave}
        savedConfig={pdfConfig}
      />
    </div>
  );
}