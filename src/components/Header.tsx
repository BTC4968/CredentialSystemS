'use client';

import React from 'react';
import { Shield, Sun, Moon, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

interface HeaderProps {
  title: string;
  onLogout: () => void;
}

export default function Header({ title, onLogout }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="h-16 bg-background border-b border-border flex items-center justify-between px-6">
      <div className="flex items-center space-x-4">
        {/* <Shield className="h-6 w-6 text-primary" /> */}
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={toggleTheme}
          className="hover:bg-accent hover:text-accent-foreground"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
        </Button>
        <Button variant="ghost" size="sm" onClick={onLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}
