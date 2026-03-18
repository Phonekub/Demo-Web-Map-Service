import { Test, TestingModule } from '@nestjs/testing';
import { ReportController } from './report.controller';
import { ExportReportUseCase } from '../../../application/usecases/exportReport/exportReport.usecase';
import { PassThrough } from 'stream';
import type { Response } from 'express';

describe('ReportController', () => {
  let controller: ReportController;
  let exportReportUseCase: jest.Mocked<ExportReportUseCase>;

  const createMockResponse = (): jest.Mocked<Response> => {
    const res: Partial<jest.Mocked<Response>> = {
      set: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      headersSent: false,
      end: jest.fn(),
    };
    return res as jest.Mocked<Response>;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportController],
      providers: [
        {
          provide: ExportReportUseCase,
          useValue: {
            handler: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(ReportController);
    exportReportUseCase = module.get(ExportReportUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('exportReport', () => {
    it('should set headers and pipe excel stream to response; append .xlsx if missing', async () => {
      const excelStream = new PassThrough();
      // spy on pipe to ensure it was invoked with res
      const pipeSpy = jest.spyOn(excelStream, 'pipe');

      exportReportUseCase.handler.mockResolvedValue({
        excelStream,
        fileName: 'tradearea_report', // missing .xlsx -> controller should append
      } as any);

      const res = createMockResponse();

      await controller.exportReport('123', 'th' as any, res);

      expect(exportReportUseCase.handler).toHaveBeenCalledWith(123, 'th');

      expect(res.set).toHaveBeenCalledWith({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'File-name': encodeURIComponent('tradearea_report.xlsx'),
        'Access-Control-Expose-Headers': 'File-name',
      });

      expect(pipeSpy).toHaveBeenCalledWith(res as any);
    });

    it('should not double-append .xlsx when filename already ends with .xlsx', async () => {
      const excelStream = new PassThrough();
      const pipeSpy = jest.spyOn(excelStream, 'pipe');

      exportReportUseCase.handler.mockResolvedValue({
        excelStream,
        fileName: 'tradearea_report.xlsx',
      } as any);

      const res = createMockResponse();

      await controller.exportReport('7', 'en' as any, res);

      expect(exportReportUseCase.handler).toHaveBeenCalledWith(7, 'en');

      expect(res.set).toHaveBeenCalledWith({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'File-name': encodeURIComponent('tradearea_report.xlsx'),
        'Access-Control-Expose-Headers': 'File-name',
      });

      expect(pipeSpy).toHaveBeenCalledWith(res as any);
    });

    it('should respond with 500 JSON when use case throws and headers not sent', async () => {
      exportReportUseCase.handler.mockRejectedValue(new Error('boom'));

      const res = createMockResponse();
      res.headersSent = false;

      await controller.exportReport('5', 'th' as any, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Failed to export report',
        error: 'boom',
      });
    });

    it('should not write error response when headers already sent', async () => {
      exportReportUseCase.handler.mockRejectedValue(new Error('boom'));

      const res = createMockResponse();
      res.headersSent = true;

      await controller.exportReport('5', 'th' as any, res);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
