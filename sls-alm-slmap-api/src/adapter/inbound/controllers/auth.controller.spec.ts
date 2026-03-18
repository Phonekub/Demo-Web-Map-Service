import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

import { AuthController } from './auth.controller';
import { GenerateJwtTokenUseCase } from '../../../application/usecases/generateJwtToken.usecase';
import { OAuth2CallbackUseCase } from '../../../application/usecases/auth/oauth2Callback.usecase';
import { GenerateAdURLUseCase } from '../../../application/usecases/auth/generateAdURL.usecase';

describe('AuthController', () => {
  let controller: AuthController;

  let configService: { get: jest.Mock };
  let generateJwtTokenUseCase: { handler: jest.Mock };
  let oauth2CallbackUseCase: { handler: jest.Mock };
  let generateAdURLUseCase: { handler: jest.Mock };

  const createMockResponse = () => {
    const res: Partial<Response> = {};
    (res as any).status = jest.fn().mockReturnValue(res);
    (res as any).json = jest.fn().mockReturnValue(res);
    (res as any).cookie = jest.fn().mockReturnValue(res);
    (res as any).clearCookie = jest.fn().mockReturnValue(res);
    return res as Response & {
      status: jest.Mock;
      json: jest.Mock;
      cookie: jest.Mock;
      clearCookie: jest.Mock;
    };
  };

  beforeEach(async () => {
    configService = { get: jest.fn() };
    generateJwtTokenUseCase = { handler: jest.fn() };
    oauth2CallbackUseCase = { handler: jest.fn() };
    generateAdURLUseCase = { handler: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: ConfigService, useValue: configService },
        { provide: GenerateJwtTokenUseCase, useValue: generateJwtTokenUseCase },
        { provide: OAuth2CallbackUseCase, useValue: oauth2CallbackUseCase },
        { provide: GenerateAdURLUseCase, useValue: generateAdURLUseCase },
      ],
    }).compile();

    controller = module.get(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('loginWithAD', () => {
    it('should return redirectUrl with 200', async () => {
      const res = createMockResponse();
      generateAdURLUseCase.handler.mockResolvedValue('https://login.example.com');

      await controller.loginWithAD(res);

      expect(generateAdURLUseCase.handler).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        redirectUrl: 'https://login.example.com',
      });
    });

    it('should propagate errors from generateAdURLUseCase', async () => {
      const res = createMockResponse();
      generateAdURLUseCase.handler.mockRejectedValue(new Error('boom'));

      await expect(controller.loginWithAD(res)).rejects.toThrow('boom');
    });
  });

  describe('oauth2Callback', () => {
    it('should set Authentication cookie and return success true', async () => {
      const res = createMockResponse();

      configService.get.mockImplementation((key: string) => {
        if (key === 'COOKIE_EXPIRATION_TIME') return 12345;
        return undefined;
      });

      oauth2CallbackUseCase.handler.mockResolvedValue({ token: 'jwt.token.here' });

      await controller.oauth2Callback({ code: 'auth-code' }, res);

      expect(configService.get).toHaveBeenCalledWith('COOKIE_EXPIRATION_TIME');
      expect(oauth2CallbackUseCase.handler).toHaveBeenCalledWith('auth-code');

      expect(res.cookie).toHaveBeenCalledWith(
        'Authentication',
        'jwt.token.here',
        expect.objectContaining({
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 12345,
        }),
      );
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('should rethrow UnauthorizedException as Permission Not Found', async () => {
      const res = createMockResponse();

      configService.get.mockReturnValue(1000);
      oauth2CallbackUseCase.handler.mockRejectedValue(
        new UnauthorizedException('original unauthorized'),
      );

      await expect(controller.oauth2Callback({ code: 'x' }, res)).rejects.toThrow(
        UnauthorizedException,
      );

      await expect(controller.oauth2Callback({ code: 'x' }, res)).rejects.toMatchObject({
        message: 'Permission Not Found',
      });
    });

    it('should propagate non-UnauthorizedException errors', async () => {
      const res = createMockResponse();

      configService.get.mockReturnValue(1000);
      oauth2CallbackUseCase.handler.mockRejectedValue(new Error('some error'));

      await expect(controller.oauth2Callback({ code: 'x' }, res)).rejects.toThrow(
        'some error',
      );
    });
  });

  describe('logoutAD', () => {
    it('should clear cookie and return logoutUrl', async () => {
      const res = createMockResponse();

      configService.get.mockImplementation((key: string) => {
        if (key === 'AD_LOGOUT_URL') return 'https://logout.example.com/logout';
        if (key === 'AD_CLIENT_ID') return 'client-123';
        if (key === 'AD_LOGOUT_URI') return 'https://app.example.com/after-logout';
        return undefined;
      });

      // Method signature requires req, but controller implementation does not use it (guard injects user).
      const req = {} as any;

      const result = await controller.logoutAD(req, res);

      expect(configService.get).toHaveBeenCalledWith('AD_LOGOUT_URL');
      expect(configService.get).toHaveBeenCalledWith('AD_CLIENT_ID');
      expect(configService.get).toHaveBeenCalledWith('AD_LOGOUT_URI');

      expect(res.clearCookie).toHaveBeenCalledWith('Authentication', { path: '/' });
      expect(res.json).toHaveBeenCalledWith({
        logoutUrl:
          'https://logout.example.com/logout?client_id=client-123&logout_uri=https://app.example.com/after-logout',
      });
      expect(result).toBe(res);
    });
  });
});
