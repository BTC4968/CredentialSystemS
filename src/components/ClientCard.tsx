'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  User, 
  Phone, 
  MapPin, 
  Mail, 
  Download, 
  Settings,
  Edit,
  Trash2
} from 'lucide-react';

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

interface ClientCardProps {
  client: Client;
  user: any;
  onEdit: (client: Client) => void;
  onDelete: (clientId: string) => void;
  onExportPDF: (client: Client) => void;
  onClientClick: (client: Client) => void;
  exportingPDF: boolean;
}

export default function ClientCard({ 
  client, 
  user, 
  onEdit, 
  onDelete, 
  onExportPDF, 
  onClientClick,
  exportingPDF 
}: ClientCardProps) {
  return (
    <Card 
      className="bg-card border-border cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onClientClick(client)}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg font-semibold text-card-foreground">
                {client.clientName}
              </CardTitle>
              <p className="text-sm text-muted-foreground">Client Details</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <Settings className="h-3 w-3 mr-1" />
              Configure PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onExportPDF(client);
              }}
              disabled={exportingPDF}
            >
              <Download className="h-3 w-3 mr-1" />
              {exportingPDF ? 'Exporting...' : 'Export PDF'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Client Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-card-foreground">{client.contactPerson}</span>
          </div>
          
          {client.phone && (
            <div className="flex items-center space-x-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-card-foreground">{client.phone}</span>
            </div>
          )}
          
          <div className="flex items-center space-x-3">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-card-foreground">{client.address}</span>
          </div>
          
          {client.email && (
            <div className="flex items-center space-x-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-card-foreground">{client.email}</span>
            </div>
          )}
        </div>
        
        {/* Created Info */}
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Created by: {client.createdByName} on {new Date(client.createdAt).toLocaleString()}
          </p>
        </div>
        
        {/* Action Buttons */}
        {user?.role === 'ADMIN' && (
          <div className="flex items-center space-x-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(client);
              }}
              className="text-xs"
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(client.id);
              }}
              className="text-xs text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
