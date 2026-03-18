import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { FindPotentialStatusUsecase } from './findPotentialStatus.usecase';
import { BackupProfileRepositoryPort } from '../../ports/backupProfile.repository';
import { PoiRepositoryPort } from '../../ports/poi.repository';
import { GetCurrentWorkflowStepUseCase } from '../workflow/getCurrentWorkflowStep.usecase';
import { BackupLocationEntity } from '../../../adapter/outbound/repositories/entities/backupLocation.entity';
import { PoiPotentialEntity } from '../../../adapter/outbound/repositories/entities/potential.entity';
import { PotentialStatus } from '../../../common/enums/potential.enum';
import { WorkflowType } from '../../../common/enums/workflow.enum';
import { WorkflowAction } from '../../../common/enums/action.enum';

describe('FindPotentialStatusUsecase', () => {
  let useCase: FindPotentialStatusUsecase;
  let backupProfileRepository: jest.Mocked<BackupProfileRepositoryPort>;
  let poiRepository: jest.Mocked<PoiRepositoryPort>;
  let getCurrentWorkflowStepUseCase: jest.Mocked<GetCurrentWorkflowStepUseCase>;

  const mockBackupProfile: BackupLocationEntity = {
    id: 1,
    poiId: 123,
    uid: 'test-uid',
    formLocNumber: 'FL001',
    zoneCode: 'Z001',
    isActive: 'Y',
  } as BackupLocationEntity;

  const mockPotentialStore: PoiPotentialEntity = {
    id: 456,
    poiId: 123,
    uid: 'potential-uid',
    formLocNumber: 'FL001',
    status: PotentialStatus.APPROVED,
    isActive: 'Y',
    wfTransactionId: 999,
  } as PoiPotentialEntity;

  const mockWorkflowResponse = {
    success: true,
    data: {
      wfTransactionId: 999,
      wfStep: {
        wfStepId: 2,
        wfStepName: 'Step 2',
      },
      wfStatus: {
        wfStatusId: 1,
        wfStatusName: 'Active',
        wfComplete: 'W' as const,
      },
      canAction: true,
      availableActions: [
        {
          actionCode: WorkflowAction.SEND_APPROVE,
          actionName: 'Send Approve',
          requireRemark: false,
          isOwner: false,
        },
        { actionCode: WorkflowAction.SAVE, actionName: 'Save', requireRemark: false, isOwner: false },
      ],
    },
  };

  beforeEach(async () => {
    const mockBackupProfileRepo = {
      findByPoiId: jest.fn(),
      getBackupProfileByPoiId: jest.fn(),
      findByUid: jest.fn(),
      createBackupProfile: jest.fn(),
      updateBackupProfile: jest.fn(),
      getBackupLocationByPoiId: jest.fn(),
      updateBackupLocationFormLocNumber: jest.fn(),
    };

    const mockPoiRepo = {
      findPotentialStoreById: jest.fn(),
      findPoiDetailById: jest.fn(),
      updatePotentialStore: jest.fn(),
    };

    const mockGetCurrentWorkflowStepUseCase = {
      handler: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindPotentialStatusUsecase,
        {
          provide: 'BackupProfileRepository',
          useValue: mockBackupProfileRepo,
        },
        {
          provide: 'PoiRepository',
          useValue: mockPoiRepo,
        },
        {
          provide: GetCurrentWorkflowStepUseCase,
          useValue: mockGetCurrentWorkflowStepUseCase,
        },
      ],
    }).compile();

    useCase = module.get<FindPotentialStatusUsecase>(FindPotentialStatusUsecase);
    backupProfileRepository = module.get('BackupProfileRepository');
    poiRepository = module.get('PoiRepository');
    getCurrentWorkflowStepUseCase = module.get(GetCurrentWorkflowStepUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handler', () => {
    const poiId = 123;
    const userId = 789;

    describe('when backup profile is not found', () => {
      it('should return success false', async () => {
        // Arrange
        backupProfileRepository.findByPoiId.mockResolvedValue(null);

        // Act
        const result = await useCase.handler(poiId, userId);

        // Assert
        expect(result).toEqual({ success: false });
        expect(backupProfileRepository.findByPoiId).toHaveBeenCalledWith(poiId);
        expect(backupProfileRepository.findByPoiId).toHaveBeenCalledTimes(1);
        expect(poiRepository.findPotentialStoreById).not.toHaveBeenCalled();
      });
    });

    describe('when backup profile exists', () => {
      beforeEach(() => {
        backupProfileRepository.findByPoiId.mockResolvedValue(mockBackupProfile);
      });

      describe('and wfTransactionId is null or undefined', () => {
        it('should throw BadRequestException when wfTransactionId is null', async () => {
          // Arrange
          const potentialWithoutWfId = {
            ...mockPotentialStore,
            wfTransactionId: null,
          };
          poiRepository.findPotentialStoreById.mockResolvedValue(potentialWithoutWfId);

          // Act & Assert
          await expect(useCase.handler(poiId, userId)).rejects.toThrow(
            BadRequestException,
          );
          await expect(useCase.handler(poiId, userId)).rejects.toThrow(
            'Workflow transaction not found',
          );

          expect(backupProfileRepository.findByPoiId).toHaveBeenCalledWith(poiId);
          expect(poiRepository.findPotentialStoreById).toHaveBeenCalledWith(poiId);
          expect(getCurrentWorkflowStepUseCase.handler).not.toHaveBeenCalled();
        });

        it('should throw BadRequestException when wfTransactionId is undefined', async () => {
          // Arrange
          const potentialWithoutWfId = {
            ...mockPotentialStore,
            wfTransactionId: undefined,
          };
          poiRepository.findPotentialStoreById.mockResolvedValue(potentialWithoutWfId);

          // Act & Assert
          await expect(useCase.handler(poiId, userId)).rejects.toThrow(
            BadRequestException,
          );
          await expect(useCase.handler(poiId, userId)).rejects.toThrow(
            'Workflow transaction not found',
          );
        });
      });

      describe('and wfTransactionId exists', () => {
        it('should call getCurrentWorkflowStepUseCase and return workflow when SEND_APPROVE action exists', async () => {
          // Arrange
          poiRepository.findPotentialStoreById.mockResolvedValue(mockPotentialStore);
          getCurrentWorkflowStepUseCase.handler.mockResolvedValue(mockWorkflowResponse);

          // Act
          const result = await useCase.handler(poiId, userId);

          // Assert
          expect(result).toEqual(mockWorkflowResponse);
          expect(backupProfileRepository.findByPoiId).toHaveBeenCalledWith(poiId);
          expect(poiRepository.findPotentialStoreById).toHaveBeenCalledWith(poiId);
          expect(getCurrentWorkflowStepUseCase.handler).toHaveBeenCalledWith(
            mockPotentialStore.id,
            [
              WorkflowType.POTENTIAL_PREPARATORY,
              WorkflowType.POTENTIAL_EDIT,
              WorkflowType.POTENTIAL_DELETE,
            ],
            userId,
          );
        });

        it('should return success false when availableActions is empty', async () => {
          // Arrange
          const workflowWithNoActions = {
            ...mockWorkflowResponse,
            data: {
              ...mockWorkflowResponse.data,
              availableActions: [],
            },
          };
          poiRepository.findPotentialStoreById.mockResolvedValue(mockPotentialStore);
          getCurrentWorkflowStepUseCase.handler.mockResolvedValue(workflowWithNoActions);

          // Act
          const result = await useCase.handler(poiId, userId);

          // Assert
          expect(result).toEqual({ success: false });
          expect(getCurrentWorkflowStepUseCase.handler).toHaveBeenCalledWith(
            mockPotentialStore.id,
            [
              WorkflowType.POTENTIAL_PREPARATORY,
              WorkflowType.POTENTIAL_EDIT,
              WorkflowType.POTENTIAL_DELETE,
            ],
            userId,
          );
        });

        it('should return success false when SEND_APPROVE action is not available', async () => {
          // Arrange
          const workflowWithoutSendApprove = {
            ...mockWorkflowResponse,
            data: {
              ...mockWorkflowResponse.data,
              availableActions: [
                {
                  actionCode: WorkflowAction.SAVE,
                  actionName: 'Save',
                  requireRemark: false,
                  isOwner: false,
                },
                {
                  actionCode: WorkflowAction.REJECT,
                  actionName: 'Reject',
                  requireRemark: false,
                  isOwner: false,
                },
              ],
            },
          };
          poiRepository.findPotentialStoreById.mockResolvedValue(mockPotentialStore);
          getCurrentWorkflowStepUseCase.handler.mockResolvedValue(
            workflowWithoutSendApprove,
          );

          // Act
          const result = await useCase.handler(poiId, userId);

          // Assert
          expect(result).toEqual({ success: false });
          expect(getCurrentWorkflowStepUseCase.handler).toHaveBeenCalled();
        });

        it('should return workflow when SEND_APPROVE action exists among other actions', async () => {
          // Arrange
          const workflowWithMultipleActions = {
            ...mockWorkflowResponse,
            data: {
              ...mockWorkflowResponse.data,
              availableActions: [
                {
                  actionCode: WorkflowAction.SAVE,
                  actionName: 'Save',
                  requireRemark: false,
                  isOwner: false,
                },
                {
                  actionCode: WorkflowAction.SEND_APPROVE,
                  actionName: 'Send Approve',
                  requireRemark: false,
                  isOwner: false,
                },
                {
                  actionCode: WorkflowAction.REJECT,
                  actionName: 'Reject',
                  requireRemark: false,
                  isOwner: false,
                },
              ],
            },
          };
          poiRepository.findPotentialStoreById.mockResolvedValue(mockPotentialStore);
          getCurrentWorkflowStepUseCase.handler.mockResolvedValue(
            workflowWithMultipleActions,
          );

          // Act
          const result = await useCase.handler(poiId, userId);

          // Assert
          expect(result).toEqual(workflowWithMultipleActions);
          expect(getCurrentWorkflowStepUseCase.handler).toHaveBeenCalledWith(
            mockPotentialStore.id,
            [
              WorkflowType.POTENTIAL_PREPARATORY,
              WorkflowType.POTENTIAL_EDIT,
              WorkflowType.POTENTIAL_DELETE,
            ],
            userId,
          );
        });
      });

      describe('edge cases with different potential statuses', () => {
        beforeEach(() => {
          backupProfileRepository.findByPoiId.mockResolvedValue(mockBackupProfile);
        });
        it('should handle APPROVED status with workflow', async () => {
          // Arrange
          const approvedPotential = {
            ...mockPotentialStore,
            status: PotentialStatus.APPROVED,
          };
          poiRepository.findPotentialStoreById.mockResolvedValue(approvedPotential);
          getCurrentWorkflowStepUseCase.handler.mockResolvedValue(mockWorkflowResponse);

          // Act
          const result = await useCase.handler(poiId, userId);

          // Assert
          expect(result).toEqual(mockWorkflowResponse);
          expect(getCurrentWorkflowStepUseCase.handler).toHaveBeenCalled();
        });

        it('should handle WAITING_APPROVE status with workflow', async () => {
          // Arrange
          const waitingPotential = {
            ...mockPotentialStore,
            status: PotentialStatus.WAITING_APPROVE,
          };
          poiRepository.findPotentialStoreById.mockResolvedValue(waitingPotential);
          getCurrentWorkflowStepUseCase.handler.mockResolvedValue(mockWorkflowResponse);

          // Act
          const result = await useCase.handler(poiId, userId);

          // Assert
          expect(result).toEqual(mockWorkflowResponse);
          expect(getCurrentWorkflowStepUseCase.handler).toHaveBeenCalled();
        });

        it('should handle NOT_APPROVE status with workflow', async () => {
          // Arrange
          const notApprovePotential = {
            ...mockPotentialStore,
            status: PotentialStatus.NOT_APPROVE,
          };
          poiRepository.findPotentialStoreById.mockResolvedValue(notApprovePotential);
          getCurrentWorkflowStepUseCase.handler.mockResolvedValue(mockWorkflowResponse);

          // Act
          const result = await useCase.handler(poiId, userId);

          // Assert
          expect(result).toEqual(mockWorkflowResponse);
          expect(getCurrentWorkflowStepUseCase.handler).toHaveBeenCalled();
        });
      });
    });

    describe('error handling', () => {
      it('should handle backup profile repository errors', async () => {
        // Arrange
        const errorMessage = 'Database connection error';
        backupProfileRepository.findByPoiId.mockRejectedValue(new Error(errorMessage));

        // Act & Assert
        await expect(useCase.handler(poiId, userId)).rejects.toThrow(errorMessage);
        expect(backupProfileRepository.findByPoiId).toHaveBeenCalledWith(poiId);
      });

      it('should handle poi repository errors', async () => {
        // Arrange
        const errorMessage = 'POI not found';
        backupProfileRepository.findByPoiId.mockResolvedValue(mockBackupProfile);
        poiRepository.findPotentialStoreById.mockRejectedValue(new Error(errorMessage));

        // Act & Assert
        await expect(useCase.handler(poiId, userId)).rejects.toThrow(errorMessage);
        expect(poiRepository.findPotentialStoreById).toHaveBeenCalledWith(poiId);
      });

      it('should handle workflow step use case errors', async () => {
        // Arrange
        const errorMessage = 'Workflow step error';
        backupProfileRepository.findByPoiId.mockResolvedValue(mockBackupProfile);
        poiRepository.findPotentialStoreById.mockResolvedValue(mockPotentialStore);
        getCurrentWorkflowStepUseCase.handler.mockRejectedValue(new Error(errorMessage));

        // Act & Assert
        await expect(useCase.handler(poiId, userId)).rejects.toThrow(errorMessage);
        expect(getCurrentWorkflowStepUseCase.handler).toHaveBeenCalled();
      });
    });

    describe('parameter validation edge cases', () => {
      it('should handle zero poiId', async () => {
        // Arrange
        const zeroPoiId = 0;
        backupProfileRepository.findByPoiId.mockResolvedValue(null);

        // Act
        const result = await useCase.handler(zeroPoiId, userId);

        // Assert
        expect(result).toEqual({ success: false });
        expect(backupProfileRepository.findByPoiId).toHaveBeenCalledWith(zeroPoiId);
      });

      it('should handle negative poiId', async () => {
        // Arrange
        const negativePoiId = -1;
        backupProfileRepository.findByPoiId.mockResolvedValue(null);

        // Act
        const result = await useCase.handler(negativePoiId, userId);

        // Assert
        expect(result).toEqual({ success: false });
        expect(backupProfileRepository.findByPoiId).toHaveBeenCalledWith(negativePoiId);
      });

      it('should handle zero userId', async () => {
        // Arrange
        const zeroUserId = 0;
        backupProfileRepository.findByPoiId.mockResolvedValue(mockBackupProfile);
        poiRepository.findPotentialStoreById.mockResolvedValue(mockPotentialStore);
        getCurrentWorkflowStepUseCase.handler.mockResolvedValue(mockWorkflowResponse);

        // Act
        const result = await useCase.handler(poiId, zeroUserId);

        // Assert
        expect(result).toEqual(mockWorkflowResponse);
        expect(getCurrentWorkflowStepUseCase.handler).toHaveBeenCalledWith(
          mockPotentialStore.id,
          expect.any(Array),
          zeroUserId,
        );
      });
    });

    describe('integration scenarios', () => {
      it('should handle complete flow from backup profile check to workflow step with SEND_APPROVE', async () => {
        // Arrange
        backupProfileRepository.findByPoiId.mockResolvedValue(mockBackupProfile);
        poiRepository.findPotentialStoreById.mockResolvedValue(mockPotentialStore);
        getCurrentWorkflowStepUseCase.handler.mockResolvedValue(mockWorkflowResponse);

        // Act
        const result = await useCase.handler(poiId, userId);

        // Assert
        expect(backupProfileRepository.findByPoiId).toHaveBeenCalledWith(poiId);
        expect(poiRepository.findPotentialStoreById).toHaveBeenCalledWith(poiId);
        expect(getCurrentWorkflowStepUseCase.handler).toHaveBeenCalledWith(
          mockPotentialStore.id,
          [
            WorkflowType.POTENTIAL_PREPARATORY,
            WorkflowType.POTENTIAL_EDIT,
            WorkflowType.POTENTIAL_DELETE,
          ],
          userId,
        );
        expect(result).toEqual(mockWorkflowResponse);
        expect(result.data.availableActions).toContainEqual(
          expect.objectContaining({ actionCode: WorkflowAction.SEND_APPROVE }),
        );
      });

      it('should short-circuit on missing backup profile', async () => {
        // Arrange
        backupProfileRepository.findByPoiId.mockResolvedValue(null);

        // Act
        const result = await useCase.handler(poiId, userId);

        // Assert
        expect(result).toEqual({ success: false });
        expect(backupProfileRepository.findByPoiId).toHaveBeenCalledTimes(1);
        expect(poiRepository.findPotentialStoreById).not.toHaveBeenCalled();
        expect(getCurrentWorkflowStepUseCase.handler).not.toHaveBeenCalled();
      });
    });

    describe('workflow action validation', () => {
      const poiId = 123;
      const userId = 789;

      beforeEach(() => {
        backupProfileRepository.findByPoiId.mockResolvedValue(mockBackupProfile);
        poiRepository.findPotentialStoreById.mockResolvedValue(mockPotentialStore);
      });

      it('should return success false when workflow data is null', async () => {
        // Arrange
        const workflowWithNullData = {
          ...mockWorkflowResponse,
          data: null,
        };
        getCurrentWorkflowStepUseCase.handler.mockResolvedValue(workflowWithNullData);

        // Act & Assert
        await expect(useCase.handler(poiId, userId)).rejects.toThrow();
      });

      it('should return success false when workflow data is undefined', async () => {
        // Arrange
        const workflowWithUndefinedData = {
          ...mockWorkflowResponse,
          data: undefined,
        };
        getCurrentWorkflowStepUseCase.handler.mockResolvedValue(
          workflowWithUndefinedData,
        );

        // Act & Assert
        await expect(useCase.handler(poiId, userId)).rejects.toThrow();
      });

      it('should handle workflow with only SEND_APPROVE action', async () => {
        // Arrange
        const workflowWithOnlySendApprove = {
          ...mockWorkflowResponse,
          data: {
            ...mockWorkflowResponse.data,
            availableActions: [
              {
                actionCode: WorkflowAction.SEND_APPROVE,
                actionName: 'Send Approve',
                requireRemark: false,
                isOwner: false,
              },
            ],
          },
        };
        getCurrentWorkflowStepUseCase.handler.mockResolvedValue(
          workflowWithOnlySendApprove,
        );

        // Act
        const result = await useCase.handler(poiId, userId);

        // Assert
        expect(result).toEqual(workflowWithOnlySendApprove);
        expect(result.data.availableActions).toHaveLength(1);
        expect(result.data.availableActions[0].actionCode).toBe(
          WorkflowAction.SEND_APPROVE,
        );
      });

      it('should return success false with multiple actions but no SEND_APPROVE', async () => {
        // Arrange
        const workflowWithoutSendApprove = {
          ...mockWorkflowResponse,
          data: {
            ...mockWorkflowResponse.data,
            availableActions: [
              {
                actionCode: WorkflowAction.SAVE,
                actionName: 'Save',
                requireRemark: false,
                isOwner: false,
              },
              {
                actionCode: WorkflowAction.REJECT,
                actionName: 'Reject',
                requireRemark: false,
                isOwner: false,
              },
              {
                actionCode: WorkflowAction.CANCEL,
                actionName: 'Cancel',
                requireRemark: false,
                isOwner: false,
              },
            ],
          },
        };
        getCurrentWorkflowStepUseCase.handler.mockResolvedValue(
          workflowWithoutSendApprove,
        );

        // Act
        const result = await useCase.handler(poiId, userId);

        // Assert
        expect(result).toEqual({ success: false });
      });

      it('should handle different workflow types with SEND_APPROVE action', async () => {
        // Arrange
        getCurrentWorkflowStepUseCase.handler.mockResolvedValue(mockWorkflowResponse);

        // Act
        const result = await useCase.handler(poiId, userId);

        // Assert
        expect(result).toEqual(mockWorkflowResponse);
        expect(result.data.availableActions).toContainEqual(
          expect.objectContaining({ actionCode: WorkflowAction.SEND_APPROVE }),
        );
      });
    });
  });
});
