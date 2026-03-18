import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ImportController } from './import.controller';
import { ImportFileUseCase } from '../../../application/usecases/import/importFile.usecase';

import { GetStorePlanStandardUseCase } from '../../../application/usecases/import/getStorePlanStandard.usecase';
import { GetAnnounceUseCase } from '../../../application/usecases/import/getAnnounce.usecase';
import { DownloadFileUseCase } from '../../../application/usecases/import/downloadFile.usecase';
import { CreateAnnounceUseCase } from '../../../application/usecases/import/createAnnounce.usecase';
import { GetKnowledgeUseCase } from '../../../application/usecases/import/getKnowledge.usecase';
import { CreateStorePlanStandardUseCase } from '../../../application/usecases/import/createStorePlanStandard.usecase';
import { CreateKnowledgeUseCase } from '../../../application/usecases/import/createKnowledge.usecase';
import { UpdateCanLoadStorePlanStandardUseCase } from '../../../application/usecases/import/updateCanLoadStorePlanStandard.usecase';
import { DeleteStorePlanStandardUseCase } from '../../../application/usecases/import/deleteStorePlanStandard.usecase';
import { DeleteKnowledgeUseCase } from '../../../application/usecases/import/deleteKnowledge.usecase';
import { DeleteAnnounceUseCase } from '../../../application/usecases/import/deleteAnnounce.usecase';
import { UpdateAnnounceIsShowUseCase } from '../../../application/usecases/import/updateAnnounceIsShow.usecase';

