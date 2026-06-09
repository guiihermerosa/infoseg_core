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
   * Public endpoint for registering a new concierge (porteiro).
   * In production, this could require an invite code or approval flow.
   */
  @Post('register-concierge')
  async registerConcierge(
    @Body() dto: RegisterConciergeDto,
  ): Promise<{ id: string; name: string; email: string; message: string }> {
    const result = await this.authService.registerConcierge(dto);
    return { ...result, message: 'Porteiro cadastrado com sucesso. Faça login para acessar.' };
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
