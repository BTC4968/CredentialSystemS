'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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

interface PDFConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: PDFConfig) => void;
  initialConfig?: PDFConfig;
}

const defaultConfig: PDFConfig = {
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
};

const fontOptions = [
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Helvetica, sans-serif', label: 'Helvetica' },
  { value: 'Times New Roman, serif', label: 'Times New Roman' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Verdana, sans-serif', label: 'Verdana' },
  { value: 'Calibri, sans-serif', label: 'Calibri' }
];

export default function PDFConfigModal({ isOpen, onClose, onSave, initialConfig }: PDFConfigModalProps) {
  const [config, setConfig] = useState<PDFConfig>(initialConfig || defaultConfig);
  const [activeTab, setActiveTab] = useState<'branding' | 'content' | 'styling'>('branding');

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  const handleReset = () => {
    setConfig(defaultConfig);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 p-4 border-r">
            <h2 className="text-lg font-semibold mb-4">PDF Configuration</h2>
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('branding')}
                className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                  activeTab === 'branding' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                }`}
              >
                🏢 Company Branding
              </button>
              <button
                onClick={() => setActiveTab('content')}
                className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                  activeTab === 'content' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                }`}
              >
                📝 Content & Text
              </button>
              <button
                onClick={() => setActiveTab('styling')}
                className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                  activeTab === 'styling' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                }`}
              >
                🎨 Styling & Colors
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'branding' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">Company Branding</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={config.companyName}
                      onChange={(e) => setConfig({ ...config, companyName: e.target.value })}
                      placeholder="Your Company Name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="companyLogo">Company Logo URL (Optional)</Label>
                    <Input
                      id="companyLogo"
                      value={config.companyLogo || ''}
                      onChange={(e) => setConfig({ ...config, companyLogo: e.target.value })}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="companyAddress">Company Address</Label>
                  <Textarea
                    id="companyAddress"
                    value={config.companyAddress}
                    onChange={(e) => setConfig({ ...config, companyAddress: e.target.value })}
                    placeholder="123 Business Street, City, State 12345"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyPhone">Phone Number</Label>
                    <Input
                      id="companyPhone"
                      value={config.companyPhone}
                      onChange={(e) => setConfig({ ...config, companyPhone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="companyEmail">Email Address</Label>
                    <Input
                      id="companyEmail"
                      type="email"
                      value={config.companyEmail}
                      onChange={(e) => setConfig({ ...config, companyEmail: e.target.value })}
                      placeholder="info@company.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="companyWebsite">Website</Label>
                    <Input
                      id="companyWebsite"
                      value={config.companyWebsite}
                      onChange={(e) => setConfig({ ...config, companyWebsite: e.target.value })}
                      placeholder="www.company.com"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'content' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">Content & Text</h3>
                
                <div>
                  <Label htmlFor="greeting">Greeting Message</Label>
                  <Textarea
                    id="greeting"
                    value={config.greeting}
                    onChange={(e) => setConfig({ ...config, greeting: e.target.value })}
                    placeholder="Dear Valued Client,"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="closing">Closing Message</Label>
                  <Textarea
                    id="closing"
                    value={config.closing}
                    onChange={(e) => setConfig({ ...config, closing: e.target.value })}
                    placeholder="Thank you for your business."
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="watermark">Watermark Text (Optional)</Label>
                  <Input
                    id="watermark"
                    value={config.watermark || ''}
                    onChange={(e) => setConfig({ ...config, watermark: e.target.value })}
                    placeholder="CONFIDENTIAL"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="includeTimestamp"
                      checked={config.includeTimestamp}
                      onChange={(e) => setConfig({ ...config, includeTimestamp: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="includeTimestamp">Include timestamp in PDF</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="includePageNumbers"
                      checked={config.includePageNumbers}
                      onChange={(e) => setConfig({ ...config, includePageNumbers: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="includePageNumbers">Include page numbers</Label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'styling' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">Styling & Colors</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={config.primaryColor}
                        onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                        className="w-16 h-10"
                      />
                      <Input
                        value={config.primaryColor}
                        onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                        placeholder="#2563eb"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="secondaryColor">Secondary Color</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={config.secondaryColor}
                        onChange={(e) => setConfig({ ...config, secondaryColor: e.target.value })}
                        className="w-16 h-10"
                      />
                      <Input
                        value={config.secondaryColor}
                        onChange={(e) => setConfig({ ...config, secondaryColor: e.target.value })}
                        placeholder="#64748b"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="fontFamily">Font Family</Label>
                  <select
                    id="fontFamily"
                    value={config.fontFamily}
                    onChange={(e) => setConfig({ ...config, fontFamily: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {fontOptions.map((font) => (
                      <option key={font.value} value={font.value}>
                        {font.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Color Preview */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-semibold mb-3">Color Preview</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: config.primaryColor }}
                      ></div>
                      <span className="text-sm">Primary Color - Headers, borders, accents</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: config.secondaryColor }}
                      ></div>
                      <span className="text-sm">Secondary Color - Text, labels, details</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50 flex justify-between">
          <Button variant="outline" onClick={handleReset}>
            Reset to Defaults
          </Button>
          <div className="space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Configuration
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}