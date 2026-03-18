import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtStrategy } from '../strategies/jwtAuth.strategy';

@Injectable()
export class JwtAuthGuard extends AuthGuard(JwtStrategy) {}
