import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { GetBlankDynamicFormUseCase } from './getBlankDynamicForm.usecase';

describe('GetBlankDynamicFormUseCase', () => {
  let useCase: GetBlankDynamicFormUseCase;

  const dynamicFormRepositoryMock = {
    getActiveFormVersionByConfig: jest.fn(),
    getBlankForm: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetBlankDynamicFormUseCase,
        {
          provide: 'DynamicFormRepository',
          useValue: dynamicFormRepositoryMock,
        },
      ],
    }).compile();

    useCase = module.get(GetBlankDynamicFormUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('handler', () => {
    it('should use provided formVersionId (skip active-version lookup) and return blank form', async () => {
      const formConfigId = 10;
      const formVersionId = 99;

      const expectedForm = { id: 'blank-form' };
      dynamicFormRepositoryMock.getBlankForm.mockResolvedValueOnce(expectedForm);

      await expect(useCase.handler(formConfigId, formVersionId)).resolves.toBe(
        expectedForm,
      );

      expect(
        dynamicFormRepositoryMock.getActiveFormVersionByConfig,
      ).not.toHaveBeenCalled();

      expect(dynamicFormRepositoryMock.getBlankForm).toHaveBeenCalledTimes(1);
      expect(dynamicFormRepositoryMock.getBlankForm).toHaveBeenCalledWith(
        formConfigId,
        formVersionId,
      );
    });

    it('should lookup latest active version when formVersionId not provided and return blank form', async () => {
      const formConfigId = 10;

      dynamicFormRepositoryMock.getActiveFormVersionByConfig.mockResolvedValueOnce({
        formVersionId: 123,
      });

      const expectedForm = { id: 'blank-form-2' };
      dynamicFormRepositoryMock.getBlankForm.mockResolvedValueOnce(expectedForm);

      const result = await useCase.handler(formConfigId);

      expect(result).toBe(expectedForm);

      expect(
        dynamicFormRepositoryMock.getActiveFormVersionByConfig,
      ).toHaveBeenCalledTimes(1);
      expect(dynamicFormRepositoryMock.getActiveFormVersionByConfig).toHaveBeenCalledWith(
        formConfigId,
      );

      expect(dynamicFormRepositoryMock.getBlankForm).toHaveBeenCalledTimes(1);
      expect(dynamicFormRepositoryMock.getBlankForm).toHaveBeenCalledWith(
        formConfigId,
        123,
      );
    });

    it('should throw NotFoundException when no active version exists (formVersionId not provided)', async () => {
      const formConfigId = 10;
      dynamicFormRepositoryMock.getActiveFormVersionByConfig.mockResolvedValueOnce(null);

      await expect(useCase.handler(formConfigId)).rejects.toBeInstanceOf(
        NotFoundException,
      );

      await expect(useCase.handler(formConfigId)).rejects.toMatchObject({
        message: JSON.stringify({
          code: 'NOT_FOUND',
          message: 'ไม่พบ Version ที่ใช้งานได้',
        }),
      });

      expect(dynamicFormRepositoryMock.getActiveFormVersionByConfig).toHaveBeenCalledWith(
        formConfigId,
      );
      expect(dynamicFormRepositoryMock.getBlankForm).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when blank form not found', async () => {
      const formConfigId = 10;

      dynamicFormRepositoryMock.getActiveFormVersionByConfig.mockResolvedValueOnce({
        formVersionId: 123,
      });
      dynamicFormRepositoryMock.getBlankForm.mockResolvedValueOnce(null);

      try {
        await useCase.handler(formConfigId);
        fail('Expected NotFoundException to be thrown');
      } catch (e) {
        const err = e as NotFoundException;
        expect(err).toBeInstanceOf(NotFoundException);
        expect(err.message).toBe(
          JSON.stringify({
            code: 'NOT_FOUND',
            message: 'ไม่พบ Form ที่ค้นหา',
          }),
        );
      }

      expect(dynamicFormRepositoryMock.getBlankForm).toHaveBeenCalledWith(
        formConfigId,
        123,
      );
    });

    it('should treat formVersionId=0 as "not provided" and perform active-version lookup', async () => {
      const formConfigId = 10;

      dynamicFormRepositoryMock.getActiveFormVersionByConfig.mockResolvedValueOnce({
        formVersionId: 777,
      });

      const expectedForm = { id: 'blank-form-3' };
      dynamicFormRepositoryMock.getBlankForm.mockResolvedValueOnce(expectedForm);

      const result = await useCase.handler(formConfigId, 0);

      expect(result).toBe(expectedForm);
      expect(dynamicFormRepositoryMock.getActiveFormVersionByConfig).toHaveBeenCalledWith(
        formConfigId,
      );
      expect(dynamicFormRepositoryMock.getBlankForm).toHaveBeenCalledWith(
        formConfigId,
        777,
      );
    });

    it('should propagate unexpected repository errors', async () => {
      const formConfigId = 10;

      const err = new Error('db down');
      dynamicFormRepositoryMock.getActiveFormVersionByConfig.mockRejectedValueOnce(err);

      await expect(useCase.handler(formConfigId)).rejects.toThrow('db down');
    });
  });
});
