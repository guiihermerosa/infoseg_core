'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  DoorOpen,
  Building2,
  UserCheck,
  Phone,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import type {
  ActionRequestDto,
  PendingVisitorDto,
  ResidentSummaryDto,
} from '@infoseg/shared';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActionType =
  | 'open_main_gate'
  | 'open_block_door'
  | 'entry_release'
  | 'call_resident'
  | 'panic';

interface ToastMessage {
  id: string;
  type: 'success' | 'error';
  message: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function QuickActions() {
  // Loading state per action
  const [loadingAction, setLoadingAction] = useState<ActionType | null>(null);

  // Selectors
  const [showVisitorSelect, setShowVisitorSelect] = useState(false);
  const [showResidentSelect, setShowResidentSelect] = useState(false);
  const [showPanicConfirm, setShowPanicConfirm] = useState(false);

  // Data lists
  const [pendingVisitors, setPendingVisitors] = useState<PendingVisitorDto[]>([]);
  const [residents, setResidents] = useState<ResidentSummaryDto[]>([]);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // ---------------------------
  // Toast helpers
  // ---------------------------

  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = Math.random().toString(36).substring(2) + Date.now().toString(36);
    setToasts((prev) => [...prev, { id, type, message }]);

    if (type === 'success') {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    }
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ---------------------------
  // API calls
  // ---------------------------

  const executeAction = useCallback(
    async (actionType: ActionType, accessPointId: string, targetId?: string) => {
      setLoadingAction(actionType);
      try {
        const body: ActionRequestDto = {
          action_type: actionType,
          access_point_id: accessPointId,
          ...(targetId ? { target_id: targetId } : {}),
        };
        await api.post('/concierge/action', body);
        addToast('success', getSuccessMessage(actionType));
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          getErrorMessage(actionType);
        addToast('error', message);
      } finally {
        setLoadingAction(null);
        setShowVisitorSelect(false);
        setShowResidentSelect(false);
        setShowPanicConfirm(false);
      }
    },
    [addToast]
  );

  // ---------------------------
  // Fetch helpers
  // ---------------------------

  const fetchPendingVisitors = useCallback(async () => {
    try {
      const res = await api.get<{ visitors: PendingVisitorDto[] }>('/concierge/visitors/pending');
      setPendingVisitors(res.data.visitors);
    } catch {
      addToast('error', 'Falha ao carregar lista de visitantes pendentes.');
    }
  }, [addToast]);

  const fetchResidents = useCallback(async () => {
    try {
      const res = await api.get<{ residents: ResidentSummaryDto[] }>('/concierge/residents');
      setResidents(res.data.residents);
    } catch {
      addToast('error', 'Falha ao carregar lista de moradores.');
    }
  }, [addToast]);

  // ---------------------------
  // Handlers
  // ---------------------------

  const handleOpenGate = () => {
    executeAction('open_main_gate', 'main_gate');
  };

  const handleOpenBlockDoor = () => {
    executeAction('open_block_door', 'block_door');
  };

  const handleLiberarEntrada = () => {
    setShowVisitorSelect(true);
    fetchPendingVisitors();
  };

  const handleSelectVisitor = (visitor: PendingVisitorDto) => {
    executeAction('entry_release', 'main_gate', visitor.visit_id);
  };

  const handleLigarMorador = () => {
    setShowResidentSelect(true);
    fetchResidents();
  };

  const handleSelectResident = (resident: ResidentSummaryDto) => {
    executeAction('call_resident', 'intercom', resident.id);
  };

  const handlePanic = () => {
    setShowPanicConfirm(true);
  };

  const confirmPanic = () => {
    executeAction('panic', 'all');
  };

  // Close selectors on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowVisitorSelect(false);
        setShowResidentSelect(false);
        setShowPanicConfirm(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-sm font-semibold text-foreground mb-3 px-1">
        Ações Rápidas
      </h2>

      <div className="flex-1 flex flex-col gap-2">
        {/* Abrir Portão Principal */}
        <ActionButton
          icon={<DoorOpen className="h-4 w-4" />}
          label="Abrir Portão Principal"
          loading={loadingAction === 'open_main_gate'}
          disabled={loadingAction !== null}
          onClick={handleOpenGate}
        />

        {/* Abrir Porta Bloco */}
        <ActionButton
          icon={<Building2 className="h-4 w-4" />}
          label="Abrir Porta Bloco"
          loading={loadingAction === 'open_block_door'}
          disabled={loadingAction !== null}
          onClick={handleOpenBlockDoor}
        />

        {/* Liberar Entrada */}
        <ActionButton
          icon={<UserCheck className="h-4 w-4" />}
          label="Liberar Entrada"
          loading={loadingAction === 'entry_release'}
          disabled={loadingAction !== null}
          onClick={handleLiberarEntrada}
        />

        {/* Selector: Pending visitors */}
        {showVisitorSelect && (
          <SelectorDropdown
            title="Selecionar Visitante"
            items={pendingVisitors}
            getLabel={(v) => `${v.name} — ${v.resident_name} (${v.apartment})`}
            onSelect={handleSelectVisitor}
            onClose={() => setShowVisitorSelect(false)}
            emptyMessage="Nenhum visitante pendente."
          />
        )}

        {/* Ligar para Morador */}
        <ActionButton
          icon={<Phone className="h-4 w-4" />}
          label="Ligar para Morador"
          loading={loadingAction === 'call_resident'}
          disabled={loadingAction !== null}
          onClick={handleLigarMorador}
        />

        {/* Selector: Residents */}
        {showResidentSelect && (
          <SelectorDropdown
            title="Selecionar Morador"
            items={residents}
            getLabel={(r) => `${r.name} — Bl. ${r.block}, Ap. ${r.apartment_number}`}
            onSelect={handleSelectResident}
            onClose={() => setShowResidentSelect(false)}
            emptyMessage="Nenhum morador encontrado."
          />
        )}

        {/* Acionar Alerta de Pânico */}
        <ActionButton
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Acionar Alerta de Pânico"
          loading={loadingAction === 'panic'}
          disabled={loadingAction !== null}
          onClick={handlePanic}
          variant="destructive"
        />

        {/* Panic confirmation dialog */}
        {showPanicConfirm && (
          <div className="p-3 rounded-md border border-destructive bg-destructive/10 space-y-2">
            <p className="text-sm font-medium text-destructive">
              Confirma o acionamento do Alerta de Pânico?
            </p>
            <p className="text-xs text-muted-foreground">
              Todos os porteiros e sistemas integrados serão notificados.
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={confirmPanic}
                disabled={loadingAction !== null}
              >
                Confirmar Pânico
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowPanicConfirm(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Toasts */}
      {toasts.length > 0 && (
        <div className="mt-3 space-y-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`p-2 rounded-md text-xs flex items-center justify-between gap-2 ${
                toast.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              <span>{toast.message}</span>
              {toast.type === 'error' && (
                <button
                  onClick={() => dismissToast(toast.id)}
                  className="text-red-600 hover:text-red-800 font-bold text-sm leading-none"
                  aria-label="Fechar notificação"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
  variant?: 'default' | 'destructive';
}

function ActionButton({
  icon,
  label,
  loading,
  disabled,
  onClick,
  variant = 'default',
}: ActionButtonProps) {
  return (
    <Button
      variant={variant}
      size="sm"
      className="w-full justify-start gap-2"
      disabled={disabled}
      onClick={onClick}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {label}
    </Button>
  );
}

interface SelectorDropdownProps<T> {
  title: string;
  items: T[];
  getLabel: (item: T) => string;
  onSelect: (item: T) => void;
  onClose: () => void;
  emptyMessage: string;
}

function SelectorDropdown<T>({
  title,
  items,
  getLabel,
  onSelect,
  onClose,
  emptyMessage,
}: SelectorDropdownProps<T>) {
  return (
    <div className="p-3 rounded-md border border-border bg-muted/50 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">{title}</span>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground text-sm leading-none"
          aria-label="Fechar seletor"
        >
          ×
        </button>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">{emptyMessage}</p>
      ) : (
        <ul className="max-h-40 overflow-y-auto space-y-1">
          {items.map((item, idx) => (
            <li key={idx}>
              <button
                className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={() => onSelect(item)}
              >
                {getLabel(item)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSuccessMessage(action: ActionType): string {
  switch (action) {
    case 'open_main_gate':
      return 'Portão principal aberto com sucesso.';
    case 'open_block_door':
      return 'Porta do bloco aberta com sucesso.';
    case 'entry_release':
      return 'Entrada liberada com sucesso.';
    case 'call_resident':
      return 'Chamada para morador iniciada.';
    case 'panic':
      return 'Alerta de pânico acionado!';
  }
}

function getErrorMessage(action: ActionType): string {
  switch (action) {
    case 'open_main_gate':
      return 'Falha ao abrir portão principal. O ponto de acesso não respondeu.';
    case 'open_block_door':
      return 'Falha ao abrir porta do bloco. O ponto de acesso não respondeu.';
    case 'entry_release':
      return 'Falha ao liberar entrada.';
    case 'call_resident':
      return 'Falha ao iniciar chamada para morador.';
    case 'panic':
      return 'Falha ao acionar alerta de pânico.';
  }
}
