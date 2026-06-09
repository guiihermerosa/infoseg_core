'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Camera, Wrench, Users, ScrollText, DoorOpen } from 'lucide-react';
import { CameraSettings } from '@/components/admin/CameraSettings';
import { SystemSettings } from '@/components/admin/SystemSettings';
import { UserManagement } from '@/components/admin/UserManagement';
import { SystemLogs } from '@/components/admin/SystemLogs';
import { AccessPointSettings } from '@/components/admin/AccessPointSettings';

type SettingsTab = 'users' | 'cameras' | 'access-points' | 'logs' | 'system';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('users');

  return (
    <div className="h-full flex flex-col p-4 overflow-auto">
      <div className="max-w-6xl mx-auto w-full space-y-4">
        <h1 className="text-xl font-semibold">Configurações Técnicas</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie usuários, câmeras IP e configurações gerais do sistema.
        </p>

        {/* Tab navigation */}
        <div className="flex gap-1 border-b border-border overflow-x-auto">
          <button
            onClick={() => setActiveTab('users')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              activeTab === 'users'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <Users className="h-4 w-4" />
            Usuários
          </button>
          <button
            onClick={() => setActiveTab('cameras')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              activeTab === 'cameras'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <Camera className="h-4 w-4" />
            Câmeras IP
          </button>
          <button
            onClick={() => setActiveTab('access-points')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              activeTab === 'access-points'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <DoorOpen className="h-4 w-4" />
            Portas / Relés
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              activeTab === 'logs'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <ScrollText className="h-4 w-4" />
            Logs
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              activeTab === 'system'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <Wrench className="h-4 w-4" />
            Sistema
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'cameras' && <CameraSettings />}
        {activeTab === 'access-points' && <AccessPointSettings />}
        {activeTab === 'logs' && <SystemLogs />}
        {activeTab === 'system' && <SystemSettings />}
      </div>
    </div>
  );
}
