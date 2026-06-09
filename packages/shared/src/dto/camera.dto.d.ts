/**
 * DTOs do módulo de câmeras — compartilhados entre frontend e backend.
 */
/** Representação pública de uma câmera (sem credenciais) */
export interface CameraDto {
    id: string;
    name: string;
    ip_address: string;
    onvif_port: number;
    rtsp_port: number;
    ptz_supported: boolean;
    location_zone: string;
    is_online: boolean;
}
/** Resposta de GET /concierge/cameras */
export interface CameraListDto {
    cameras: CameraDto[];
    total: number;
}
/** Payload para POST /concierge/cameras */
export interface CameraCreateDto {
    name: string;
    ip_address: string;
    onvif_port: number;
    rtsp_port: number;
    username: string;
    password: string;
    ptz_supported: boolean;
    location_zone: string;
}
/** Payload para PUT /concierge/cameras/:id (todos os campos são opcionais) */
export interface CameraUpdateDto extends Partial<CameraCreateDto> {
}
/** Resposta de criação/atualização de câmera (inclui status de conexão) */
export interface CameraResponseDto extends CameraDto {
    connection_status: 'online' | 'offline';
}
/** Resposta de GET /concierge/cameras/:id/stream */
export interface StreamResponseDto {
    stream_url: string;
    protocol: 'whep' | 'fmp4';
}
/** Payload para POST /concierge/cameras/:id/ptz */
export interface PtzCommandDto {
    command: 'up' | 'down' | 'left' | 'right' | 'zoom_in' | 'zoom_out';
}
//# sourceMappingURL=camera.dto.d.ts.map