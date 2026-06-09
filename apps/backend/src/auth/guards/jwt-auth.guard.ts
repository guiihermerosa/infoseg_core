import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest<TUser = any>(err: any, user: TUser, info: any): TUser {
    if (err || !user) {
      const message =
        info?.name === 'TokenExpiredError'
          ? 'Token expirado'
          : 'Token inválido ou ausente';
      throw new UnauthorizedException(message);
    }
    return user;
  }
}
