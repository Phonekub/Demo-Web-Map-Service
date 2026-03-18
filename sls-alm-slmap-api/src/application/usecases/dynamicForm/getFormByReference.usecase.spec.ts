import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetFormByReferenceUseCase } from './getFormByReference.usecase';

describe('GetFormByReferenceUseCase', () => {
  let useCase: GetFormByReferenceUseCase;

  const dynamicFormRepositoryMock = {
    getDynamicFormByReference: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetFormByReferenceUseCase,
        {
          provide: 'DynamicFormRepository',
          useValue: dynamicFormRepositoryMock,
        },
      ],
    }).compile();

    useCase = module.get(GetFormByReferenceUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should return form when repository returns data', async () => {
    const referenceObj = 'POTENTIAL';
    const referenceKey = 123;

    const form = {
      formId: 999,
      referenceObj,
      referenceKey,
      fields: [{ key: 'a', value: 'b' }],
    };

    dynamicFormRepositoryMock.getDynamicFormByReference.mockResolvedValueOnce(form);

    await expect(useCase.handler(referenceObj, referenceKey)).resolves.toBe(form);

    expect(dynamicFormRepositoryMock.getDynamicFormByReference).toHaveBeenCalledTimes(1);
    expect(dynamicFormRepositoryMock.getDynamicFormByReference).toHaveBeenCalledWith(
      referenceObj,
      referenceKey,
    );
  });

  it('should throw NotFoundException when form not found', async () => {
    const referenceObj = 'POTENTIAL';
    const referenceKey = 404;

    dynamicFormRepositoryMock.getDynamicFormByReference.mockResolvedValueOnce(null);

    await expect(useCase.handler(referenceObj, referenceKey)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    try {
      await useCase.handler(referenceObj, referenceKey);
    } catch (err: any) {
      // The use case throws NotFoundException(JSON.stringify({code,message}))
      expect(err).toBeInstanceOf(NotFoundException);
      expect(err.message).toContain('NOT_FOUND');
      expect(err.message).toContain(referenceObj);
      expect(err.message).toContain(referenceKey.toString());
    }

    expect(dynamicFormRepositoryMock.getDynamicFormByReference).toHaveBeenCalledWith(
      referenceObj,
      referenceKey,
    );
  });
});
