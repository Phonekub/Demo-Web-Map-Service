import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';
import ADCognitoGateway from './adCognito.gateway';
import { AxiosError, AxiosResponse } from 'axios';
import { of, throwError } from 'rxjs';

describe('ADCognitoGateway - Axios Compatibility Tests', () => {
  let gateway: ADCognitoGateway;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  const mockConfig = {
    AD_TOKEN_URL: 'https://auth.example.com/oauth/token',
    AD_CLIENT_ID: 'test-client-id',
    AD_CLIENT_SECRET: 'test-client-secret',
    AD_CALLBACK_URL: 'https://app.example.com/callback',
    AD_GET_USER_INFO_URL: 'https://auth.example.com/userinfo',
  };

  const mockTokenResponse = {
    id_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
    access_token: 'mock-access-token-12345',
    refresh_token: 'mock-refresh-token-67890',
    expires_in: 3600,
    token_type: 'Bearer',
  };

  const mockUserInfo = {
    sub: 'user-123',
    email: 'test@example.com',
    'custom:EmployeeID': '12345',
    name: 'Test User',
  };

  beforeEach(async () => {
    const mockAxiosRef = {
      post: jest.fn(),
      get: jest.fn(),
    };

    httpService = {
      axiosRef: mockAxiosRef,
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
      head: jest.fn(),
      request: jest.fn(),
    } as any;

    configService = {
      get: jest.fn((key: string) => mockConfig[key]),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ADCognitoGateway,
        {
          provide: HttpService,
          useValue: httpService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    gateway = module.get<ADCognitoGateway>(ADCognitoGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getToken', () => {
    it('should successfully get token with valid authorization code', async () => {
      const authCode = 'valid-auth-code-123';

      (httpService.axiosRef.post as jest.Mock).mockResolvedValue({
        data: mockTokenResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const result = await gateway.getToken(authCode);

      expect(result).toBeDefined();
      expect(result.idToken).toBe(mockTokenResponse.id_token);
      expect(result.accessToken).toBe(mockTokenResponse.access_token);

      // Verify axios was called with correct parameters
      expect(httpService.axiosRef.post).toHaveBeenCalledTimes(1);
      expect(httpService.axiosRef.post).toHaveBeenCalledWith(
        mockConfig.AD_TOKEN_URL,
        {
          grant_type: 'authorization_code',
          client_id: mockConfig.AD_CLIENT_ID,
          code: authCode,
          redirect_uri: mockConfig.AD_CALLBACK_URL,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: expect.stringMatching(/^Basic /),
          },
        },
      );
    });

    it('should construct correct Basic auth header', async () => {
      const authCode = 'test-code';

      (httpService.axiosRef.post as jest.Mock).mockResolvedValue({
        data: mockTokenResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      await gateway.getToken(authCode);

      const callArgs = (httpService.axiosRef.post as jest.Mock).mock.calls[0];
      const headers = callArgs[2].headers;

      const expectedAuth = Buffer.from(
        `${mockConfig.AD_CLIENT_ID}:${mockConfig.AD_CLIENT_SECRET}`,
      ).toString('base64');

      expect(headers.Authorization).toBe(`Basic ${expectedAuth}`);
    });

    it('should throw InternalServerErrorException when axios post fails', async () => {
      const authCode = 'invalid-code';
      const axiosError = {
        message: 'Request failed with status code 401',
        response: {
          status: 401,
          data: { error: 'invalid_grant' },
        },
      };

      (httpService.axiosRef.post as jest.Mock).mockRejectedValue(axiosError);

      await expect(gateway.getToken(authCode)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(gateway.getToken(authCode)).rejects.toThrow(
        'Request failed with status code 401',
      );
    });

    it('should handle network errors gracefully', async () => {
      const authCode = 'test-code';
      const networkError = new Error('Network Error');

      (httpService.axiosRef.post as jest.Mock).mockRejectedValue(networkError);

      await expect(gateway.getToken(authCode)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(gateway.getToken(authCode)).rejects.toThrow('Network Error');
    });

    it('should handle timeout errors', async () => {
      const authCode = 'test-code';
      const timeoutError = {
        message: 'timeout of 5000ms exceeded',
        code: 'ECONNABORTED',
      };

      (httpService.axiosRef.post as jest.Mock).mockRejectedValue(timeoutError);

      await expect(gateway.getToken(authCode)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should correctly read all configuration values', async () => {
      const authCode = 'test-code';

      (httpService.axiosRef.post as jest.Mock).mockResolvedValue({
        data: mockTokenResponse,
      });

      await gateway.getToken(authCode);

      expect(configService.get).toHaveBeenCalledWith('AD_TOKEN_URL');
      expect(configService.get).toHaveBeenCalledWith('AD_CLIENT_ID');
      expect(configService.get).toHaveBeenCalledWith('AD_CLIENT_SECRET');
      expect(configService.get).toHaveBeenCalledWith('AD_CALLBACK_URL');
    });
  });

  describe('getUserInfo', () => {
    it('should successfully get user info with valid access token', async () => {
      const accessToken = 'valid-access-token';

      (httpService.axiosRef.get as jest.Mock).mockResolvedValue({
        data: mockUserInfo,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const result = await gateway.getUserInfo(accessToken);

      expect(result).toEqual(mockUserInfo);

      // Verify axios was called with correct parameters
      expect(httpService.axiosRef.get).toHaveBeenCalledTimes(1);
      expect(httpService.axiosRef.get).toHaveBeenCalledWith(
        mockConfig.AD_GET_USER_INFO_URL,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
    });

    it('should construct correct Bearer token header', async () => {
      const accessToken = 'test-token-12345';

      (httpService.axiosRef.get as jest.Mock).mockResolvedValue({
        data: mockUserInfo,
      });

      await gateway.getUserInfo(accessToken);

      const callArgs = (httpService.axiosRef.get as jest.Mock).mock.calls[0];
      const headers = callArgs[1].headers;

      expect(headers.Authorization).toBe(`Bearer ${accessToken}`);
    });

    it('should throw InternalServerErrorException when axios get fails', async () => {
      const accessToken = 'invalid-token';
      const axiosError = {
        message: 'Request failed with status code 403',
        response: {
          status: 403,
          data: { error: 'invalid_token' },
        },
      };

      (httpService.axiosRef.get as jest.Mock).mockRejectedValue(axiosError);

      await expect(gateway.getUserInfo(accessToken)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(gateway.getUserInfo(accessToken)).rejects.toThrow(
        'Request failed with status code 403',
      );
    });

    it('should handle expired token errors', async () => {
      const accessToken = 'expired-token';
      const expiredError = {
        message: 'Token has expired',
        response: {
          status: 401,
          data: { error: 'token_expired' },
        },
      };

      (httpService.axiosRef.get as jest.Mock).mockRejectedValue(expiredError);

      await expect(gateway.getUserInfo(accessToken)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should handle malformed response gracefully', async () => {
      const accessToken = 'valid-token';

      (httpService.axiosRef.get as jest.Mock).mockResolvedValue({
        data: null,
        status: 200,
      });

      const result = await gateway.getUserInfo(accessToken);
      expect(result).toBeNull();
    });
  });

  describe('Axios Upgrade Compatibility - Edge Cases', () => {
    it('should handle response with custom headers', async () => {
      const authCode = 'test-code';

      (httpService.axiosRef.post as jest.Mock).mockResolvedValue({
        data: mockTokenResponse,
        status: 200,
        statusText: 'OK',
        headers: {
          'content-type': 'application/json',
          'x-custom-header': 'custom-value',
        },
        config: {} as any,
      });

      const result = await gateway.getToken(authCode);
      expect(result).toBeDefined();
      expect(result.idToken).toBe(mockTokenResponse.id_token);
    });

    it('should handle response with additional properties', async () => {
      const accessToken = 'test-token';
      const extendedUserInfo = {
        ...mockUserInfo,
        extraField: 'extra-value',
        nestedObject: { key: 'value' },
      };

      (httpService.axiosRef.get as jest.Mock).mockResolvedValue({
        data: extendedUserInfo,
        status: 200,
      });

      const result = await gateway.getUserInfo(accessToken);
      expect(result).toEqual(extendedUserInfo);
    });

    it('should handle concurrent requests correctly', async () => {
      const authCode1 = 'code-1';
      const authCode2 = 'code-2';

      (httpService.axiosRef.post as jest.Mock)
        .mockResolvedValueOnce({ data: { ...mockTokenResponse, id_token: 'token1' } })
        .mockResolvedValueOnce({ data: { ...mockTokenResponse, id_token: 'token2' } });

      const [result1, result2] = await Promise.all([
        gateway.getToken(authCode1),
        gateway.getToken(authCode2),
      ]);

      expect(result1.idToken).toBe('token1');
      expect(result2.idToken).toBe('token2');
      expect(httpService.axiosRef.post).toHaveBeenCalledTimes(2);
    });

    it('should preserve request data integrity with special characters', async () => {
      const authCode = 'code-with-special-chars-!@#$%^&*()';

      (httpService.axiosRef.post as jest.Mock).mockResolvedValue({
        data: mockTokenResponse,
      });

      await gateway.getToken(authCode);

      const callArgs = (httpService.axiosRef.post as jest.Mock).mock.calls[0];
      const body = callArgs[1];

      expect(body.code).toBe(authCode);
    });

    it('should handle empty response body gracefully', async () => {
      const accessToken = 'test-token';

      (httpService.axiosRef.get as jest.Mock).mockResolvedValue({
        data: {},
        status: 200,
      });

      const result = await gateway.getUserInfo(accessToken);
      expect(result).toEqual({});
    });
  });

  describe('Configuration Service Integration', () => {
    it('should handle missing configuration gracefully', async () => {
      const brokenConfigService = {
        get: jest.fn().mockReturnValue(undefined),
      } as any;

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ADCognitoGateway,
          { provide: HttpService, useValue: httpService },
          { provide: ConfigService, useValue: brokenConfigService },
        ],
      }).compile();

      const brokenGateway = module.get<ADCognitoGateway>(ADCognitoGateway);

      (httpService.axiosRef.post as jest.Mock).mockResolvedValue({
        data: mockTokenResponse,
      });

      // Should still attempt the call with undefined values
      await brokenGateway.getToken('test-code');

      expect(brokenConfigService.get).toHaveBeenCalled();
    });
  });
});
