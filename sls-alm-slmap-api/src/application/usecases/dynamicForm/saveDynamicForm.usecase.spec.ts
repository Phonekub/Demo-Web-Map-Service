import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { SaveDynamicFormUseCase } from './saveDynamicForm.usecase';

describe('SaveDynamicFormUseCase', () => {
  let useCase: SaveDynamicFormUseCase;

  const dynamicFormRepositoryMock = {
    // create flow
    getDynamicFormByReference: jest.fn(),
    generateFormId: jest.fn(),
    createDynamicFormWithValues: jest.fn(),

    // update flow
    findByFormId: jest.fn(),
    updateDynamicFormWithValues: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SaveDynamicFormUseCase,
        {
          provide: 'DynamicFormRepository',
          useValue: dynamicFormRepositoryMock,
        },
      ],
    }).compile();

    useCase = module.get(SaveDynamicFormUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('handler (create)', () => {
    it('should create dynamic form when isUpdate=false', async () => {
      dynamicFormRepositoryMock.getDynamicFormByReference.mockResolvedValueOnce(null);
      dynamicFormRepositoryMock.generateFormId.mockResolvedValueOnce(12345);
      dynamicFormRepositoryMock.createDynamicFormWithValues.mockResolvedValueOnce({
        formId: 12345,
        ok: true,
      });

      const data = {
        formVersionId: 10,
        referenceObj: 'POTENTIAL',
        referenceKey: 999,
        createdUser: 'u1',
        lastEditedUser: 'u2',
        fields: [{ fieldId: 1, value: 'A' }],
      };

      const result = await useCase.handler(data, undefined, false);

      expect(dynamicFormRepositoryMock.getDynamicFormByReference).toHaveBeenCalledTimes(
        1,
      );
      expect(dynamicFormRepositoryMock.getDynamicFormByReference).toHaveBeenCalledWith(
        'POTENTIAL',
        999,
      );

      expect(dynamicFormRepositoryMock.generateFormId).toHaveBeenCalledTimes(1);

      expect(dynamicFormRepositoryMock.createDynamicFormWithValues).toHaveBeenCalledTimes(
        1,
      );
      expect(dynamicFormRepositoryMock.createDynamicFormWithValues).toHaveBeenCalledWith({
        formId: 12345,
        formVersionId: 10,
        referenceObj: 'POTENTIAL',
        referenceKey: 999,
        createdUser: 'u1',
        lastEditedUser: 'u2',
        fields: [{ fieldId: 1, value: 'A' }],
      });

      expect(result).toEqual({ formId: 12345, ok: true });
    });

    it('should default reference fields to null and users to system when not provided', async () => {
      dynamicFormRepositoryMock.generateFormId.mockResolvedValueOnce(7);
      dynamicFormRepositoryMock.createDynamicFormWithValues.mockResolvedValueOnce({
        formId: 7,
      });

      const data = {
        formVersionId: 1,
        fields: [{ any: 'x' }],
      };

      await useCase.handler(data, undefined, false);

      // when reference not fully present, it should NOT attempt duplicate check
      expect(dynamicFormRepositoryMock.getDynamicFormByReference).not.toHaveBeenCalled();

      expect(dynamicFormRepositoryMock.createDynamicFormWithValues).toHaveBeenCalledWith({
        formId: 7,
        formVersionId: 1,
        referenceObj: null,
        referenceKey: null,
        createdUser: 'system',
        lastEditedUser: 'system',
        fields: [{ any: 'x' }],
      });
    });

    it('should default lastEditedUser to createdUser when lastEditedUser not provided', async () => {
      dynamicFormRepositoryMock.generateFormId.mockResolvedValueOnce(9);
      dynamicFormRepositoryMock.createDynamicFormWithValues.mockResolvedValueOnce({
        formId: 9,
      });

      const data = {
        formVersionId: 1,
        createdUser: 'creator',
        fields: [{ k: 'v' }],
      };

      await useCase.handler(data);

      expect(dynamicFormRepositoryMock.createDynamicFormWithValues).toHaveBeenCalledWith({
        formId: 9,
        formVersionId: 1,
        referenceObj: null,
        referenceKey: null,
        createdUser: 'creator',
        lastEditedUser: 'creator',
        fields: [{ k: 'v' }],
      });
    });

    it('should throw when formVersionId is missing', async () => {
      const data = { fields: [{ x: 1 }] };

      await expect(useCase.handler(data)).rejects.toThrow(BadRequestException);
      await expect(useCase.handler(data)).rejects.toThrow('Form Version ID is required');

      expect(dynamicFormRepositoryMock.generateFormId).not.toHaveBeenCalled();
      expect(
        dynamicFormRepositoryMock.createDynamicFormWithValues,
      ).not.toHaveBeenCalled();
    });

    it('should throw when fields is missing', async () => {
      const data = { formVersionId: 1 };

      await expect(useCase.handler(data)).rejects.toThrow(BadRequestException);
      await expect(useCase.handler(data)).rejects.toThrow('Fields data is required');
    });

    it('should throw when fields is not an array', async () => {
      const data = { formVersionId: 1, fields: 'nope' };

      await expect(useCase.handler(data as any)).rejects.toThrow(BadRequestException);
      await expect(useCase.handler(data as any)).rejects.toThrow(
        'Fields data is required',
      );
    });

    it('should throw when fields is empty', async () => {
      const data = { formVersionId: 1, fields: [] };

      await expect(useCase.handler(data)).rejects.toThrow(BadRequestException);
      await expect(useCase.handler(data)).rejects.toThrow('Fields data is required');
    });

    it('should throw DUPLICATE_REFERENCE when referenceObj and referenceKey already exists', async () => {
      dynamicFormRepositoryMock.getDynamicFormByReference.mockResolvedValueOnce({
        formId: 1,
      });

      const data = {
        formVersionId: 1,
        referenceObj: 'OBJ',
        referenceKey: 111,
        fields: [{ x: 1 }],
      };

      try {
        await useCase.handler(data);
        throw new Error('Expected handler to throw');
      } catch (e: any) {
        // SaveDynamicFormUseCase throws BadRequestException with JSON string as message
        expect(e).toBeInstanceOf(BadRequestException);
        const msg = e.message as string;
        expect(msg).toContain('DUPLICATE_REFERENCE');
      }

      expect(dynamicFormRepositoryMock.generateFormId).not.toHaveBeenCalled();
      expect(
        dynamicFormRepositoryMock.createDynamicFormWithValues,
      ).not.toHaveBeenCalled();
    });

    it('should not perform duplicate check when referenceObj is missing', async () => {
      dynamicFormRepositoryMock.generateFormId.mockResolvedValueOnce(100);
      dynamicFormRepositoryMock.createDynamicFormWithValues.mockResolvedValueOnce({
        formId: 100,
      });

      const data = {
        formVersionId: 1,
        referenceKey: 1,
        fields: [{ x: 1 }],
      };

      await useCase.handler(data);

      expect(dynamicFormRepositoryMock.getDynamicFormByReference).not.toHaveBeenCalled();
      expect(dynamicFormRepositoryMock.generateFormId).toHaveBeenCalledTimes(1);
      expect(dynamicFormRepositoryMock.createDynamicFormWithValues).toHaveBeenCalledTimes(
        1,
      );
    });

    it('should not perform duplicate check when referenceKey is missing', async () => {
      dynamicFormRepositoryMock.generateFormId.mockResolvedValueOnce(101);
      dynamicFormRepositoryMock.createDynamicFormWithValues.mockResolvedValueOnce({
        formId: 101,
      });

      const data = {
        formVersionId: 1,
        referenceObj: 'OBJ',
        fields: [{ x: 1 }],
      };

      await useCase.handler(data);

      expect(dynamicFormRepositoryMock.getDynamicFormByReference).not.toHaveBeenCalled();
      expect(dynamicFormRepositoryMock.generateFormId).toHaveBeenCalledTimes(1);
      expect(dynamicFormRepositoryMock.createDynamicFormWithValues).toHaveBeenCalledTimes(
        1,
      );
    });

    it('should throw ID_FULL when generateFormId returns falsy', async () => {
      dynamicFormRepositoryMock.generateFormId.mockResolvedValueOnce(null);

      const data = { formVersionId: 1, fields: [{ x: 1 }] };

      await expect(useCase.handler(data)).rejects.toThrow(BadRequestException);

      try {
        await useCase.handler(data);
      } catch (e: any) {
        expect(e).toBeInstanceOf(BadRequestException);
        expect(e.message).toContain('ID_FULL');
      }

      expect(
        dynamicFormRepositoryMock.createDynamicFormWithValues,
      ).not.toHaveBeenCalled();
    });

    it('should throw SAVE_FAIL when repository createDynamicFormWithValues throws', async () => {
      dynamicFormRepositoryMock.generateFormId.mockResolvedValueOnce(55);
      dynamicFormRepositoryMock.createDynamicFormWithValues.mockRejectedValueOnce(
        new Error('insert failed'),
      );

      const data = { formVersionId: 1, fields: [{ x: 1 }] };

      try {
        await useCase.handler(data);
        throw new Error('Expected handler to throw');
      } catch (e: any) {
        expect(e).toBeInstanceOf(BadRequestException);
        expect(e.message).toContain('SAVE_FAIL');
      }
    });
  });

  describe('handler (update)', () => {
    it('should throw when updating but formId not provided', async () => {
      const data = { fields: [{ x: 1 }] };

      await expect(useCase.handler(data, undefined, true)).rejects.toThrow(
        BadRequestException,
      );
      await expect(useCase.handler(data, undefined, true)).rejects.toThrow(
        'Form ID is required for update',
      );

      expect(dynamicFormRepositoryMock.findByFormId).not.toHaveBeenCalled();
      expect(
        dynamicFormRepositoryMock.updateDynamicFormWithValues,
      ).not.toHaveBeenCalled();
    });

    it('should throw NOT_FOUND when form does not exist', async () => {
      dynamicFormRepositoryMock.findByFormId.mockResolvedValueOnce(null);

      const data = {
        formVersionId: 2,
        fields: [{ x: 1 }],
      };

      await expect(useCase.handler(data, 999, true)).rejects.toThrow(BadRequestException);

      try {
        await useCase.handler(data, 999, true);
      } catch (e: any) {
        expect(e).toBeInstanceOf(BadRequestException);
        expect(e.message).toContain('NOT_FOUND');
      }

      expect(
        dynamicFormRepositoryMock.updateDynamicFormWithValues,
      ).not.toHaveBeenCalled();
    });

    it('should throw when fields missing in update', async () => {
      dynamicFormRepositoryMock.findByFormId.mockResolvedValueOnce({
        formId: 1,
        referenceObj: 'OBJ',
        referenceKey: 1,
      });

      const data = { formVersionId: 2 };

      try {
        await useCase.handler(data as any, 1, true);
        throw new Error('Expected handler to throw');
      } catch (e: any) {
        expect(e).toBeInstanceOf(BadRequestException);
        expect(e.message).toContain('Fields data is required');
      }

      expect(
        dynamicFormRepositoryMock.updateDynamicFormWithValues,
      ).not.toHaveBeenCalled();
    });

    it('should update dynamic form and keep existing reference when not provided', async () => {
      dynamicFormRepositoryMock.findByFormId.mockResolvedValueOnce({
        formId: 10,
        referenceObj: 'EXISTING_OBJ',
        referenceKey: 999,
      });

      dynamicFormRepositoryMock.updateDynamicFormWithValues.mockResolvedValueOnce({
        formId: 10,
        updated: true,
      });

      const data = {
        formVersionId: 3,
        lastEditedUser: 'editor',
        fields: [{ x: 'y' }],
      };

      const result = await useCase.handler(data, 10, true);

      expect(dynamicFormRepositoryMock.findByFormId).toHaveBeenCalledWith(10);
      expect(dynamicFormRepositoryMock.updateDynamicFormWithValues).toHaveBeenCalledWith(
        10,
        {
          formVersionId: 3,
          referenceObj: 'EXISTING_OBJ',
          referenceKey: 999,
          lastEditedUser: 'editor',
          fields: [{ x: 'y' }],
        },
      );
      expect(result).toEqual({ formId: 10, updated: true });
    });

    it('should update using provided referenceObj/referenceKey and default lastEditedUser to system', async () => {
      dynamicFormRepositoryMock.findByFormId.mockResolvedValueOnce({
        formId: 20,
        referenceObj: 'EXISTING_OBJ',
        referenceKey: 1,
      });

      dynamicFormRepositoryMock.updateDynamicFormWithValues.mockResolvedValueOnce({
        formId: 20,
      });

      const data = {
        formVersionId: 4,
        referenceObj: 'NEW_OBJ',
        referenceKey: 555,
        fields: [{ a: 1 }],
      };

      await useCase.handler(data, 20, true);

      expect(dynamicFormRepositoryMock.updateDynamicFormWithValues).toHaveBeenCalledWith(
        20,
        {
          formVersionId: 4,
          referenceObj: 'NEW_OBJ',
          referenceKey: 555,
          lastEditedUser: 'system',
          fields: [{ a: 1 }],
        },
      );
    });

    it('should throw SAVE_FAIL when repository updateDynamicFormWithValues throws', async () => {
      dynamicFormRepositoryMock.findByFormId.mockResolvedValueOnce({
        formId: 30,
        referenceObj: 'OBJ',
        referenceKey: 1,
      });

      dynamicFormRepositoryMock.updateDynamicFormWithValues.mockRejectedValueOnce(
        new Error('update failed'),
      );

      const data = {
        formVersionId: 1,
        fields: [{ x: 1 }],
      };

      try {
        await useCase.handler(data, 30, true);
        throw new Error('Expected handler to throw');
      } catch (e: any) {
        expect(e).toBeInstanceOf(BadRequestException);
        expect(e.message).toContain('SAVE_FAIL');
      }
    });
  });
});
