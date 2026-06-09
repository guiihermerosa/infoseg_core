import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RateLimiterService } from './rate-limiter.service';
import { MailService } from './mail.service';

interface UserWithRole {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  role: 'resident' | 'concierge' | 'support';
}

interface ResetCodeEntry {
  code: string;
  email: string;
  expiresAt: number;
  used: boolean;
}

/** Rate limit configuration */
const RATE_LIMIT_EMAIL_MAX = 5;
const RATE_LIMIT_IP_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/** Support/maintenance account (configured via env) */
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'suporte@infoseg.com';
const SUPPORT_PASSWORD = process.env.SUPPORT_PASSWORD || 'Info2319@';
const SUPPORT_NAME = 'Suporte Técnico';

@Injectable()
export class AuthService {
  private resetCodes = new Map<string, ResetCodeEntry>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly rateLimiter: RateLimiterService,
    private readonly mailService: MailService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<UserWithRole, 'password_hash'> | null> {
    const user = await this.findByEmail(email);

    if (!user) {
      return null;
    }

    // Support account uses direct comparison (no bcrypt) since it's env-configured
    if (user.role === 'support') {
      if (password === user.password_hash) {
        const { password_hash, ...result } = user;
        return result;
      }
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return null;
    }

    const { password_hash, ...result } = user;
    return result;
  }

  async login(
    email: string,
    password: string,
    ip: string,
  ): Promise<{ access_token: string }> {
    // Check rate limits before validating credentials
    this.checkRateLimits(email, ip);

    const user = await this.validateUser(email, password);

    if (!user) {
      // Increment counters on failed login
      this.rateLimiter.increment(`email:${email}`, RATE_LIMIT_WINDOW_MS);
      this.rateLimiter.increment(`ip:${ip}`, RATE_LIMIT_WINDOW_MS);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset email counter on successful login
    this.rateLimiter.reset(`email:${email}`);

    const payload = { sub: user.id, role: user.role };
    const access_token = this.jwtService.sign(payload);

    return { access_token };
  }

  /**
   * Register a new concierge (porteiro).
   * Used by admin or the self-registration page.
   */
  async registerConcierge(data: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<{ id: string; name: string; email: string }> {
    const existing = await this.prisma.concierge.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new HttpException('E-mail já cadastrado.', HttpStatus.CONFLICT);
    }

    const password_hash = await bcrypt.hash(data.password, 12);

    const concierge = await this.prisma.concierge.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password_hash,
      },
      select: { id: true, name: true, email: true },
    });

    return concierge;
  }

  /**
   * Check rate limits for both email and IP.
   * Throws HttpException 429 if either limit is exceeded.
   */
  private checkRateLimits(email: string, ip: string): void {
    const emailKey = `email:${email}`;
    const ipKey = `ip:${ip}`;

    const emailAllowed = this.rateLimiter.checkLimit(
      emailKey,
      RATE_LIMIT_EMAIL_MAX,
      RATE_LIMIT_WINDOW_MS,
    );

    if (!emailAllowed) {
      const remainingSeconds = this.rateLimiter.getRemainingTime(emailKey);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Too many login attempts. Please try again in ${remainingSeconds} seconds.`,
          error: 'Too Many Requests',
          retryAfter: remainingSeconds,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const ipAllowed = this.rateLimiter.checkLimit(
      ipKey,
      RATE_LIMIT_IP_MAX,
      RATE_LIMIT_WINDOW_MS,
    );

    if (!ipAllowed) {
      const remainingSeconds = this.rateLimiter.getRemainingTime(ipKey);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Too many login attempts from this IP. Please try again in ${remainingSeconds} seconds.`,
          error: 'Too Many Requests',
          retryAfter: remainingSeconds,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async findByEmail(email: string): Promise<UserWithRole | null> {
    // Check support account first (env-configured)
    if (email === SUPPORT_EMAIL) {
      return {
        id: 'support-account',
        email: SUPPORT_EMAIL,
        name: SUPPORT_NAME,
        password_hash: SUPPORT_PASSWORD, // plain text for env-based support account
        role: 'support',
      };
    }

    // Search in Residents table
    const resident = await this.prisma.resident.findUnique({
      where: { email },
    });

    if (resident) {
      return {
        id: resident.id,
        email: resident.email,
        name: resident.name,
        password_hash: resident.password_hash,
        role: 'resident',
      };
    }

    // Search in Concierges table
    const concierge = await this.prisma.concierge.findUnique({
      where: { email },
    });

    if (concierge) {
      return {
        id: concierge.id,
        email: concierge.email,
        name: concierge.name,
        password_hash: concierge.password_hash,
        role: 'concierge',
      };
    }

    return null;
  }

  // ─── Password Reset with Email Code ─────────────────────────────────────

  async requestResetCode(email: string): Promise<{ message: string }> {
    // Always return same message (don't reveal if email exists)
    const genericMessage = 'Se o e-mail estiver cadastrado, você receberá um código de recuperação.';

    const user = await this.findByEmail(email);
    if (!user || user.role === 'support') {
      return { message: genericMessage };
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store code
    this.resetCodes.set(email, { code, email, expiresAt, used: false });

    // Send email
    await this.mailService.sendResetCode(email, code);

    return { message: genericMessage };
  }

  async verifyResetCode(email: string, code: string): Promise<{ valid: boolean }> {
    const entry = this.resetCodes.get(email);

    if (!entry) return { valid: false };
    if (entry.used) return { valid: false };
    if (Date.now() > entry.expiresAt) return { valid: false };
    if (entry.code !== code) return { valid: false };

    return { valid: true };
  }

  async resetPasswordWithCode(email: string, code: string, newPassword: string): Promise<{ message: string }> {
    const entry = this.resetCodes.get(email);

    if (!entry || entry.used || Date.now() > entry.expiresAt || entry.code !== code) {
      throw new HttpException('Código inválido ou expirado.', HttpStatus.BAD_REQUEST);
    }

    // Mark as used
    entry.used = true;

    // Hash new password
    const password_hash = await bcrypt.hash(newPassword, 12);

    // Update in Residents
    const resident = await this.prisma.resident.findUnique({ where: { email } });
    if (resident) {
      await this.prisma.resident.update({ where: { email }, data: { password_hash } });
      this.resetCodes.delete(email);
      return { message: 'Senha redefinida com sucesso.' };
    }

    // Update in Concierges
    const concierge = await this.prisma.concierge.findUnique({ where: { email } });
    if (concierge) {
      await this.prisma.concierge.update({ where: { email }, data: { password_hash } });
      this.resetCodes.delete(email);
      return { message: 'Senha redefinida com sucesso.' };
    }

    throw new HttpException('Usuário não encontrado.', HttpStatus.NOT_FOUND);
  }
}
