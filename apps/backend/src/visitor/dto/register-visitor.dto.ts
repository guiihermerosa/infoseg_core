import {
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * DTO for visitor registration (POST /visitor/register).
 * Multipart form data — text fields validated here, photo handled separately.
 */
export class RegisterVisitorDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
  @MaxLength(120, { message: 'Nome deve ter no máximo 120 caracteres' })
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'Documento deve ter no mínimo 5 caracteres' })
  @MaxLength(30, { message: 'Documento deve ter no máximo 30 caracteres' })
  document!: string;

  @IsString()
  @IsNotEmpty()
  @IsUUID('4', { message: 'Token deve estar no formato UUID v4' })
  token!: string;
}
