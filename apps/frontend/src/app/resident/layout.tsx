'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Mail, Phone, CalendarDays, LogOut, Shield, PhoneCall } from 'lucide-react';
import { cn } from '@/lib/utils';
import { removeToken } from '@/lib/auth';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/resident/dashboard', label: 'Início', icon: LayoutDashboard },
  { href: '/resident/invites', label: 'Convites', icon: Mail },
  { href: '/resident/reservations', label: 'Reservas', icon: CalendarDays },
  { href: '/resident/intercom', label: 'Interfone', icon: Phone },
] as const;

export default function ResidentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [residentName, setResidentName] = useState<string>('');
  const [callingConcierge, setCallingConcierge] = useState(false);

  useEffect(() => {
    api.get<{ name: string }>('/resident/me')
      .then(res => setResidentName(res.data.name))
      .catch(() => setResidentName(''));
  }, []);

  function handleLogout() {
    removeToken();
    router.push('/login');
  }

  async function handleCallConcierge() {
    setCallingConcierge(true);
    try {
      await api.post('/resident/call-concierge');
      alert('Chamada enviada para a portaria!');
    } catch {
      alert('Não foi possível ligar para a portaria.');
    } finally {
      setCallingConcierge(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-border/50 px-4 py-3 md:px-6">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">INFOSEG</p>
              {residentName && (
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Olá, {residentName.split(' ')[0]}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCallConcierge}
              disabled={callingConcierge}
              className="text-xs gap-1.5 border-green-200 text-green-700 hover:bg-green-50 h-8"
            >
              <PhoneCall className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Portaria</span>
            </Button>

            <button
              onClick={handleLogout}
              className="flex items-center text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-md hover:bg-muted"
              aria-label="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 py-5 pb-24 md:px-6 md:py-8">
        <div className="mx-auto w-full max-w-4xl space-y-5 animate-in">
          {children}
        </div>
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-t border-border/50">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-around px-2">
          {navItems.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex min-h-[44px] min-w-[52px] flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-2 text-[10px] font-medium transition-all duration-200',
                  isActive
                    ? 'text-primary bg-primary/8'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={cn('h-5 w-5', isActive && 'scale-110')} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
