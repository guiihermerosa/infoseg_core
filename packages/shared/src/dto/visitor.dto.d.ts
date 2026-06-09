/**
 * DTOs do módulo de visitante — compartilhados entre frontend e backend.
 */
/** Resposta de GET /visitor/invite/:token */
export interface InviteStatusDto {
    status: string;
    visitor_name: string;
    valid_until: string;
}
/** Payload para POST /visitor/register (multipart — campos de texto) */
export interface RegisterVisitorDto {
    name: string;
    document: string;
    token: string;
}
/** Resposta de POST /visitor/register */
export interface RegisterResponseDto {
    success: boolean;
    visit_id: string;
}
//# sourceMappingURL=visitor.dto.d.ts.map