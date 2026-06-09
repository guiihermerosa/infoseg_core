import {
  IsBoolean,
  IsIn,
  IsInt,
  IsIP,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCameraDto {
  @IsNotEmpty({ message: 'O campo name é obrigatório' })
  @IsString()
  @MaxLength(100, { message: 'O campo name deve ter no máximo 100 caracteres' })
  name!: string;

  @IsNotEmpty({ message: 'O campo ip_address é obrigatório' })
  @IsIP('4', { message: 'O campo ip_address deve ser um IPv4 válido' })
  ip_address!: string;

  @IsNotEmpty({ message: 'O campo onvif_port é obrigatório' })
  @IsInt({ message: 'O campo onvif_port deve ser um número inteiro' })
  @Min(1, { message: 'O campo onvif_port deve ser entre 1 e 65535' })
  @Max(65535, { message: 'O campo onvif_port deve ser entre 1 e 65535' })
  onvif_port!: number;

  @IsNotEmpty({ message: 'O campo rtsp_port é obrigatório' })
  @IsInt({ message: 'O campo rtsp_port deve ser um número inteiro' })
  @Min(1, { message: 'O campo rtsp_port deve ser entre 1 e 65535' })
  @Max(65535, { message: 'O campo rtsp_port deve ser entre 1 e 65535' })
  rtsp_port!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  rtsp_url?: string;

  @IsOptional()
  @IsString()
  @IsIn(['onvif', 'rtsp'], { message: 'connection_type deve ser "onvif" ou "rtsp"' })
  connection_type?: string;

  @IsNotEmpty({ message: 'O campo username é obrigatório' })
  @IsString()
  @MaxLength(50, { message: 'O campo username deve ter no máximo 50 caracteres' })
  username!: string;

  @IsNotEmpty({ message: 'O campo password é obrigatório' })
  @IsString()
  @MaxLength(128, { message: 'O campo password deve ter no máximo 128 caracteres' })
  password!: string;

  @IsBoolean({ message: 'O campo ptz_supported deve ser booleano' })
  ptz_supported!: boolean;

  @IsNotEmpty({ message: 'O campo location_zone é obrigatório' })
  @IsString()
  @MaxLength(100, { message: 'O campo location_zone deve ter no máximo 100 caracteres' })
  location_zone!: string;
}
