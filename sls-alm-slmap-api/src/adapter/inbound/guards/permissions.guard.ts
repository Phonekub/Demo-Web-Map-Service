// role.guard.ts
import * as _ from 'lodash';
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permissions } from '../decorators/permissions.decorator';
import { JwtPayload } from '../../../common/interfaces/jwtPayload';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permissions = this.reflector.get(Permissions, context.getHandler());
    const request = context.switchToHttp().getRequest();
    if (!request.user) {
      return false;
    }

    const user = request.user as JwtPayload;
    if (!this.verifyPermissions(permissions, user.permissions)) {
      return false;
    }

    return true;
  }

  verifyPermissions(requiredPermissions: string[], userPermissions: string[]): boolean {
    return _.intersection(requiredPermissions, userPermissions).length > 0;
  }
}
