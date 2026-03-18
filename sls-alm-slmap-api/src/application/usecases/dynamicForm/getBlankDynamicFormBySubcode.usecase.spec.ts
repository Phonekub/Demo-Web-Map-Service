import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetBlankDynamicFormBySubcodeUseCase } from './getBlankDynamicFormBySubcode.usecase';

describe('GetBlankDynamicFormBySubcodeUseCase', () => {
  let useCase: GetBlankDynamicFormBySubcodeUseCase;

  const dynamicFormRepositoryMock = {
    getFormConfigIdBySubcode: jest.fn(),
    getActiveFormVersionByConfig: jest.fn(),
    getBlankForm: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetBlankDynamicFormBySubcodeUseCase,
        {
          provide: 'DynamicFormRepository',
          useValue: dynamicFormRepositoryMock,
        },
      ],
    }).compile();

    useCase = module.get(GetBlankDynamicFormBySubcodeUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should throw NotFoundException when formConfigId not found for subCode', async () => {
    dynamicFormRepositoryMock.getFormConfigIdBySubcode.mockResolvedValueOnce(null);

    try {
      await useCase.handler('SUB001');
      fail('Expected NotFoundException');
    } catch (err: any) {
      expect(err).toBeInstanceOf(NotFoundException);
      // Usecase throws JSON.stringify({code,message}) as message
      expect(err.message).toContain('NOT_FOUND');
      expect(err.message).toContain('Form Config');
      expect(err.message).toContain('subcode');
      expect(err.message).toContain('SUB001');
    }

    expect(dynamicFormRepositoryMock.getFormConfigIdBySubcode).toHaveBeenCalledTimes(1);
    expect(dynamicFormRepositoryMock.getFormConfigIdBySubcode).toHaveBeenCalledWith(
      'SUB001',
    );
    expect(dynamicFormRepositoryMock.getActiveFormVersionByConfig).not.toHaveBeenCalled();
    expect(dynamicFormRepositoryMock.getBlankForm).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException when active version not found and formVersionId not provided', async () => {
    dynamicFormRepositoryMock.getFormConfigIdBySubcode.mockResolvedValueOnce(10);
    dynamicFormRepositoryMock.getActiveFormVersionByConfig.mockResolvedValueOnce(null);

    try {
      await useCase.handler('SUB002');
      fail('Expected NotFoundException');
    } catch (err: any) {
      expect(err).toBeInstanceOf(NotFoundException);
      expect(err.message).toContain('NOT_FOUND');
      expect(err.message).toContain('Version');
    }

    expect(dynamicFormRepositoryMock.getFormConfigIdBySubcode).toHaveBeenCalledTimes(1);
    expect(dynamicFormRepositoryMock.getFormConfigIdBySubcode).toHaveBeenCalledWith(
      'SUB002',
    );
    expect(dynamicFormRepositoryMock.getActiveFormVersionByConfig).toHaveBeenCalledTimes(
      1,
    );
    expect(dynamicFormRepositoryMock.getActiveFormVersionByConfig).toHaveBeenCalledWith(
      10,
    );
    expect(dynamicFormRepositoryMock.getBlankForm).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException when blank form not found', async () => {
    dynamicFormRepositoryMock.getFormConfigIdBySubcode.mockResolvedValueOnce(20);
    dynamicFormRepositoryMock.getActiveFormVersionByConfig.mockResolvedValueOnce({
      formVersionId: 200,
    });
    dynamicFormRepositoryMock.getBlankForm.mockResolvedValueOnce(null);

    try {
      await useCase.handler('SUB003');
      fail('Expected NotFoundException');
    } catch (err: any) {
      expect(err).toBeInstanceOf(NotFoundException);
      expect(err.message).toContain('NOT_FOUND');
      expect(err.message).toContain('Form');
    }

    expect(dynamicFormRepositoryMock.getFormConfigIdBySubcode).toHaveBeenCalledTimes(1);
    expect(dynamicFormRepositoryMock.getFormConfigIdBySubcode).toHaveBeenCalledWith(
      'SUB003',
    );
    expect(dynamicFormRepositoryMock.getActiveFormVersionByConfig).toHaveBeenCalledTimes(
      1,
    );
    expect(dynamicFormRepositoryMock.getActiveFormVersionByConfig).toHaveBeenCalledWith(
      20,
    );
    expect(dynamicFormRepositoryMock.getBlankForm).toHaveBeenCalledTimes(1);
    expect(dynamicFormRepositoryMock.getBlankForm).toHaveBeenCalledWith(20, 200);
  });

  it('should use provided formVersionId (skip fetching active version) and return form', async () => {
    const providedVersionId = 999;

    dynamicFormRepositoryMock.getFormConfigIdBySubcode.mockResolvedValueOnce(30);
    dynamicFormRepositoryMock.getBlankForm.mockResolvedValueOnce({
      formConfigId: 30,
      formVersionId: providedVersionId,
      fields: [],
    });

    const result = await useCase.handler('SUB004', providedVersionId);

    expect(dynamicFormRepositoryMock.getFormConfigIdBySubcode).toHaveBeenCalledTimes(1);
    expect(dynamicFormRepositoryMock.getFormConfigIdBySubcode).toHaveBeenCalledWith(
      'SUB004',
    );
    expect(dynamicFormRepositoryMock.getActiveFormVersionByConfig).not.toHaveBeenCalled();
    expect(dynamicFormRepositoryMock.getBlankForm).toHaveBeenCalledTimes(1);
    expect(dynamicFormRepositoryMock.getBlankForm).toHaveBeenCalledWith(
      30,
      providedVersionId,
    );
    expect(result).toEqual({
      formConfigId: 30,
      formVersionId: providedVersionId,
      fields: [],
    });
  });

  it('should resolve active version when formVersionId not provided and return form', async () => {
    dynamicFormRepositoryMock.getFormConfigIdBySubcode.mockResolvedValueOnce(40);
    dynamicFormRepositoryMock.getActiveFormVersionByConfig.mockResolvedValueOnce({
      formVersionId: 400,
    });
    dynamicFormRepositoryMock.getBlankForm.mockResolvedValueOnce({
      formConfigId: 40,
      formVersionId: 400,
      fields: [{ key: 'a', value: 1 }],
    });

    const result = await useCase.handler('SUB005');

    expect(dynamicFormRepositoryMock.getFormConfigIdBySubcode).toHaveBeenCalledTimes(1);
    expect(dynamicFormRepositoryMock.getFormConfigIdBySubcode).toHaveBeenCalledWith(
      'SUB005',
    );
    expect(dynamicFormRepositoryMock.getActiveFormVersionByConfig).toHaveBeenCalledTimes(
      1,
    );
    expect(dynamicFormRepositoryMock.getActiveFormVersionByConfig).toHaveBeenCalledWith(
      40,
    );
    expect(dynamicFormRepositoryMock.getBlankForm).toHaveBeenCalledTimes(1);
    expect(dynamicFormRepositoryMock.getBlankForm).toHaveBeenCalledWith(40, 400);

    expect(result).toEqual({
      formConfigId: 40,
      formVersionId: 400,
      fields: [{ key: 'a', value: 1 }],
    });
  });
});
