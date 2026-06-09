/**
 * DTOs do módulo de morador — compartilhados entre frontend e backend.
 */

/** Entrada de AccessLog retornada no dashboard */
export interface AccessLogEntry {
  id: string;
  visitor_name: string;
  date: string;
  time: string;
  method: string;
  access_point: string;
}

/** Resposta de GET /resident/dashboard */
export interface DashboardResponseDto {
  approved: number;
  denied: number;
  pending: number;
  logs: AccessLogEntry[];
}

/** Resposta de POST /resident/invite */
export interface InviteLinkResponseDto {
  invite_link: string;
  token: string;
  visit_id: string;
}

/** Payload para POST /resident/invite */
export interface CreateInviteDto {
  visitor_name: string;
  valid_until: string;
}

/** Item individual da lista de convites */
export interface InviteItem {
  id: string;
  visitor_name: string;
  status: string;
  valid_until: string;
  invite_link_token: string;
  created_at: string;
}

/** Resposta de GET /resident/invites */
export interface InviteListResponseDto {
  items: InviteItem[];
  total: number;
  page: number;
}
