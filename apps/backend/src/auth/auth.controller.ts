import { Body, Controller, HttpException, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterConciergeDto } from './dto/register-concierge.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ access_token: string }> {
    const ip = this.extractIp(req);

    try {
      return await this.authService.login(loginDto.email, loginDto.password, ip);
    } catch (error) {
      if (error instanceof HttpException && error.getStatus() === 429) {
        const response = error.getResponse() as Record<string, unknown>;
        const retryAfter = response.retryAfter as number;
        res.setHeader('Retry-After', String(retryAfter));
      }
      throw error;
    }
  }

  /**
   * POST /auth/register-concierge
   */
  @Post('register-concierge')
  async registerConcierge(
    @Body() dto: RegisterConciergeDto,
  ): Promise<{ id: string; name: string; email: string; message: string }> {
    const result = await this.authService.registerConcierge(dto);
    return { ...result, message: 'Porteiro cadastrado com sucesso. Faça login para acessar.' };
  }

  /**
   * POST /auth/forgot-password
   * Sends a 6-digit code to the email.
   */
  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    return this.authService.requestResetCode(body.email);
  }

  /**
   * POST /auth/verify-code
   * Verifies the 6-digit code.
   */
  @Post('verify-code')
  async verifyCode(@Body() body: { email: string; code: string }) {
    return this.authService.verifyResetCode(body.email, body.code);
  }

  /**
   * POST /auth/reset-password
   * Resets password using the verified code.
   */
  @Post('reset-password')
  async resetPassword(@Body() body: { email: string; code: string; new_password: string }) {
    return this.authService.resetPasswordWithCode(body.email, body.code, body.new_password);
  }

  /**
   * Extract client IP from request.
   */
  private extractIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];

    if (forwarded) {
      const forwardedStr = Array.isArray(forwarded) ? forwarded[0] : forwarded;
      return forwardedStr.split(',')[0].trim();
    }

    return req.ip || req.socket.remoteAddress || '0.0.0.0';
  }
}
