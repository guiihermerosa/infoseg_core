'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useSocket } from '@/hooks/useSocket';
import api from '@/lib/api';
import { WS_EVENTS } from '@infoseg/shared';
import type { DashboardResponseDto, AccessLogEntry } from '@infoseg/shared';
import type { AccessLogUpdatedEvent } from '@infoseg/shared';
import { CheckCircle, XCircle, Clock, RefreshCw, Loader2 } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

export default function ResidentDashboardPage() {
  const [data, setData] = useState<DashboardResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { on, setLastEventId } = useSocket();

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<DashboardResponseDto>('/resident/dashboard');
      setData(response.data);
    } catch {
      setError('Não foi possível carregar os dados do dashboard. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Listen to access_log_updated WebSocket event
  useEffect(() => {
    const unsubscribe = on(WS_EVENTS.ACCESS_LOG_UPDATED, (payload: unknown) => {
      const event = payload as AccessLogUpdatedEvent;
      if (event.event_id) {
        setLastEventId(event.event_id);
      }

      setData((prev) => {
        if (!prev) return prev;

        const newLog: AccessLogEntry = event.log_entry;
        const updatedLogs = [newLog, ...prev.logs].slice(0, 20);

        // Update counters based on the method/action type
        return {
          ...prev,
          approved: prev.approved + (newLog.method === 'approved' ? 1 : 0),
          denied: prev.denied + (newLog.method === 'denied' ? 1 : 0),
          pending: prev.pending + (newLog.method === 'pending' ? 1 : 0),
          logs: updatedLogs,
        };
      });

      // Reset to page 1 when new log arrives
      setCurrentPage(1);
    });

    return unsubscribe;
  }, [on, setLastEventId]);

  // Pagination helpers
  const totalPages = data ? Math.ceil(data.logs.length / ITEMS_PER_PAGE) : 0;
  const paginatedLogs = data
    ? data.logs.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
      )
    : [];

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-label="Carregando">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">Carregando dados do dashboard...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-center text-muted-foreground">{error}</p>
        <Button onClick={fetchDashboard} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  // Empty state
  if (data && data.approved === 0 && data.denied === 0 && data.pending === 0 && data.logs.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2">
        <p className="text-center text-lg text-muted-foreground">
          Nenhum registro de acesso nos últimos 7 dias.
        </p>
        <p className="text-center text-sm text-muted-foreground">
          Quando houver visitas à sua unidade, elas aparecerão aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold md:text-2xl">Dashboard</h1>

      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{data?.approved ?? 0}</div>
            <p className="text-xs text-muted-foreground">Últimos 7 dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recusadas</CardTitle>
            <XCircle className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{data?.denied ?? 0}</div>
            <p className="text-xs text-muted-foreground">Últimos 7 dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{data?.pending ?? 0}</div>
            <p className="text-xs text-muted-foreground">Últimos 7 dias</p>
          </CardContent>
        </Card>
      </div>

      {/* Access log table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Registro de Acessos</CardTitle>
        </CardHeader>
        <CardContent>
          {paginatedLogs.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhum registro de acesso encontrado.
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Visitante</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Ponto de Acesso</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.visitor_name}</TableCell>
                      <TableCell>{log.date}</TableCell>
                      <TableCell>{log.time}</TableCell>
                      <TableCell>{log.method}</TableCell>
                      <TableCell>{log.access_point}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
