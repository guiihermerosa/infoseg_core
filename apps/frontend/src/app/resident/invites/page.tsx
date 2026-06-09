'use client';

import { useEffect, useState, useCallback, FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useSocket } from '@/hooks/useSocket';
import api from '@/lib/api';
import { WS_EVENTS } from '@infoseg/shared';
import type {
  InviteListResponseDto,
  InviteItem,
  CreateInviteDto,
  InviteLinkResponseDto,
  VisitorRegisteredEvent,
} from '@infoseg/shared';
import { Plus, Copy, Check, Loader2, X } from 'lucide-react';

interface ValidationErrors {
  visitor_name?: string;
  valid_until?: string;
}

interface PendingVisitorCard {
  visit_id: string;
  visitor_name: string;
  thumbnail_url: string;
  loading?: 'approve' | 'deny';
  error?: string;
}

export default function ResidentInvitesPage() {
  // Invite list state
  const [invites, setInvites] = useState<InviteItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [visitorName, setVisitorName] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<ValidationErrors>({});
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Visitor registered notification cards
  const [pendingCards, setPendingCards] = useState<PendingVisitorCard[]>([]);

  // Copy link state
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const { on, setLastEventId } = useSocket();

  // Fetch invites list
  const fetchInvites = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<InviteListResponseDto>('/resident/invites');
      setInvites(response.data.items);

      // Load pending visitors that already registered (have visitor linked)
      // These are invites with status 'pending' that already have a visitor registered
      const pendingWithVisitor = response.data.items.filter(
        (inv) => inv.status === 'pending'
      );
      // For each pending invite, check if visitor already registered by looking at the invite
      // We'll show them as pending cards so the morador can approve/deny even after page refresh
      if (pendingWithVisitor.length > 0) {
        try {
          const pendingRes = await api.get<{ visitors: Array<{ visit_id: string; visitor_name: string; thumbnail_url: string }> }>('/resident/pending-visitors');
          const myPendingCards: PendingVisitorCard[] = pendingRes.data.visitors.map((v) => ({
            visit_id: v.visit_id,
            visitor_name: v.visitor_name,
            thumbnail_url: v.thumbnail_url || '',
          }));
          setPendingCards(myPendingCards);
        } catch {
          // skip
        }
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  // Listen for visitor_registered events
  useEffect(() => {
    const unsubscribe = on(WS_EVENTS.VISITOR_REGISTERED, (payload: unknown) => {
      const event = payload as VisitorRegisteredEvent;
      if (event.event_id) {
        setLastEventId(event.event_id);
      }

      setPendingCards((prev) => [
        ...prev,
        {
          visit_id: event.visit_id,
          visitor_name: event.visitor_name,
          thumbnail_url: event.thumbnail_url,
        },
      ]);
    });

    return unsubscribe;
  }, [on, setLastEventId]);

  // Client-side validation
  function validateForm(): ValidationErrors {
    const errors: ValidationErrors = {};

    if (!visitorName.trim()) {
      errors.visitor_name = 'Nome do visitante é obrigatório.';
    } else if (visitorName.trim().length > 100) {
      errors.visitor_name = 'Nome deve ter no máximo 100 caracteres.';
    }

    if (!validUntil) {
      errors.valid_until = 'Data de validade é obrigatória.';
    } else {
      const selectedDate = new Date(validUntil);
      const minDate = new Date(Date.now() + 60_000); // now + 1 min
      if (selectedDate <= minDate) {
        errors.valid_until = 'Data deve ser pelo menos 1 minuto no futuro.';
      }
    }

    return errors;
  }

  // Submit invite form
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitSuccess(false);

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setSubmitting(true);

    try {
      const dto: CreateInviteDto = {
        visitor_name: visitorName.trim(),
        valid_until: new Date(validUntil).toISOString(),
      };

      await api.post<InviteLinkResponseDto>('/resident/invite', dto);

      // Reset form
      setVisitorName('');
      setValidUntil('');
      setSubmitSuccess(true);

      // Refresh list
      await fetchInvites();

      // Hide success after 3s
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { status?: number; data?: { details?: Record<string, string[]>; message?: string } };
      };

      if (axiosErr.response?.status === 422) {
        const details = axiosErr.response.data?.details;
        if (details) {
          setFormErrors({
            visitor_name: details.visitor_name?.[0],
            valid_until: details.valid_until?.[0],
          });
        } else {
          setFormErrors({
            visitor_name: axiosErr.response.data?.message || 'Erro de validação.',
          });
        }
      } else {
        setFormErrors({ visitor_name: 'Erro ao criar convite. Tente novamente.' });
      }
    } finally {
      setSubmitting(false);
    }
  }

  // Approve visitor
  async function handleApprove(visitId: string) {
    setPendingCards((prev) =>
      prev.map((c) => (c.visit_id === visitId ? { ...c, loading: 'approve', error: undefined } : c))
    );

    try {
      await api.post(`/resident/visit/${visitId}/approve`);
      setPendingCards((prev) => prev.filter((c) => c.visit_id !== visitId));
      // Refresh invites list to update status
      fetchInvites();
    } catch {
      setPendingCards((prev) =>
        prev.map((c) =>
          c.visit_id === visitId
            ? { ...c, loading: undefined, error: 'Falha ao aprovar. Tente novamente.' }
            : c
        )
      );
    }
  }

  // Deny visitor
  async function handleDeny(visitId: string) {
    setPendingCards((prev) =>
      prev.map((c) => (c.visit_id === visitId ? { ...c, loading: 'deny', error: undefined } : c))
    );

    try {
      await api.post(`/resident/visit/${visitId}/deny`);
      setPendingCards((prev) => prev.filter((c) => c.visit_id !== visitId));
      // Refresh invites list to update status
      fetchInvites();
    } catch {
      setPendingCards((prev) =>
        prev.map((c) =>
          c.visit_id === visitId
            ? { ...c, loading: undefined, error: 'Falha ao recusar. Tente novamente.' }
            : c
        )
      );
    }
  }

  // Copy invite link
  function handleCopyLink(token: string) {
    const link = `${window.location.origin}/visitor/${token}`;

    // Fallback for HTTP (clipboard API requires HTTPS)
    const copyToClipboard = (text: string) => {
      if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
      }
      // Fallback: textarea trick
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return Promise.resolve();
    };

    copyToClipboard(link).then(() => {
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    });
  }

  // Status badge variant
  function getStatusBadge(status: string) {
    switch (status.toLowerCase()) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Aprovado</Badge>;
      case 'denied':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Recusado</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendente</Badge>;
    }
  }

  // Min datetime for the picker (now + 1 minute)
  function getMinDateTime(): string {
    const now = new Date(Date.now() + 60_000);
    return now.toISOString().slice(0, 16);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold md:text-2xl">Convites</h1>

      {/* Visitor registered notification cards */}
      {pendingCards.length > 0 && (
        <div className="space-y-3">
          {pendingCards.map((card) => (
            <Card key={card.visit_id} className="border-primary/30 bg-primary/5">
              <CardContent className="flex items-center gap-4 p-4">
                {/* Thumbnail */}
                <img
                  src={card.thumbnail_url.startsWith('http') ? card.thumbnail_url : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${card.thumbnail_url}`}
                  alt={`Foto de ${card.visitor_name}`}
                  className="h-12 w-12 rounded-full object-cover"
                />

                {/* Info */}
                <div className="flex-1">
                  <p className="font-medium">{card.visitor_name}</p>
                  <p className="text-sm text-muted-foreground">Visitante registrado — aguardando decisão</p>
                  {card.error && (
                    <p className="mt-1 text-sm text-destructive">{card.error}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="min-h-[44px] min-w-[44px] bg-green-600 hover:bg-green-700"
                    onClick={() => handleApprove(card.visit_id)}
                    disabled={card.loading !== undefined}
                    aria-label={`Permitir ${card.visitor_name}`}
                  >
                    {card.loading === 'approve' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Permitir'
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="min-h-[44px] min-w-[44px]"
                    onClick={() => handleDeny(card.visit_id)}
                    disabled={card.loading !== undefined}
                    aria-label={`Recusar ${card.visitor_name}`}
                  >
                    {card.loading === 'deny' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Recusar'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create invite form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Novo Convite</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="visitor_name">Nome do Visitante</Label>
              <Input
                id="visitor_name"
                type="text"
                placeholder="Nome completo do visitante"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                maxLength={100}
                aria-invalid={!!formErrors.visitor_name}
                aria-describedby={formErrors.visitor_name ? 'visitor_name_error' : undefined}
              />
              {formErrors.visitor_name && (
                <p id="visitor_name_error" className="text-sm text-destructive">
                  {formErrors.visitor_name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="valid_until">Válido até</Label>
              <Input
                id="valid_until"
                type="datetime-local"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                min={getMinDateTime()}
                aria-invalid={!!formErrors.valid_until}
                aria-describedby={formErrors.valid_until ? 'valid_until_error' : undefined}
              />
              {formErrors.valid_until && (
                <p id="valid_until_error" className="text-sm text-destructive">
                  {formErrors.valid_until}
                </p>
              )}
            </div>

            <Button type="submit" disabled={submitting} className="min-h-[44px] w-full">
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Criar Convite
            </Button>

            {submitSuccess && (
              <p className="text-center text-sm text-green-600">
                Convite criado com sucesso!
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Invite list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Meus Convites</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8" role="status">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="sr-only">Carregando convites...</span>
            </div>
          ) : invites.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhum convite criado ainda.
            </p>
          ) : (
            <div className="space-y-3">
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{invite.visitor_name}</p>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(invite.status)}
                      <span className="text-xs text-muted-foreground">
                        Válido até:{' '}
                        {new Date(invite.valid_until).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="min-h-[44px] min-w-[44px]"
                    onClick={() => handleCopyLink(invite.invite_link_token)}
                    aria-label={`Copiar link do convite de ${invite.visitor_name}`}
                  >
                    {copiedToken === invite.invite_link_token ? (
                      <>
                        <Check className="mr-1 h-4 w-4 text-green-600" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1 h-4 w-4" />
                        Copiar Link
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
