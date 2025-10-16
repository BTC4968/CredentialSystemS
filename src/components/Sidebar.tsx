'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Users, LogOut, Sun, Key, UserPlus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="w-64 h-full bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-xl font-bold text-sidebar-foreground">CredentialSys</h1>
            <p className="text-sm text-muted-foreground">Secure Management</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-6">
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
            Navigation
          </h3>
          
          <Button
            variant={activeTab === 'clients' ? 'secondary' : 'ghost'}
            className={`w-full justify-start ${
              activeTab === 'clients' 
                ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            }`}
            onClick={() => onTabChange('clients')}
          >
            <Users className="h-4 w-4 mr-3" />
            Clients
          </Button>

          <Button
            variant={activeTab === 'credentials' ? 'secondary' : 'ghost'}
            className={`w-full justify-start ${
              activeTab === 'credentials' 
                ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            }`}
            onClick={() => onTabChange('credentials')}
          >
            <Key className="h-4 w-4 mr-3" />
            Credentials
          </Button>

          {user?.role === 'ADMIN' && (
            <>
              <Button
                variant={activeTab === 'staff' ? 'secondary' : 'ghost'}
                className={`w-full justify-start ${
                  activeTab === 'staff' 
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`}
                onClick={() => onTabChange('staff')}
              >
                <UserPlus className="h-4 w-4 mr-3" />
                Staff Management
              </Button>

              <Button
                variant={activeTab === 'audit' ? 'secondary' : 'ghost'}
                className={`w-full justify-start ${
                  activeTab === 'audit' 
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`}
                onClick={() => onTabChange('audit')}
              >
                <FileText className="h-4 w-4 mr-3" />
                Audit Logs
              </Button>
            </>
          )}
        </div>
      </div>

      {/* User Info */}
      <div className="p-6 border-t border-sidebar-border">
        <div className="bg-sidebar-accent rounded-lg p-4 mb-4">
          <div className="text-sm font-medium text-sidebar-accent-foreground">
            {user?.name}
          </div>
          <div className="text-xs text-muted-foreground">
            {user?.email}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {user?.role?.toUpperCase()}
          </div>
        </div>
        
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  );
}
