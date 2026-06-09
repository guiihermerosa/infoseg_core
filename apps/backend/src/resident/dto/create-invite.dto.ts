import { IsString, MinLength, MaxLength, IsDateString } from 'class-validator';

export class CreateInviteDto {
  @IsString()
  @MinLength(1, { message: 'visitor_name deve ter ao menos 1 caractere' })
  @MaxLength(100, { message: 'visitor_name deve ter no máximo 100 caracteres' })
  visitor_name!: string;

  @IsDateString({}, { message: 'valid_until deve ser uma data/hora válida no formato ISO 8601' })
  valid_until!: string;
}
