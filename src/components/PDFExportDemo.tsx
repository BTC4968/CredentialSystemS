'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PDFExportDemoProps {
  onExportPDF: (client: any) => void;
  exportingPDF: boolean;
}

export default function PDFExportDemo({ onExportPDF, exportingPDF }: PDFExportDemoProps) {
  const demoClient = {
    id: 'demo',
    clientName: 'Demo Client Corp.',
    contactPerson: 'John Smith',
    address: '123 Demo Street, Demo City, DC 12345',
    notes: 'This is a demo client for PDF export testing',
    email: 'john@democlient.com',
    phone: '+1 (555) 123-4567',
    createdAt: '2024-01-15',
    createdBy: '1',
    createdByName: 'Admin User'
  };

  return (
    <Card className="mb-6 border-dashed border-2 border-blue-300 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📄 PDF Export Demo
          <Badge variant="outline">New Feature</Badge>
        </CardTitle>
        <CardDescription>
          Test the PDF export functionality with this demo client
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-sm text-gray-700">Demo Client</h4>
              <p className="text-sm text-gray-600">{demoClient.clientName}</p>
              <p className="text-sm text-gray-500">Contact: {demoClient.contactPerson}</p>
              <p className="text-sm text-gray-500">{demoClient.address}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-700">PDF Features</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Customizable branding</li>
                <li>• Company logo support</li>
                <li>• Professional formatting</li>
                <li>• Print-ready output</li>
                <li>• Encrypted credential display</li>
              </ul>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => onExportPDF(demoClient)}
              disabled={exportingPDF}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {exportingPDF ? 'Exporting PDF...' : '📄 Export Demo PDF'}
            </Button>
            <Button variant="outline" size="sm">
              View Sample PDF
            </Button>
          </div>
          
          <div className="text-xs text-gray-500 bg-white p-3 rounded border">
            <strong>Note:</strong> This demo will export a sample PDF with the current PDF configuration. 
            Make sure to configure your company branding in the PDF settings before exporting for production use.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
