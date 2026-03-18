import { Test, TestingModule } from '@nestjs/testing';
import { BackupProfileController } from './backupProfile.controller';
import { GetBackupProfileUseCase } from '../../../application/usecases/backupProfile/getBackupProfile.usecase';
import { SaveBackupProfileUseCase } from '../../../application/usecases/backupProfile/saveBackupProfile.usecase';
import { GetBlankDynamicFormBySubcodeUseCase } from '../../../application/usecases/dynamicForm/getBlankDynamicFormBySubcode.usecase';

describe('BackupProfileController', () => {
  let controller: BackupProfileController;

  let getBackupProfileUseCase: jest.Mocked<GetBackupProfileUseCase>;
  let saveBackupProfileUseCase: jest.Mocked<SaveBackupProfileUseCase>;
  let getBlankDynamicFormBySubcodeUseCase: jest.Mocked<GetBlankDynamicFormBySubcodeUseCase>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BackupProfileController],
      providers: [
        {
          provide: GetBackupProfileUseCase,
          useValue: { handler: jest.fn() },
        },
        {
          provide: SaveBackupProfileUseCase,
          useValue: { handler: jest.fn() },
        },
        {
          provide: GetBlankDynamicFormBySubcodeUseCase,
          useValue: { handler: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get(BackupProfileController);

    getBackupProfileUseCase = module.get(GetBackupProfileUseCase);
    saveBackupProfileUseCase = module.get(SaveBackupProfileUseCase);
    getBlankDynamicFormBySubcodeUseCase = module.get(GetBlankDynamicFormBySubcodeUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getBackupProfile', () => {
    it('should return profile wrapped in data', async () => {
      const poiId = 'POI-123';
      const mockProfile = { poiId, foo: 'bar' };

      getBackupProfileUseCase.handler.mockResolvedValue(mockProfile as any);

      const result = await controller.getBackupProfile(poiId);

      expect(getBackupProfileUseCase.handler).toHaveBeenCalledWith(poiId);
      expect(result).toEqual({ data: mockProfile });
    });

    it('should propagate errors from use case', async () => {
      const poiId = 'POI-999';
      getBackupProfileUseCase.handler.mockRejectedValue(new Error('boom'));

      await expect(controller.getBackupProfile(poiId)).rejects.toThrow('boom');
    });
  });

  describe('createBackupProfile', () => {
    it('should call saveBackupProfileUseCase and wrap result in data', async () => {
      const body = { any: 'payload' } as any;
      const mockSaved = { uid: 'BP-1' };

      saveBackupProfileUseCase.handler.mockResolvedValue(mockSaved as any);

      const result = await controller.createBackupProfile(body);

      expect(saveBackupProfileUseCase.handler).toHaveBeenCalledWith(body);
      expect(result).toEqual({ data: mockSaved });
    });

    it('should propagate errors from use case', async () => {
      saveBackupProfileUseCase.handler.mockRejectedValue(new Error('save failed'));

      await expect(controller.createBackupProfile({} as any)).rejects.toThrow(
        'save failed',
      );
    });
  });

  describe('updateBackupProfile', () => {
    it('should call saveBackupProfileUseCase with (body, uid) and wrap result in data', async () => {
      const uid = 'UID-123';
      const body = { update: true } as any;
      const mockUpdated = { uid, updated: true };

      saveBackupProfileUseCase.handler.mockResolvedValue(mockUpdated as any);

      const result = await controller.updateBackupProfile(uid, body);

      expect(saveBackupProfileUseCase.handler).toHaveBeenCalledWith(body, uid);
      expect(result).toEqual({ data: mockUpdated });
    });

    it('should propagate errors from use case', async () => {
      saveBackupProfileUseCase.handler.mockRejectedValue(new Error('update failed'));

      await expect(controller.updateBackupProfile('UID-1', {} as any)).rejects.toThrow(
        'update failed',
      );
    });
  });

  describe('getBlankDynamicForm', () => {
    it('should return PARAMETER_MISSING when subcode is empty', async () => {
      const result = await controller.getBlankDynamicForm('' as any);

      expect(result).toEqual({
        success: false,
        error: {
          code: 'PARAMETER_MISSING',
          message: 'กรุณาระบุ Subcode',
        },
      });
      expect(getBlankDynamicFormBySubcodeUseCase.handler).not.toHaveBeenCalled();
    });

    it('should return success true with form when usecase resolves', async () => {
      const subcode = 'SC001';
      const mockForm = { id: 1, subcode };

      getBlankDynamicFormBySubcodeUseCase.handler.mockResolvedValue(mockForm as any);

      const result = await controller.getBlankDynamicForm(subcode);

      expect(getBlankDynamicFormBySubcodeUseCase.handler).toHaveBeenCalledWith(subcode);
      expect(result).toEqual({
        success: true,
        form: mockForm,
      });
    });

    it('should return error object when usecase throws, preferring error.code/message', async () => {
      const subcode = 'SC002';
      const err: any = new Error('something bad');
      err.code = 'SOME_CODE';
      getBlankDynamicFormBySubcodeUseCase.handler.mockRejectedValue(err);

      const result = await controller.getBlankDynamicForm(subcode);

      expect(result).toEqual({
        success: false,
        error: {
          code: 'SOME_CODE',
          message: 'something bad',
        },
      });
    });

    it('should return INTERNAL_ERROR and default Thai message when thrown error has no code/message', async () => {
      const subcode = 'SC003';
      getBlankDynamicFormBySubcodeUseCase.handler.mockRejectedValue({});

      const result = await controller.getBlankDynamicForm(subcode);

      expect(result).toEqual({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'เกิดข้อผิดพลาดในระบบ',
        },
      });
    });
  });

  describe('getBlankDynamicFormWithVersion', () => {
    it('should return PARAMETER_MISSING when subcode is empty', async () => {
      const result = await controller.getBlankDynamicFormWithVersion('' as any, '1');

      expect(result).toEqual({
        success: false,
        error: {
          code: 'PARAMETER_MISSING',
          message: 'กรุณาระบุ Subcode',
        },
      });
      expect(getBlankDynamicFormBySubcodeUseCase.handler).not.toHaveBeenCalled();
    });

    it('should return PARAMETER_INVALID when versionId is not a number', async () => {
      const result = await controller.getBlankDynamicFormWithVersion('SC001', 'abc');

      expect(result).toEqual({
        success: false,
        error: {
          code: 'PARAMETER_INVALID',
          message: 'Form Version ID ต้องเป็นตัวเลข',
        },
      });
      expect(getBlankDynamicFormBySubcodeUseCase.handler).not.toHaveBeenCalled();
    });

    it('should return success true with form when usecase resolves', async () => {
      const subcode = 'SC010';
      const versionId = '2';
      const mockForm = { id: 99, subcode, versionId: 2 };

      getBlankDynamicFormBySubcodeUseCase.handler.mockResolvedValue(mockForm as any);

      const result = await controller.getBlankDynamicFormWithVersion(subcode, versionId);

      expect(getBlankDynamicFormBySubcodeUseCase.handler).toHaveBeenCalledWith(
        subcode,
        2,
      );
      expect(result).toEqual({
        success: true,
        form: mockForm,
      });
    });

    it('should return error object when usecase throws', async () => {
      const subcode = 'SC011';
      const versionId = '3';
      const err: any = new Error('nope');
      err.code = 'NOT_FOUND';

      getBlankDynamicFormBySubcodeUseCase.handler.mockRejectedValue(err);

      const result = await controller.getBlankDynamicFormWithVersion(subcode, versionId);

      expect(result).toEqual({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'nope',
        },
      });
    });
  });
});
