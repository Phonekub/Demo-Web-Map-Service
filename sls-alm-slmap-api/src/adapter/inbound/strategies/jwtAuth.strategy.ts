import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Strategy } from 'passport-jwt';
import { CustomRequest } from '../interfaces/requests/customRequest';
// import { JwtPayload } from '../../../common/interfaces/jwtPayload';
import { Builder } from 'builder-pattern';
import * as _ from 'lodash';
import { JwtPayload } from '../../../common/interfaces/jwtPayload';

export const JwtStrategy = 'jwt';

@Injectable()
export class JwtAuthStrategy extends PassportStrategy(Strategy, JwtStrategy) {
  constructor() {
    super({
      jwtFromRequest: (req: CustomRequest) => {
        if (!req.cookies) return null;

        return req.cookies.Authentication;
      },
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || '',
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    return Builder<JwtPayload>()
      .id(!_.isUndefined(payload.id) ? payload.id : null)
      .fullName(!_.isUndefined(payload.fullName) ? payload.fullName : '')
      .employeeId(!_.isUndefined(payload.employeeId) ? payload.employeeId : '')
      .departmentId(!_.isUndefined(payload.departmentId) ? payload.departmentId : '')
      .levelId(!_.isUndefined(payload.levelId) ? payload.levelId : '')
      .roleId(!_.isUndefined(payload.roleId) ? payload.roleId : null)
      .zoneCodes(!_.isUndefined(payload.zoneCodes) ? payload.zoneCodes : {})
      .permissions(!_.isUndefined(payload.permissions) ? payload.permissions : [])
      .storeCode(!_.isUndefined(payload.storeCode) ? payload.storeCode : [])
      .build();
  }
}
