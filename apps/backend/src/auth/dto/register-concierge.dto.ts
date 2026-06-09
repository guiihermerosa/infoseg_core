import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterConciergeDto {
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(20)
  phone!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}