describe('ImportController', () => {
  let controller: ImportController;
  let importFileUseCase: { execute: jest.Mock };
  let downloadFileUseCase: { execute: jest.Mock };

  const createStorePlanStandardUseCase = {
    handlerWithFile: jest.fn(),
  };
  const getStorePlanStandardUseCase: any = {};
  const getAnnounceUseCase = {};
  const createAnnounceUseCase = {};
  const getKnowledgeUseCase = {};
  const createKnowledgeUseCase = {};
  const updateCanLoadStorePlanStandardUseCase = {};
  const deleteStorePlanStandardUseCase = {};
  const deleteKnowledgeUseCase = {};
  const deleteAnnounceUseCase = {};
  const updateAnnounceIsShowUseCase = {};

  const makeFile = (overrides: Partial<Express.Multer.File> = {}): Express.Multer.File =>
    ({
      fieldname: 'file',
      originalname: 'test.xlsx',
      encoding: '7bit',
      mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: 1024,
      destination: '',
      filename: '',
      path: '',
      buffer: Buffer.from('content'),
      stream: undefined as any,
      ...overrides,
    }) as unknown as Express.Multer.File;

  beforeEach(async () => {
    importFileUseCase = { execute: jest.fn() };
    downloadFileUseCase = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImportController],
      providers: [
        { provide: ImportFileUseCase, useValue: importFileUseCase },
        { provide: DownloadFileUseCase, useValue: downloadFileUseCase },
        {
          provide: CreateStorePlanStandardUseCase,
          useValue: createStorePlanStandardUseCase,
        },
        { provide: GetStorePlanStandardUseCase, useValue: getStorePlanStandardUseCase },
        { provide: GetAnnounceUseCase, useValue: getAnnounceUseCase },
        { provide: CreateAnnounceUseCase, useValue: createAnnounceUseCase },
        { provide: GetKnowledgeUseCase, useValue: getKnowledgeUseCase },
        { provide: CreateKnowledgeUseCase, useValue: createKnowledgeUseCase },
        {
          provide: UpdateCanLoadStorePlanStandardUseCase,
          useValue: updateCanLoadStorePlanStandardUseCase,
        },
        {
          provide: DeleteStorePlanStandardUseCase,
          useValue: deleteStorePlanStandardUseCase,
        },
        { provide: DeleteKnowledgeUseCase, useValue: deleteKnowledgeUseCase },
        { provide: DeleteAnnounceUseCase, useValue: deleteAnnounceUseCase },
        { provide: UpdateAnnounceIsShowUseCase, useValue: updateAnnounceIsShowUseCase },
        {
          provide: 'S3GatewayPort',
          useValue: {
            getSignedDownloadUrl: jest.fn().mockResolvedValue({ url: 'mock-signed-url' }),
          },
        },
      ],
    }).compile();

    controller = module.get<ImportController>(ImportController);
  });

  describe('createStorePlanStandard (mock logic)', () => {
    beforeEach(() => {
      createStorePlanStandardUseCase.handlerWithFile.mockImplementation((body, file) => {
        return Promise.resolve({
          file: file ? file.originalname : null,
          mock: true,
          message: 'This is a mock response.',
        });
      });
    });

    it('should return mock response with file name if file is provided', async () => {
      const body = { filename: undefined, version: undefined };
      const file = { originalname: 'test.pdf' } as Express.Multer.File;
      const result = await controller.createStorePlanStandard(body, file);
      expect(result).toEqual({
        success: true,
        form: {
          file: 'test.pdf',
          mock: true,
          message: 'This is a mock response.',
        },
      });
    });

    it('should return mock response with file name if file is .xls', async () => {
      const body = { filename: undefined, version: undefined };
      const file = { originalname: 'test.xls' } as Express.Multer.File;
      const result = await controller.createStorePlanStandard(body, file);
      expect(result).toEqual({
        success: true,
        form: {
          file: 'test.xls',
          mock: true,
          message: 'This is a mock response.',
        },
      });
    });

    it('should return mock response with file name if file is .csv', async () => {
      const body = { filename: undefined, version: undefined };
      const file = { originalname: 'test.csv' } as Express.Multer.File;
      const result = await controller.createStorePlanStandard(body, file);
      expect(result).toEqual({
        success: true,
        form: {
          file: 'test.csv',
          mock: true,
          message: 'This is a mock response.',
        },
      });
    });

    it('should return mock response with file=null if file is not provided', async () => {
      const body = { filename: undefined, version: undefined };
      const result = await controller.createStorePlanStandard(body, undefined);
      expect(result).toEqual({
        success: true,
        form: {
          file: null,
          mock: true,
          message: 'This is a mock response.',
        },
      });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadImportFile', () => {
    it('should throw BadRequestException when no file uploaded', async () => {
      await expect(
        controller.uploadImportFile('IMPORT-1', undefined as any),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(importFileUseCase.execute).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when mimetype is not allowed', async () => {
      const badFile = makeFile({ mimetype: 'text/plain' });

      await expect(
        controller.uploadImportFile('IMPORT-1', badFile),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(importFileUseCase.execute).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when file is empty (size 0)', async () => {
      const emptyFile = makeFile({ size: 0 });

      await expect(
        controller.uploadImportFile('IMPORT-1', emptyFile),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(importFileUseCase.execute).not.toHaveBeenCalled();
    });

    it('should accept xlsx and call use case with (importId, file)', async () => {
      const file = makeFile({
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        originalname: 'ok.xlsx',
        size: 123,
      });

      const mockResult = { ok: true };
      importFileUseCase.execute.mockResolvedValue(mockResult);

      const result = await controller.uploadImportFile('IMPORT-1', file);

      expect(importFileUseCase.execute).toHaveBeenCalledTimes(1);
      expect(importFileUseCase.execute).toHaveBeenCalledWith('IMPORT-1', file);
      expect(result).toEqual({ data: mockResult });
    });

    it('should accept xls and call use case', async () => {
      const file = makeFile({
        mimetype: 'application/vnd.ms-excel',
        originalname: 'ok.xls',
      });

      const mockResult = { ok: true };
      importFileUseCase.execute.mockResolvedValue(mockResult);

      const result = await controller.uploadImportFile('IMPORT-2', file);

      expect(importFileUseCase.execute).toHaveBeenCalledWith('IMPORT-2', file);
      expect(result).toEqual({ data: mockResult });
    });

    it('should accept csv and call use case', async () => {
      const file = makeFile({
        mimetype: 'text/csv',
        originalname: 'ok.csv',
      });

      const mockResult = { ok: true };
      importFileUseCase.execute.mockResolvedValue(mockResult);

      const result = await controller.uploadImportFile('IMPORT-3', file);

      expect(importFileUseCase.execute).toHaveBeenCalledWith('IMPORT-3', file);
      expect(result).toEqual({ data: mockResult });
    });

    it('should propagate errors thrown by the use case', async () => {
      const file = makeFile();
      importFileUseCase.execute.mockRejectedValue(new Error('boom'));

      await expect(controller.uploadImportFile('IMPORT-9', file)).rejects.toThrow('boom');
      expect(importFileUseCase.execute).toHaveBeenCalledWith('IMPORT-9', file);
    });
  });

  describe('downloadStorePlanStandard', () => {
    let s3GatewayMock: any;

    beforeEach(() => {
      s3GatewayMock = {
        getSignedDownloadUrl: jest.fn().mockResolvedValue({ url: 'mock-signed-url' }),
      };
      getStorePlanStandardUseCase.findById = jest.fn().mockResolvedValue({
        filepath: 'mock/path/file.xlsx',
        filename: 'file.xlsx',
      });
      // Mock downloadFileUseCase.execute ให้สะท้อน logic จริง
      downloadFileUseCase.execute.mockImplementation(async (type, id) => {
        if (type === 'store-plan-standard') {
          const entity = await getStorePlanStandardUseCase.findById(id);
          if (!entity || !entity.filepath) throw new Error('File not found');
          controller['s3Gateway'].getSignedDownloadUrl({
            destination: entity.filepath,
            durationSeconds: 180 * 10,
            filename: entity.filename,
          });
          return { url: 'mock-signed-url' };
        }
        return undefined;
      });
    });

    it('should call s3Gateway.getSignedDownloadUrl and return url', async () => {
      const result = await controller.downloadFile(1, 'store-plan-standard');

      expect(getStorePlanStandardUseCase.findById).toHaveBeenCalledWith(1);
      expect(controller['s3Gateway'].getSignedDownloadUrl).toHaveBeenCalledWith({
        destination: 'mock/path/file.xlsx',
        durationSeconds: 180 * 10,
        filename: 'file.xlsx',
      });
      expect(result).toEqual({ url: 'mock-signed-url' });
    });

    it('should throw NotFoundException if entity or filepath is missing', async () => {
      getStorePlanStandardUseCase.findById = jest.fn().mockResolvedValue(null);
      await expect(controller.downloadFile(999, 'store-plan-standard')).rejects.toThrow(
        'File not found',
      );
    });
  });
});
