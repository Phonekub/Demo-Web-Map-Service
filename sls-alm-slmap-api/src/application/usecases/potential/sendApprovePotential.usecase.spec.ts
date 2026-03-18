import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SendApprovePotentialUseCase } from './sendApprovePotential.usecase';
import { BackupProfileRepositoryPort } from '../../ports/backupProfile.repository';
import { PoiRepositoryPort } from '../../ports/poi.repository';
import { WorkflowApprovalUseCase } from '../workflow/workflowApproval.usecase';
import { CreateWorkflowTransactionUseCase } from '../workflow/createWorkflowTransaction.usecase';
import { WorkflowSendMailUseCase } from '../workflow/workflowSendMail.usecase';
import { BackupLocationEntity } from '../../../adapter/outbound/repositories/entities/backupLocation.entity';
import { PoiEntity } from '../../../adapter/outbound/repositories/entities/poi.entity';
import { PoiPotentialEntity } from '../../../adapter/outbound/repositories/entities/potential.entity';
import { WorkflowAction } from '@common/enums/action.enum';

describe('SendApprovePotentialUseCase', () => {
  let useCase: SendApprovePotentialUseCase;
  let backupProfileRepository: jest.Mocked<BackupProfileRepositoryPort>;
  let poiRepository: jest.Mocked<PoiRepositoryPort>;
  let workflowApprovalUseCase: jest.Mocked<WorkflowApprovalUseCase>;

  const mockBackupProfile: BackupLocationEntity = {
    id: 1,
    poiId: 123,
    uid: 'test-uid',
    formLocNumber: 'FL001',
    zoneCode: 'Z001',
    isActive: 'Y',
  } as BackupLocationEntity;

  // Added missing shape and POI properties accessed by the use case (namt, zoneCode, subzoneCode)
  const mockPoiEntity = {
    id: 123,
    layerId: 1,
    name: 'Test POI',
    // shape must be [longitude, latitude] to match usecase destructuring
    shape: { type: 'Point', coordinates: [100.705002764, 14.013123858] },
    namt: 'Test Store',
    zoneCode: 'Z001',
    subzoneCode: 'SZ001',
  } as Partial<PoiEntity> as PoiEntity;

  const mockPotentialStore: PoiPotentialEntity = {
    id: 456,
    poiId: 123,
    uid: 'potential-uid',
    formLocNumber: 'FL001',
    isActive: 'Y',
    wfTransactionId: null,
  } as PoiPotentialEntity;

  beforeEach(async () => {
    const mockBackupProfileRepo = {
      findByPoiId: jest.fn(),
    };

    const mockPoiRepo = {
      findPoiDetailById: jest.fn(),
      updatePotentialStore: jest.fn(),
    };

    const mockWorkflowApprovalUseCase = {
      handler: jest.fn(),
    };

    const mockCreateWorkflowTransactionUseCase = {
      handler: jest.fn(),
    };

    const mockWorkflowSendMailUseCase = {
      handler: jest.fn().mockResolvedValue({ success: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SendApprovePotentialUseCase,
        {
          provide: 'BackupProfileRepository',
          useValue: mockBackupProfileRepo,
        },
        {
          provide: 'PoiRepository',
          useValue: mockPoiRepo,
        },
        {
          provide: CreateWorkflowTransactionUseCase,
          useValue: mockCreateWorkflowTransactionUseCase,
        },
        {
          provide: WorkflowApprovalUseCase,
          useValue: mockWorkflowApprovalUseCase,
        },
        {
          provide: WorkflowSendMailUseCase,
          useValue: mockWorkflowSendMailUseCase,
        },
      ],
    }).compile();

    useCase = module.get<SendApprovePotentialUseCase>(SendApprovePotentialUseCase);
    backupProfileRepository = module.get('BackupProfileRepository');
    poiRepository = module.get('PoiRepository');
    workflowApprovalUseCase = module.get(WorkflowApprovalUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handler', () => {
    it('should successfully send potential for approval', async () => {
      // Arrange
      const poiId = 123;
      const userId = 789;
      const wfTransactionId = 999;

      backupProfileRepository.findByPoiId.mockResolvedValue(mockBackupProfile);
      poiRepository.findPoiDetailById.mockResolvedValue({
        poi: mockPoiEntity,
        potentialStore: mockPotentialStore,
      });
      workflowApprovalUseCase.handler.mockResolvedValue({
        success: true,
        route: { wfEmailDetailId: 11 } as any,
        data: {
          wfTransactionId: wfTransactionId,
          wfStep: { wfStepId: 1, wfStepName: 'Step 1' },
          wfStatus: { wfStatusId: 1, wfStatusName: 'Pending', wfComplete: 'W' as const },
          canAction: true,
          availableActions: [],
        },
      });
      poiRepository.updatePotentialStore.mockResolvedValue();

      // Act
      const result = await useCase.handler(poiId, userId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Successfully sent potential for approval');

      expect(backupProfileRepository.findByPoiId).toHaveBeenCalledWith(poiId);
      expect(poiRepository.findPoiDetailById).toHaveBeenCalledWith(poiId);
      expect(workflowApprovalUseCase.handler).toHaveBeenCalledWith({
        refId: mockPotentialStore.id,
        wfTransactionId: mockPotentialStore.wfTransactionId,
        approvalAction: WorkflowAction.SEND_APPROVE,
        userId: userId,
      });
      expect(poiRepository.updatePotentialStore).toHaveBeenCalledWith(
        mockPotentialStore.id,
        expect.objectContaining({
          status: '05', // PotentialStatus.WAITING_APPROVE
        }),
      );
    });

    it('should throw BadRequestException when poiId is invalid', async () => {
      // Arrange
      const invalidPoiId = 0;
      const userId = 789;

      // Act & Assert
      await expect(useCase.handler(invalidPoiId, userId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(useCase.handler(invalidPoiId, userId)).rejects.toThrow(
        'Invalid POI ID',
      );

      expect(backupProfileRepository.findByPoiId).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when userId is invalid', async () => {
      // Arrange
      const poiId = 123;
      const invalidUserId = 0;

      // Act & Assert
      await expect(useCase.handler(poiId, invalidUserId)).rejects.toThrow(
        BadRequestException,
      );

      expect(backupProfileRepository.findByPoiId).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when backup profile not found', async () => {
      // Arrange
      const poiId = 123;
      const userId = 789;

      backupProfileRepository.findByPoiId.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.handler(poiId, userId)).rejects.toThrow(BadRequestException);
      await expect(useCase.handler(poiId, userId)).rejects.toThrow(
        `Backup profile not found for POI ID: ${poiId}`,
      );

      expect(backupProfileRepository.findByPoiId).toHaveBeenCalledWith(poiId);
      expect(poiRepository.findPoiDetailById).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when POI detail not found', async () => {
      // Arrange
      const poiId = 123;
      const userId = 789;

      backupProfileRepository.findByPoiId.mockResolvedValue(mockBackupProfile);
      poiRepository.findPoiDetailById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.handler(poiId, userId)).rejects.toThrow(NotFoundException);
      await expect(useCase.handler(poiId, userId)).rejects.toThrow(
        `Potential store not found for POI ID: ${poiId}`,
      );

      expect(backupProfileRepository.findByPoiId).toHaveBeenCalledWith(poiId);
      expect(poiRepository.findPoiDetailById).toHaveBeenCalledWith(poiId);
    });

    it('should throw NotFoundException when potential store not found', async () => {
      // Arrange
      const poiId = 123;
      const userId = 789;

      backupProfileRepository.findByPoiId.mockResolvedValue(mockBackupProfile);
      poiRepository.findPoiDetailById.mockResolvedValue({
        poi: mockPoiEntity,
        potentialStore: undefined,
      });

      // Act & Assert
      await expect(useCase.handler(poiId, userId)).rejects.toThrow(NotFoundException);
      await expect(useCase.handler(poiId, userId)).rejects.toThrow(
        `Potential store not found for POI ID: ${poiId}`,
      );
    });

    it('should throw BadRequestException when workflow approval fails', async () => {
      // Arrange
      const poiId = 123;
      const userId = 789;

      backupProfileRepository.findByPoiId.mockResolvedValue(mockBackupProfile);
      poiRepository.findPoiDetailById.mockResolvedValue({
        poi: mockPoiEntity,
        potentialStore: mockPotentialStore,
      });
      workflowApprovalUseCase.handler.mockResolvedValue({
        success: false,
        error: {
          code: 'INVALID_WF',
          message: 'ไม่สามารถสร้าง Workflow ได้',
        },
      });

      // Act & Assert
      await expect(useCase.handler(poiId, userId)).rejects.toThrow(BadRequestException);
      await expect(useCase.handler(poiId, userId)).rejects.toThrow(
        'Failed to create workflow transaction: ไม่สามารถสร้าง Workflow ได้',
      );

      expect(poiRepository.updatePotentialStore).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when workflow transaction ID is not returned', async () => {
      // Arrange
      const poiId = 123;
      const userId = 789;

      backupProfileRepository.findByPoiId.mockResolvedValue(mockBackupProfile);
      poiRepository.findPoiDetailById.mockResolvedValue({
        poi: mockPoiEntity,
        potentialStore: mockPotentialStore,
      });
      workflowApprovalUseCase.handler.mockResolvedValue({
        success: true,
        route: { wfEmailDetailId: 11 } as any,
        data: {
          wfTransactionId: undefined as any,
          wfStep: { wfStepId: 1, wfStepName: 'Step 1' },
          wfStatus: { wfStatusId: 1, wfStatusName: 'Pending', wfComplete: 'W' as const },
          canAction: true,
          availableActions: [],
        },
      });

      // Act & Assert
      await expect(useCase.handler(poiId, userId)).rejects.toThrow(BadRequestException);
      await expect(useCase.handler(poiId, userId)).rejects.toThrow(
        'Workflow transaction ID not returned from workflow service',
      );

      expect(poiRepository.updatePotentialStore).not.toHaveBeenCalled();
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      const poiId = 123;
      const userId = 789;
      const errorMessage = 'Database connection error';

      backupProfileRepository.findByPoiId.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(useCase.handler(poiId, userId)).rejects.toThrow(errorMessage);
    });

    it('should handle update potential store errors', async () => {
      // Arrange
      const poiId = 123;
      const userId = 789;
      const wfTransactionId = 999;
      const errorMessage = 'Update failed';

      backupProfileRepository.findByPoiId.mockResolvedValue(mockBackupProfile);
      poiRepository.findPoiDetailById.mockResolvedValue({
        poi: mockPoiEntity,
        potentialStore: mockPotentialStore,
      });
      workflowApprovalUseCase.handler.mockResolvedValue({
        success: true,
        route: { wfEmailDetailId: 11 } as any,
        data: {
          wfTransactionId: wfTransactionId,
          wfStep: { wfStepId: 1, wfStepName: 'Step 1' },
          wfStatus: { wfStatusId: 1, wfStatusName: 'Pending', wfComplete: 'W' as const },
          canAction: true,
          availableActions: [],
        },
      });
      poiRepository.updatePotentialStore.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(useCase.handler(poiId, userId)).rejects.toThrow(errorMessage);
    });

    it('should handle null backup profile (edge case)', async () => {
      // Arrange
      const poiId = 123;
      const userId = 789;

      backupProfileRepository.findByPoiId.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.handler(poiId, userId)).rejects.toThrow(BadRequestException);
      await expect(useCase.handler(poiId, userId)).rejects.toThrow(
        `Backup profile not found for POI ID: ${poiId}`,
      );
    });

    it('should handle negative poiId (edge case)', async () => {
      // Arrange
      const negativePoiId = -1;
      const userId = 789;

      // Act & Assert
      await expect(useCase.handler(negativePoiId, userId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(useCase.handler(negativePoiId, userId)).rejects.toThrow(
        'Invalid POI ID',
      );
    });

    it('should handle negative userId (edge case)', async () => {
      // Arrange
      const poiId = 123;
      const negativeUserId = -1;

      // Act & Assert
      await expect(useCase.handler(poiId, negativeUserId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should successfully update when potential store already has wfTransactionId (edge case)', async () => {
      // Arrange
      const poiId = 123;
      const userId = 789;
      const newWfTransactionId = 999;
      const existingPotentialStore = {
        ...mockPotentialStore,
        wfTransactionId: 888, // Already has a transaction ID
      };

      backupProfileRepository.findByPoiId.mockResolvedValue(mockBackupProfile);
      poiRepository.findPoiDetailById.mockResolvedValue({
        poi: mockPoiEntity,
        potentialStore: existingPotentialStore,
      });
      workflowApprovalUseCase.handler.mockResolvedValue({
        success: true,
        route: { wfEmailDetailId: 11 } as any,
        data: {
          wfTransactionId: newWfTransactionId,
          wfStep: { wfStepId: 1, wfStepName: 'Step 1' },
          wfStatus: { wfStatusId: 1, wfStatusName: 'Pending', wfComplete: 'W' as const },
          canAction: true,
          availableActions: [],
        },
      });
      poiRepository.updatePotentialStore.mockResolvedValue();

      // Act
      const result = await useCase.handler(poiId, userId);

      // Assert
      expect(result.success).toBe(true);
      expect(workflowApprovalUseCase.handler).toHaveBeenCalledWith({
        refId: existingPotentialStore.id,
        wfTransactionId: existingPotentialStore.wfTransactionId,
        approvalAction: WorkflowAction.SEND_APPROVE,
        userId: userId,
      });
    });
  });
});
