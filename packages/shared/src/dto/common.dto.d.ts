/**
 * DTOs comuns/genéricos — compartilhados entre frontend e backend.
 */
/** Formato padrão de erro da API */
export interface ApiError {
    statusCode: number;
    message: string;
    error: string;
    details?: Record<string, string[]>;
    timestamp: string;
    path: string;
}
/** Parâmetros de paginação para requisições */
export interface PaginationDto {
    page: number;
    limit: number;
}
/** Resposta paginada genérica */
export interface PaginatedResponseDto<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
}
//# sourceMappingURL=common.dto.d.ts.map