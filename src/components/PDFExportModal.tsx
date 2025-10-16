'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, FileText, Settings, Loader2 } from 'lucide-react';

interface Client {
  id: string;
  clientName: string;
  contactPerson: string;
  address: string;
  email?: string;
  phone?: string;
}

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

interface PDFExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  onConfigSave: (config: PDFConfig) => void;
  savedConfig?: PDFConfig;
}

export default function PDFExportModal({ isOpen, onClose, clients, onConfigSave, savedConfig }: PDFExportModalProps) {
  const [selectedClientId, setSelectedClientId] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleExport = async () => {
    if (!selectedClientId) {
      setError('Please select a client');
      return;
    }

    setIsExporting(true);
    setError('');
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          clientId: selectedClientId,
          pdfConfig: savedConfig
        }),
      });

      if (response.ok) {
        // Get the PDF blob
        const blob = await response.blob();
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Get client name for filename
        const selectedClient = clients.find(c => c.id === selectedClientId);
        const filename = selectedClient 
          ? `${selectedClient.clientName}_credentials.pdf`
          : 'credentials.pdf';
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        setMessage('PDF exported successfully!');
        setTimeout(() => {
          setMessage('');
          onClose();
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to export PDF');
      }
    } catch (error) {
      setError('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleConfigSave = (config: PDFConfig) => {
    onConfigSave(config);
    setShowConfig(false);
    setMessage('PDF configuration saved!');
    setTimeout(() => setMessage(''), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="h-6 w-6 text-blue-600" />
                <CardTitle>Export Credentials to PDF</CardTitle>
              </div>
              <Button variant="outline" size="sm" onClick={onClose}>
                ✕
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {message && (
              <Alert>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}
            
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="clientSelect">Select Client</Label>
              <select
                id="clientSelect"
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1"
              >
                <option value="">Choose a client...</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.clientName} - {client.contactPerson}
                  </option>
                ))}
              </select>
            </div>

            {selectedClientId && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Selected Client:</h4>
                {(() => {
                  const client = clients.find(c => c.id === selectedClientId);
                  return client ? (
                    <div className="text-sm space-y-1">
                      <p><strong>Company:</strong> {client.clientName}</p>
                      <p><strong>Contact:</strong> {client.contactPerson}</p>
                      <p><strong>Address:</strong> {client.address}</p>
                      {client.email && <p><strong>Email:</strong> {client.email}</p>}
                      {client.phone && <p><strong>Phone:</strong> {client.phone}</p>}
                    </div>
                  ) : null;
                })()}
              </div>
            )}

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold">PDF Configuration</h4>
                  <p className="text-sm text-gray-600">
                    Customize the appearance and branding of your PDF
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowConfig(true)}
                  className="flex items-center space-x-2"
                >
                  <Settings className="h-4 w-4" />
                  <span>Configure</span>
                </Button>
              </div>

              {savedConfig && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Current Configuration:</strong> {savedConfig.companyName}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Primary: {savedConfig.primaryColor} | Font: {savedConfig.fontFamily.split(',')[0]}
                  </p>
                </div>
              )}
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                onClick={handleExport}
                disabled={!selectedClientId || isExporting}
                className="flex items-center space-x-2 flex-1"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span>{isExporting ? 'Exporting...' : 'Export PDF'}</span>
              </Button>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
