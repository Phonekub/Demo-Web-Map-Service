import { Test, TestingModule } from '@nestjs/testing';
import { GetCommonCodeUseCase } from './getCommonCode.usecase';
import { Language } from '../../../common/enums/language.enum';

describe('GetCommonCodeUseCase', () => {
  let useCase: GetCommonCodeUseCase;

  const masterRepositoryMock = {
    getCommonCode: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetCommonCodeUseCase,
        {
          provide: 'MasterRepository',
          useValue: masterRepositoryMock,
        },
      ],
    }).compile();

    useCase = module.get(GetCommonCodeUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should delegate to masterRepository.getCommonCode with provided args and return result', async () => {
    const codeType = 'SOME_CODE_TYPE';
    const language = Language.TH;

    const expected = [
      { value: 'A', label: 'Alpha' },
      { value: 'B', label: 'Beta' },
    ] as any;

    masterRepositoryMock.getCommonCode.mockResolvedValue(expected);

    await expect(useCase.handler(codeType, language)).resolves.toBe(expected);

    expect(masterRepositoryMock.getCommonCode).toHaveBeenCalledTimes(1);
    expect(masterRepositoryMock.getCommonCode).toHaveBeenCalledWith(codeType, language);
  });

  it('should propagate errors thrown by repository', async () => {
    const err = new Error('db down');
    masterRepositoryMock.getCommonCode.mockRejectedValue(err);

    await expect(useCase.handler('X', Language.EN)).rejects.toThrow('db down');
  });
});
