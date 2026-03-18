import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { GenerateJwtTokenUseCase } from './generateJwtToken.usecase';

describe('GenerateJwtTokenUseCase', () => {
  let useCase: GenerateJwtTokenUseCase;

  const jwtServiceMock: Pick<JwtService, 'sign'> = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerateJwtTokenUseCase,
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
      ],
    }).compile();

    useCase = module.get(GenerateJwtTokenUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should sign token with HS256 algorithm by default', () => {
    (jwtServiceMock.sign as jest.Mock).mockReturnValue('signed-token');

    const payload = {
      id: 1,
      employeeId: 'EMP001',
      fullName: 'John Doe',
      permissions: ['P1'],
      zoneCodes: { Z001: ['SZ01'] },
    } as any;

    const token = useCase.handler(payload);

    expect(jwtServiceMock.sign).toHaveBeenCalledTimes(1);
    expect(jwtServiceMock.sign).toHaveBeenCalledWith(
      payload,
      expect.objectContaining({ algorithm: 'HS256' }),
    );
    expect(token).toBe('signed-token');
  });

  it('should merge provided sign options (and allow overriding defaults)', () => {
    (jwtServiceMock.sign as jest.Mock).mockReturnValue('signed-with-options');

    const payload = { id: 99 } as any;

    const token = useCase.handler(payload, {
      expiresIn: '15m',
      algorithm: 'HS512',
      audience: 'my-audience',
      issuer: 'my-issuer',
    });

    expect(jwtServiceMock.sign).toHaveBeenCalledTimes(1);
    expect(jwtServiceMock.sign).toHaveBeenCalledWith(payload, {
      algorithm: 'HS512',
      expiresIn: '15m',
      audience: 'my-audience',
      issuer: 'my-issuer',
    });
    expect(token).toBe('signed-with-options');
  });

  it('should pass through options object when provided', () => {
    (jwtServiceMock.sign as jest.Mock).mockReturnValue('token');

    const payload = { id: 123 } as any;
    const options = { expiresIn: 60 } as any;

    useCase.handler(payload, options);

    expect(jwtServiceMock.sign).toHaveBeenCalledWith(
      payload,
      expect.objectContaining({
        algorithm: 'HS256',
        expiresIn: 60,
      }),
    );
  });
});
