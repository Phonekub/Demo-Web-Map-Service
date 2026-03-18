import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';

import { OAuth2CallbackUseCase } from './oauth2Callback.usecase';
import { GenerateJwtTokenUseCase } from '../generateJwtToken.usecase';
import { ADCognitoGatewayPort } from '../../ports/adCognitoGateway.repository';
import { UserRepositoryPort } from '../../ports/user.repository';

describe('OAuth2CallbackUseCase', () => {
  let useCase: OAuth2CallbackUseCase;

  const adCognitoGatewayMock: Pick<ADCognitoGatewayPort, 'getToken'> = {
    getToken: jest.fn(),
  };

  const userRepositoryMock: Pick<
    UserRepositoryPort,
    'findByNumber' | 'getUserRole' | 'getUserZone' | 'getUserPermissions'
  > = {
    findByNumber: jest.fn(),
    getUserRole: jest.fn(),
    getUserZone: jest.fn(),
    getUserPermissions: jest.fn(),
  };

  const jwtServiceMock: Pick<JwtService, 'decode'> = {
    decode: jest.fn(),
  };

  const generateJwtTokenUseCaseMock: Pick<GenerateJwtTokenUseCase, 'handler'> = {
    handler: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OAuth2CallbackUseCase,
        { provide: 'ADCognitoGateway', useValue: adCognitoGatewayMock },
        { provide: 'UserRepository', useValue: userRepositoryMock },
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: GenerateJwtTokenUseCase, useValue: generateJwtTokenUseCaseMock },
      ],
    }).compile();

    useCase = module.get(OAuth2CallbackUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('handler', () => {
    it.each([undefined, null, ''])(
      'should throw UnauthorizedException when authorizationCode is invalid: %p',
      async (authorizationCode) => {
        await expect(
          useCase.handler(authorizationCode as unknown as string),
        ).rejects.toThrow(UnauthorizedException);

        expect(adCognitoGatewayMock.getToken).not.toHaveBeenCalled();
        expect(userRepositoryMock.findByNumber).not.toHaveBeenCalled();
        expect(generateJwtTokenUseCaseMock.handler).not.toHaveBeenCalled();
      },
    );

    it('should throw UnauthorizedException when idToken is null', async () => {
      (adCognitoGatewayMock.getToken as jest.Mock).mockResolvedValue({
        idToken: null,
        accessToken: 'access',
        refreshToken: 'refresh',
      });

      await expect(useCase.handler('auth-code')).rejects.toThrow(UnauthorizedException);

      expect(adCognitoGatewayMock.getToken).toHaveBeenCalledTimes(1);
      expect(adCognitoGatewayMock.getToken).toHaveBeenCalledWith('auth-code');

      expect(jwtServiceMock.decode).not.toHaveBeenCalled();
      expect(userRepositoryMock.findByNumber).not.toHaveBeenCalled();
      expect(generateJwtTokenUseCaseMock.handler).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when decoded token missing custom:EmployeeID', async () => {
      (adCognitoGatewayMock.getToken as jest.Mock).mockResolvedValue({
        idToken: 'id-token',
        accessToken: 'access',
      });

      (jwtServiceMock.decode as jest.Mock).mockReturnValue({
        // no custom:EmployeeID
        sub: 'abc',
      });

      await expect(useCase.handler('auth-code')).rejects.toThrow(UnauthorizedException);
      await expect(useCase.handler('auth-code')).rejects.toThrow(
        'Decode token is invalid',
      );

      expect(adCognitoGatewayMock.getToken).toHaveBeenCalledTimes(2);
      expect(jwtServiceMock.decode).toHaveBeenCalledTimes(2);
      expect(userRepositoryMock.findByNumber).not.toHaveBeenCalled();
      expect(generateJwtTokenUseCaseMock.handler).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      (adCognitoGatewayMock.getToken as jest.Mock).mockResolvedValue({
        idToken: 'id-token',
        accessToken: 'access',
      });

      (jwtServiceMock.decode as jest.Mock).mockReturnValue({
        'custom:EmployeeID': '12345',
      });

      (userRepositoryMock.findByNumber as jest.Mock).mockResolvedValue(undefined);

      await expect(useCase.handler('auth-code')).rejects.toThrow(UnauthorizedException);

      expect(adCognitoGatewayMock.getToken).toHaveBeenCalledWith('auth-code');
      expect(jwtServiceMock.decode).toHaveBeenCalledWith('id-token');
      expect(userRepositoryMock.findByNumber).toHaveBeenCalledWith('12345');

      expect(userRepositoryMock.getUserRole).not.toHaveBeenCalled();
      expect(userRepositoryMock.getUserZone).not.toHaveBeenCalled();
      expect(userRepositoryMock.getUserPermissions).not.toHaveBeenCalled();
      expect(generateJwtTokenUseCaseMock.handler).not.toHaveBeenCalled();
    });

    it('should generate token successfully with roles, zones and permissions', async () => {
      (adCognitoGatewayMock.getToken as jest.Mock).mockResolvedValue({
        idToken: 'id-token',
        accessToken: 'access',
      });

      (jwtServiceMock.decode as jest.Mock).mockReturnValue({
        'custom:EmployeeID': '999',
      });

      (userRepositoryMock.findByNumber as jest.Mock).mockResolvedValue({
        userId: 10,
        employeeId: '999',
        firstName: 'John',
        lastName: 'Doe',
      });

      (userRepositoryMock.getUserRole as jest.Mock).mockResolvedValue({
        deptId: 'D001',
        levelId: 'L001',
        roleId: 7,
      });

      (userRepositoryMock.getUserZone as jest.Mock).mockResolvedValue([
        { zoneCode: 'Z001', subZonesCode: ['SZ01', 'SZ02'] },
        { zoneCode: 'Z002', subZonesCode: [] },
      ]);

      (userRepositoryMock.getUserPermissions as jest.Mock).mockResolvedValue([
        { code: 'P01' },
        { code: 'P02' },
      ]);

      (generateJwtTokenUseCaseMock.handler as jest.Mock).mockReturnValue('jwt-token');

      const result = await useCase.handler('auth-code');

      expect(result).toEqual({ token: 'jwt-token' });

      expect(adCognitoGatewayMock.getToken).toHaveBeenCalledWith('auth-code');
      expect(jwtServiceMock.decode).toHaveBeenCalledWith('id-token');

      expect(userRepositoryMock.findByNumber).toHaveBeenCalledWith('999');
      expect(userRepositoryMock.getUserRole).toHaveBeenCalledWith(10);
      expect(userRepositoryMock.getUserZone).toHaveBeenCalledWith(10);
      expect(userRepositoryMock.getUserPermissions).toHaveBeenCalledWith(10);

      expect(generateJwtTokenUseCaseMock.handler).toHaveBeenCalledTimes(1);
      expect(generateJwtTokenUseCaseMock.handler).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 10,
          employeeId: '999',
          fullName: 'John Doe',
          departmentId: 'D001',
          levelId: 'L001',
          roleId: 7,
          zoneCodes: { Z001: ['SZ01', 'SZ02'], Z002: [] },
          permissions: ['P01', 'P02'],
        }),
      );
    });

    it('should default departmentId/levelId to empty string when userRoles is null/undefined', async () => {
      (adCognitoGatewayMock.getToken as jest.Mock).mockResolvedValue({
        idToken: 'id-token',
        accessToken: 'access',
      });

      (jwtServiceMock.decode as jest.Mock).mockReturnValue({
        'custom:EmployeeID': '1000',
      });

      (userRepositoryMock.findByNumber as jest.Mock).mockResolvedValue({
        userId: 11,
        employeeId: '1000',
        firstName: 'Jane',
        lastName: 'Smith',
      });

      (userRepositoryMock.getUserRole as jest.Mock).mockResolvedValue({
        deptId: undefined,
        levelId: undefined,
        roleId: undefined,
        permissionType: undefined,
      });
      (userRepositoryMock.getUserZone as jest.Mock).mockResolvedValue([
        { zoneCode: 'Z009', subZonesCode: ['SZA'] },
      ]);
      (userRepositoryMock.getUserPermissions as jest.Mock).mockResolvedValue([]);

      (generateJwtTokenUseCaseMock.handler as jest.Mock).mockReturnValue('jwt-token');

      const result = await useCase.handler('auth-code');
      expect(result).toEqual({ token: 'jwt-token' });

      expect(generateJwtTokenUseCaseMock.handler).toHaveBeenCalledWith(
        expect.objectContaining({
          departmentId: '',
          levelId: '',
          roleId: undefined,
          zoneCodes: { Z009: ['SZA'] },
          permissions: [],
          fullName: 'Jane Smith',
        }),
      );
    });
  });
});
