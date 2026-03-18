import { Request } from 'express';
import { JwtPayload } from '../../../../common/interfaces/jwtPayload';

export interface CustomRequest extends Request {
  cookies: {
    Authentication: string;
    // Path: string;
    // 'Max-Age': number;
  };
  user: JwtPayload;
}
