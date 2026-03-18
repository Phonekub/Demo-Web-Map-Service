import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GenerateAdURLUseCase } from './generateAdURL.usecase';

describe('GenerateAdURLUseCase', () => {
  let useCase: GenerateAdURLUseCase;
  let configService: Pick<ConfigService, 'get'>;

  const makeConfigService = (overrides?: Partial<Record<string, string>>) => {
    const config: Record<string, string> = {
      AD_AUTHEN_URL: 'https://example.com/oauth2/authorize',
      AD_CLIENT_ID: 'client-id-123',
      AD_CALLBACK_URL: 'https://my-app.example.com/auth/callback',
      ...overrides,
    };

    return {
      get: jest.fn((key: string) => config[key]),
    } as Pick<ConfigService, 'get'>;
  };

  beforeEach(async () => {
    configService = makeConfigService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerateAdURLUseCase,
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    useCase = module.get(GenerateAdURLUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should generate AD authorize url with required query params', async () => {
    const url = await useCase.handler();

    expect(configService.get).toHaveBeenCalledWith('AD_AUTHEN_URL');
    expect(configService.get).toHaveBeenCalledWith('AD_CLIENT_ID');
    expect(configService.get).toHaveBeenCalledWith('AD_CALLBACK_URL');

    expect(url).toContain('https://example.com/oauth2/authorize?');

    // Validate expected params exist (order not guaranteed)
    expect(url).toContain('response_type=code');
    expect(url).toContain('identity_provider=cpall.');
    expect(url).toContain('client_id=client-id-123');
    expect(url).toContain(
      `redirect_uri=${encodeURIComponent('https://my-app.example.com/auth/callback')}`,
    );
  });

  it('should properly encode redirect_uri query value', async () => {
    const specialRedirect = 'https://my-app.example.com/auth/callback?x=1&y=hello world';
    configService = makeConfigService({
      AD_CALLBACK_URL: specialRedirect,
    });

    // Rebuild module with the new mock
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerateAdURLUseCase,
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    useCase = module.get(GenerateAdURLUseCase);

    const url = await useCase.handler();

    expect(url).toContain(`redirect_uri=${encodeURIComponent(specialRedirect)}`);
    expect(url).not.toContain(`redirect_uri=${specialRedirect}`);
  });

  it('should still return a string url when base url config is missing', async () => {
    configService = makeConfigService({
      AD_AUTHEN_URL: undefined as unknown as string,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerateAdURLUseCase,
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    useCase = module.get(GenerateAdURLUseCase);

    const url = await useCase.handler();

    // Current implementation simply interpolates. This test locks that behavior.
    expect(typeof url).toBe('string');
    expect(url).toContain('?');
    expect(url).toContain('response_type=code');
  });
});
