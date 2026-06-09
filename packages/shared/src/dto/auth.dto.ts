/**
 * DTOs de autenticação — compartilhados entre frontend e backend.
 */

/** Payload para POST /auth/login */
export interface LoginDto {
  email: string;
  password: string;
}

/** Payload para POST /auth/forgot-password */
export interface ForgotPasswordDto {
  email: string;
}

/** Payload para POST /auth/reset-password */
export interface ResetPasswordDto {
  token: string;
  new_password: string;
}

/** Resposta de POST /auth/login */
export interface LoginResponseDto {
  access_token: string;
}
