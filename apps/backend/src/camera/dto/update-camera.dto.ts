import {
  IsBoolean,
  IsIn,
  IsInt,
  IsIP,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateCameraDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsIP('4', { message: 'O campo ip_address deve ser um IPv4 válido' })
  ip_address?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  onvif_port?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  rtsp_port?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  rtsp_url?: string;

  @IsOptional()
  @IsString()
  @IsIn(['onvif', 'rtsp'])
  connection_type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  password?: string;

  @IsOptional()
  @IsBoolean()
  ptz_supported?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  location_zone?: string;
}
