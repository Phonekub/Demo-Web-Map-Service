import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetDynamicFormUseCase } from './getDynamicForm.usecase';

describe('GetDynamicFormUseCase', () => {
  let useCase: GetDynamicFormUseCase;

  const dynamicFormRepositoryMock = {
    getDynamicForm: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetDynamicFormUseCase,
        {
          provide: 'DynamicFormRepository',
          useValue: dynamicFormRepositoryMock,
        },
      ],
    }).compile();

    useCase = module.get(GetDynamicFormUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should return dynamic form when found', async () => {
    const formId = 123;

    const expectedForm = {
      formId,
      formVersionId: 1,
      referenceObj: 'POI',
      referenceKey: 999,
      fields: [{ key: 'a', value: 'b' }],
    };

    dynamicFormRepositoryMock.getDynamicForm.mockResolvedValueOnce(expectedForm);

    await expect(useCase.handler(formId)).resolves.toBe(expectedForm);

    expect(dynamicFormRepositoryMock.getDynamicForm).toHaveBeenCalledTimes(1);
    expect(dynamicFormRepositoryMock.getDynamicForm).toHaveBeenCalledWith(formId);
  });

  it('should throw NotFoundException when form not found', async () => {
    const formId = 999;

    dynamicFormRepositoryMock.getDynamicForm.mockResolvedValueOnce(null);

    await expect(useCase.handler(formId)).rejects.toBeInstanceOf(NotFoundException);

    try {
      await useCase.handler(formId);
    } catch (e) {
      const err = e as NotFoundException;
      // Message is a JSON string defined by the use case
      const payload = JSON.parse(err.message);

      expect(payload).toEqual({
        code: 'NOT_FOUND',
        message: 'ไม่พบ Form ที่ค้นหา',
      });
    }

    expect(dynamicFormRepositoryMock.getDynamicForm).toHaveBeenCalledTimes(2);
    expect(dynamicFormRepositoryMock.getDynamicForm).toHaveBeenNthCalledWith(1, formId);
    expect(dynamicFormRepositoryMock.getDynamicForm).toHaveBeenNthCalledWith(2, formId);
  });
});
