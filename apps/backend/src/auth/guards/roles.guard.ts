import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException('Acesso negado: perfil não identificado');
    }

    if (!requiredRoles.includes(user.role)) {
      // 'support' role has access to everything that 'concierge' has
      if (user.role === 'support' && requiredRoles.includes('concierge')) {
        return true;
      }
      throw new ForbiddenException('Acesso negado: permissão insuficiente');
    }

    return true;
  }
}
