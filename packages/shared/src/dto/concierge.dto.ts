/**
 * DTOs do módulo de porteiro/concierge — compartilhados entre frontend e backend.
 */

/** Payload para POST /concierge/action */
export interface ActionRequestDto {
  action_type: string;
  access_point_id: string;
  target_id?: string;
}

/** Resposta de POST /concierge/action */
export interface ActionResponseDto {
  success: boolean;
  timestamp: string;
}

/** Visitante pendente de aprovação */
export interface PendingVisitorDto {
  id: string;
  name: string;
  document: string;
  photo_url?: string;
  visit_id: string;
  resident_name: string;
  apartment: string;
}

/** Resposta de GET /concierge/visitors/pending */
export interface PendingVisitorListDto {
  visitors: PendingVisitorDto[];
}

/** Resumo de morador */
export interface ResidentSummaryDto {
  id: string;
  name: string;
  apartment_number: string;
  block: string;
}

/** Resposta de GET /concierge/residents */
export interface ResidentListDto {
  residents: ResidentSummaryDto[];
}
