import { Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { JwtPayload } from '../../common/interfaces/jwtPayload';

@Injectable()
export class GenerateJwtTokenUseCase {
  constructor(private readonly jwtService: JwtService) {}

  handler(payload: JwtPayload, options?: JwtSignOptions): string {
    return this.jwtService.sign(payload, {
      algorithm: 'HS256',
      ...options,
    }) as string;
  }
}
