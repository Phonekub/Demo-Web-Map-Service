import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { CookieOptions, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { GenerateJwtTokenUseCase } from '../../../application/usecases/generateJwtToken.usecase';
import { CustomRequest } from '../interfaces/requests/customRequest';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { OAuth2CallbackUseCase } from '../../../application/usecases/auth/oauth2Callback.usecase';
import { GenerateAdURLUseCase } from '../../../application/usecases/auth/generateAdURL.usecase';

const cookieAuthenticationKey = 'Authentication';

@Controller('')
export class AuthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly generateJwtTokenUseCase: GenerateJwtTokenUseCase,
    private readonly oauth2CallbackUseCase: OAuth2CallbackUseCase,
    private readonly generateAdURLUseCase: GenerateAdURLUseCase,
  ) {}

  @Post('auth/login')
  async loginWithAD(@Res() res: Response) {
    const authenticationUrl = await this.generateAdURLUseCase.handler();
    return res.status(200).json({ redirectUrl: authenticationUrl });
  }

  @Post('oauth2callback')
  async oauth2Callback(@Body() body: { code: string }, @Res() res: Response) {
    const cookieExpirationTime = this.configService.get('COOKIE_EXPIRATION_TIME');

    try {
      const authorizationCode = body.code;
      const { token } = await this.oauth2CallbackUseCase.handler(authorizationCode);

      const cookiesOpts: CookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: cookieExpirationTime,
      };
      res.cookie(cookieAuthenticationKey, token, cookiesOpts);
      return res.json({ success: true });
    } catch (error: unknown) {
      if (error instanceof UnauthorizedException) {
        throw new UnauthorizedException('Permission Not Found');
      }

      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('auth/logout')
  async logoutAD(@Req() req: CustomRequest, @Res() res: Response) {
    const logoutUrl = `${this.configService.get(
      'AD_LOGOUT_URL',
    )}?client_id=${this.configService.get(
      'AD_CLIENT_ID',
    )}&logout_uri=${this.configService.get('AD_LOGOUT_URI')}`;

    res.clearCookie(cookieAuthenticationKey, { path: '/' });
    return res.json({
      logoutUrl,
    });
  }
}
