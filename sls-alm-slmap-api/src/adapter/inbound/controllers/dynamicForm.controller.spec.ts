import { Test, TestingModule } from '@nestjs/testing';
import { DynamicFormController } from './dynamicForm.controller';
import { GetDynamicFormUseCase } from '../../../application/usecases/dynamicForm/getDynamicForm.usecase';
import { GetFormByReferenceUseCase } from '../../../application/usecases/dynamicForm/getFormByReference.usecase';
import { GetBlankDynamicFormUseCase } from '../../../application/usecases/dynamicForm/getBlankDynamicForm.usecase';
import { SaveDynamicFormUseCase } from '../../../application/usecases/dynamicForm/saveDynamicForm.usecase';

describe('DynamicFormController', () => {
  let controller: DynamicFormController;

  let getDynamicFormUseCase: { handler: jest.Mock };
  let getFormByReferenceUseCase: { handler: jest.Mock };
  let getBlankDynamicFormUseCase: { handler: jest.Mock };
  let saveDynamicFormUseCase: { handler: jest.Mock };

  beforeEach(async () => {
    getDynamicFormUseCase = { handler: jest.fn() };
    getFormByReferenceUseCase = { handler: jest.fn() };
    getBlankDynamicFormUseCase = { handler: jest.fn() };
    saveDynamicFormUseCase = { handler: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DynamicFormController],
      providers: [
        { provide: GetDynamicFormUseCase, useValue: getDynamicFormUseCase },
        { provide: GetFormByReferenceUseCase, useValue: getFormByReferenceUseCase },
        { provide: GetBlankDynamicFormUseCase, useValue: getBlankDynamicFormUseCase },
        { provide: SaveDynamicFormUseCase, useValue: saveDynamicFormUseCase },
      ],
    }).compile();

    controller = module.get(DynamicFormController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDynamicForm', () => {
    it('should return PARAMETER_MISSING when id is empty', async () => {
      const result = await controller.getDynamicForm('');
      expect(result).toEqual({
        success: false,
        error: {
          code: 'PARAMETER_MISSING',
          message: 'กรุณาระบุ Form ID',
        },
      });
      expect(getDynamicFormUseCase.handler).not.toHaveBeenCalled();
    });

    it('should return PARAMETER_INVALID when id is not a number', async () => {
      const result = await controller.getDynamicForm('abc');
      expect(result).toEqual({
        success: false,
        error: {
          code: 'PARAMETER_INVALID',
          message: 'Form ID ต้องเป็นตัวเลข',
        },
      });
      expect(getDynamicFormUseCase.handler).not.toHaveBeenCalled();
    });

    it('should return success true and form when use case succeeds', async () => {
      const mockForm = { id: 123, name: 'test-form' };
      getDynamicFormUseCase.handler.mockResolvedValue(mockForm);

      const result = await controller.getDynamicForm('123');

      expect(getDynamicFormUseCase.handler).toHaveBeenCalledWith(123);
      expect(result).toEqual({
        success: true,
        form: mockForm,
      });
    });

    it('should return parsed JSON error when error.message is JSON with code/message', async () => {
      const err = new Error(
        JSON.stringify({ code: 'NOT_FOUND', message: 'Form not found' }),
      );
      getDynamicFormUseCase.handler.mockRejectedValue(err);

      const result = await controller.getDynamicForm('1');

      expect(result).toEqual({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Form not found' },
      });
    });

    it('should return error.code/error.message when error.message is not JSON', async () => {
      const err: any = new Error('Boom');
      err.code = 'INTERNAL_ERROR_CUSTOM';
      getDynamicFormUseCase.handler.mockRejectedValue(err);

      const result = await controller.getDynamicForm('1');

      expect(result).toEqual({
        success: false,
        error: { code: 'INTERNAL_ERROR_CUSTOM', message: 'Boom' },
      });
    });

    it('should return INTERNAL_ERROR with Thai default message when error has no message/code', async () => {
      const err: any = {};
      getDynamicFormUseCase.handler.mockRejectedValue(err);

      const result = await controller.getDynamicForm('1');

      expect(result).toEqual({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'เกิดข้อผิดพลาดในระบบ' },
      });
    });
  });

  describe('getFormByReference', () => {
    it('should return PARAMETER_MISSING when obj or key is missing', async () => {
      const result1 = await controller.getFormByReference('', '1');
      const result2 = await controller.getFormByReference('poi', '');
      const result3 = await controller.getFormByReference('', '');

      for (const result of [result1, result2, result3]) {
        expect(result).toEqual({
          success: false,
          error: {
            code: 'PARAMETER_MISSING',
            message: 'กรุณาระบุ reference_obj และ reference_key',
          },
        });
      }
      expect(getFormByReferenceUseCase.handler).not.toHaveBeenCalled();
    });

    it('should return PARAMETER_INVALID when key is not numeric', async () => {
      const result = await controller.getFormByReference('poi', 'abc');
      expect(result).toEqual({
        success: false,
        error: { code: 'PARAMETER_INVALID', message: 'reference_key ต้องเป็นตัวเลข' },
      });
      expect(getFormByReferenceUseCase.handler).not.toHaveBeenCalled();
    });

    it('should return success true and form when use case succeeds', async () => {
      const mockForm = { id: 7, refObj: 'poi', refKey: 99 };
      getFormByReferenceUseCase.handler.mockResolvedValue(mockForm);

      const result = await controller.getFormByReference('poi', '99');

      expect(getFormByReferenceUseCase.handler).toHaveBeenCalledWith('poi', 99);
      expect(result).toEqual({ success: true, form: mockForm });
    });

    it('should map error when use case throws (non-JSON message)', async () => {
      const err: any = new Error('failure');
      err.code = 'SOME_CODE';
      getFormByReferenceUseCase.handler.mockRejectedValue(err);

      const result = await controller.getFormByReference('poi', '1');

      expect(result).toEqual({
        success: false,
        error: { code: 'SOME_CODE', message: 'failure' },
      });
    });
  });

  describe('getBlankDynamicForm', () => {
    it('should return PARAMETER_MISSING when formId is empty', async () => {
      const result = await controller.getBlankDynamicForm('');
      expect(result).toEqual({
        success: false,
        error: { code: 'PARAMETER_MISSING', message: 'กรุณาระบุ Form Config ID' },
      });
      expect(getBlankDynamicFormUseCase.handler).not.toHaveBeenCalled();
    });

    it('should return PARAMETER_INVALID when formId is not numeric', async () => {
      const result = await controller.getBlankDynamicForm('abc');
      expect(result).toEqual({
        success: false,
        error: { code: 'PARAMETER_INVALID', message: 'Form Config ID ต้องเป็นตัวเลข' },
      });
      expect(getBlankDynamicFormUseCase.handler).not.toHaveBeenCalled();
    });

    it('should return success true and form when use case succeeds', async () => {
      const mockForm = { id: 10, fields: [] };
      getBlankDynamicFormUseCase.handler.mockResolvedValue(mockForm);

      const result = await controller.getBlankDynamicForm('10');

      expect(getBlankDynamicFormUseCase.handler).toHaveBeenCalledWith(10);
      expect(result).toEqual({ success: true, form: mockForm });
    });

    it('should map error when use case throws', async () => {
      const err: any = new Error('oops');
      err.code = 'ERR_CODE';
      getBlankDynamicFormUseCase.handler.mockRejectedValue(err);

      const result = await controller.getBlankDynamicForm('10');

      expect(result).toEqual({
        success: false,
        error: { code: 'ERR_CODE', message: 'oops' },
      });
    });
  });

  describe('getBlankDynamicFormWithVersion', () => {
    it('should return PARAMETER_MISSING when formId is empty', async () => {
      const result = await controller.getBlankDynamicFormWithVersion('', '1');
      expect(result).toEqual({
        success: false,
        error: { code: 'PARAMETER_MISSING', message: 'กรุณาระบุ Form Config ID' },
      });
      expect(getBlankDynamicFormUseCase.handler).not.toHaveBeenCalled();
    });

    it('should return PARAMETER_INVALID when formId is not numeric', async () => {
      const result = await controller.getBlankDynamicFormWithVersion('abc', '1');
      expect(result).toEqual({
        success: false,
        error: { code: 'PARAMETER_INVALID', message: 'Form Config ID ต้องเป็นตัวเลข' },
      });
      expect(getBlankDynamicFormUseCase.handler).not.toHaveBeenCalled();
    });

    it('should return PARAMETER_INVALID when versionId is not numeric', async () => {
      const result = await controller.getBlankDynamicFormWithVersion('10', 'abc');
      expect(result).toEqual({
        success: false,
        error: { code: 'PARAMETER_INVALID', message: 'Form Version ID ต้องเป็นตัวเลข' },
      });
      expect(getBlankDynamicFormUseCase.handler).not.toHaveBeenCalled();
    });

    it('should return success true and form when use case succeeds', async () => {
      const mockForm = { id: 10, version: 2, fields: [] };
      getBlankDynamicFormUseCase.handler.mockResolvedValue(mockForm);

      const result = await controller.getBlankDynamicFormWithVersion('10', '2');

      expect(getBlankDynamicFormUseCase.handler).toHaveBeenCalledWith(10, 2);
      expect(result).toEqual({ success: true, form: mockForm });
    });
  });

  describe('createDynamicForm', () => {
    it('should return success true with form when use case succeeds', async () => {
      const body = { foo: 'bar' };
      const saved = { id: 1, foo: 'bar' };
      saveDynamicFormUseCase.handler.mockResolvedValue(saved);

      const result = await controller.createDynamicForm(body);

      expect(saveDynamicFormUseCase.handler).toHaveBeenCalledWith(body);
      expect(result).toEqual({ success: true, form: saved });
    });

    it('should map error when use case throws', async () => {
      const body = { foo: 'bar' };
      const err: any = new Error('save failed');
      err.code = 'SAVE_FAILED';
      saveDynamicFormUseCase.handler.mockRejectedValue(err);

      const result = await controller.createDynamicForm(body);

      expect(result).toEqual({
        success: false,
        error: { code: 'SAVE_FAILED', message: 'save failed' },
      });
    });
  });

  describe('updateDynamicForm', () => {
    it('should return success true with form when use case succeeds', async () => {
      const formId = 99;
      const body = { foo: 'baz' };
      const saved = { id: formId, foo: 'baz' };
      saveDynamicFormUseCase.handler.mockResolvedValue(saved);

      const result = await controller.updateDynamicForm(formId, body);

      expect(saveDynamicFormUseCase.handler).toHaveBeenCalledWith(body, formId, true);
      expect(result).toEqual({ success: true, form: saved });
    });

    it('should map error when use case throws', async () => {
      const formId = 99;
      const body = { foo: 'baz' };
      const err: any = new Error('update failed');
      err.code = 'UPDATE_FAILED';
      saveDynamicFormUseCase.handler.mockRejectedValue(err);

      const result = await controller.updateDynamicForm(formId, body);

      expect(result).toEqual({
        success: false,
        error: { code: 'UPDATE_FAILED', message: 'update failed' },
      });
    });
  });
});
