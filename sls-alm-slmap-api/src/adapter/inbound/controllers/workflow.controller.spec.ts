import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowController } from './workflow.controller';
import { GetCurrentWorkflowStepUseCase } from '../../../application/usecases/workflow/getCurrentWorkflowStep.usecase';
import { GetWorkflowHistoryUseCase } from '../../../application/usecases/workflow/getWorkflowHistory.usecase';
import { GetWorkflowStatusesUseCase } from '../../../application/usecases/workflow/getWorkflowStatuses.usecase';
import { GetWorkflowStepsUseCase } from '../../../application/usecases/workflow/getWorkflowSteps.usecase';
import { UpdateWfStepOwnerUseCase } from '../../../application/usecases/workflow/updateWfStepOwner.usecase';
import { CustomRequest } from '../interfaces/requests/customRequest';
import { Language } from '../../../common/enums/language.enum';

describe('WorkflowController', () => {
  let controller: WorkflowController;

  let getCurrentWorkflowStepUseCase: jest.Mocked<GetCurrentWorkflowStepUseCase>;
  let getWorkflowHistoryUseCase: jest.Mocked<GetWorkflowHistoryUseCase>;
  let getWorkflowStatusesUseCase: jest.Mocked<GetWorkflowStatusesUseCase>;

  const mockRequest = {
    user: {
      id: 123,
    },
  } as unknown as CustomRequest;

  const language = Language.TH as Language;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkflowController],
      providers: [
        {
          provide: GetCurrentWorkflowStepUseCase,
          useValue: {
            handler: jest.fn(),
            getWorkflowTransaction: jest.fn(),
          },
        },
        {
          provide: GetWorkflowHistoryUseCase,
          useValue: {
            handler: jest.fn(),
          },
        },
        {
          provide: GetWorkflowStatusesUseCase,
          useValue: {
            handler: jest.fn(),
          },
        },
        {
          provide: GetWorkflowStepsUseCase,
          useValue: {
            handler: jest.fn(),
          },
        },
        {
          provide: UpdateWfStepOwnerUseCase,
          useValue: {
            handler: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(WorkflowController);
    getCurrentWorkflowStepUseCase = module.get(GetCurrentWorkflowStepUseCase);
    getWorkflowHistoryUseCase = module.get(GetWorkflowHistoryUseCase);
    getWorkflowStatusesUseCase = module.get(GetWorkflowStatusesUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentStep', () => {
    it('should call use case with refId, [wfId], req.user.id, language and return result', async () => {
      const refId = 10;
      const wfId = 20;

      const mockResult = { data: 'current-step' } as any;
      getCurrentWorkflowStepUseCase.handler.mockResolvedValue(mockResult);

      const result = await controller.getCurrentStep(language, mockRequest, refId, wfId);

      expect(getCurrentWorkflowStepUseCase.handler).toHaveBeenCalledWith(
        refId,
        [wfId],
        mockRequest.user.id,
        language,
      );
      expect(result).toBe(mockResult);
    });

    it('should propagate errors from use case', async () => {
      const refId = 10;
      const wfId = 20;

      getCurrentWorkflowStepUseCase.handler.mockRejectedValue(
        new Error('something went wrong'),
      );

      await expect(
        controller.getCurrentStep(language, mockRequest, refId, wfId),
      ).rejects.toThrow('something went wrong');
    });
  });

  describe('getAllWorkflowHistory', () => {
    it('should call history use case with (refId, undefined, language) and return result', async () => {
      const refId = 99;

      const mockResult = { data: ['h1', 'h2'] } as any;
      getWorkflowHistoryUseCase.handler.mockResolvedValue(mockResult);

      const result = await controller.getAllWorkflowHistory(language, refId);

      expect(getWorkflowHistoryUseCase.handler).toHaveBeenCalledWith(
        refId,
        undefined,
        language,
      );
      expect(result).toBe(mockResult);
    });

    it('should propagate errors from use case', async () => {
      const refId = 99;

      getWorkflowHistoryUseCase.handler.mockRejectedValue(new Error('history error'));

      await expect(controller.getAllWorkflowHistory(language, refId)).rejects.toThrow(
        'history error',
      );
    });
  });

  describe('getWorkflowHistory', () => {
    it('should call history use case with (refId, wfId, language) and return result', async () => {
      const refId = 1;
      const wfId = 2;

      const mockResult = { data: ['h'] } as any;
      getWorkflowHistoryUseCase.handler.mockResolvedValue(mockResult);

      const result = await controller.getWorkflowHistory(language, refId, wfId);

      expect(getWorkflowHistoryUseCase.handler).toHaveBeenCalledWith(
        refId,
        wfId,
        language,
      );
      expect(result).toBe(mockResult);
    });

    it('should propagate errors from use case', async () => {
      const refId = 1;
      const wfId = 2;

      getWorkflowHistoryUseCase.handler.mockRejectedValue(new Error('wf history error'));

      await expect(controller.getWorkflowHistory(language, refId, wfId)).rejects.toThrow(
        'wf history error',
      );
    });
  });

  describe('getWorkflowTransaction', () => {
    it('should return {data: transaction} when found', async () => {
      const wfTransactionId = 777;
      const mockTransaction = { id: wfTransactionId, status: 'DONE' } as any;

      getCurrentWorkflowStepUseCase.getWorkflowTransaction.mockResolvedValue(
        mockTransaction,
      );

      const result = await controller.getWorkflowTransaction(wfTransactionId);

      expect(getCurrentWorkflowStepUseCase.getWorkflowTransaction).toHaveBeenCalledWith(
        wfTransactionId,
      );
      expect(result).toEqual({ data: mockTransaction });
    });

    it('should return {data: null, message: "..."} when not found', async () => {
      const wfTransactionId = 888;

      getCurrentWorkflowStepUseCase.getWorkflowTransaction.mockResolvedValue(null as any);

      const result = await controller.getWorkflowTransaction(wfTransactionId);

      expect(getCurrentWorkflowStepUseCase.getWorkflowTransaction).toHaveBeenCalledWith(
        wfTransactionId,
      );
      expect(result).toEqual({ data: null, message: 'Workflow transaction not found' });
    });

    it('should propagate errors from use case', async () => {
      const wfTransactionId = 999;

      getCurrentWorkflowStepUseCase.getWorkflowTransaction.mockRejectedValue(
        new Error('transaction error'),
      );

      await expect(controller.getWorkflowTransaction(wfTransactionId)).rejects.toThrow(
        'transaction error',
      );
    });
  });

  describe('getWorkflowStatuses', () => {
    it('should call use case with wfId, language and return result', async () => {
      const wfId = 1;
      const mockResult = [{ value: '1', text: 'status' }];
      getWorkflowStatusesUseCase.handler.mockResolvedValue(mockResult);

      const result = await controller.getWorkflowStatuses(language, wfId);

      expect(getWorkflowStatusesUseCase.handler).toHaveBeenCalledWith(wfId, language);
      expect(result).toEqual({ data: mockResult });
    });

    it('should propagate errors from use case', async () => {
      const wfId = 1;
      getWorkflowStatusesUseCase.handler.mockRejectedValue(new Error('status error'));

      await expect(controller.getWorkflowStatuses(language, wfId)).rejects.toThrow(
        'status error',
      );
    });
  });
});
