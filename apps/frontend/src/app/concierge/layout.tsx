'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { MonitorPlay, Settings, Shield, LogOut } from 'lucide-react';

const navTabs = [
  { href: '/concierge/cameras', label: 'Monitoramento', icon: MonitorPlay },
  { href: '/concierge/settings', label: 'Configurações', icon: Settings },
] as const;

export default function ConciergeLayout({ children }: { children: React.ReactNode }) {
  const { logout, role } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSmallViewport, setIsSmallViewport] = useState(false);

  useEffect(() => {
    if (role !== 'concierge' && role !== 'support') {
      router.push('/login');
    }
  }, [role, router]);

  useEffect(() => {
    const checkViewport = () => setIsSmallViewport(window.innerWidth < 1280);
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-14 border-b border-border/50 flex items-center justify-between px-6 bg-white/80 backdrop-blur-lg sticky top-0 z-40 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-base font-bold tracking-tight">INFOSEG CORE</h1>
          </div>

          {/* Navigation tabs */}
          <nav className="flex items-center gap-1 ml-4">
            {navTabs.map((tab) => {
              const isActive = pathname?.startsWith(tab.href);
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    'flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary/10 text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden md:inline">{tab.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-destructive">
          <LogOut className="h-4 w-4 mr-1.5" />
          Sair
        </Button>
      </header>

      {/* Viewport warning */}
      {isSmallViewport && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 text-sm text-amber-800 shrink-0 flex items-center gap-2">
          <span className="text-amber-500">⚠</span>
          <span>Resolução mínima recomendada: 1280×720. Para melhor experiência, utilize um monitor maior.</span>
        </div>
      )}

      {/* Main content area */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
