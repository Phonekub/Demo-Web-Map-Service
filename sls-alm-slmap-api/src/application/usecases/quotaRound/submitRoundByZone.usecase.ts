import { Inject, Injectable, Logger } from '@nestjs/common';
import { QuotaRoundRepositoryPort } from '../../ports/quotaRound.repository';
import { QuotaAllocationRepositoryPort } from '../../ports/quotaAllocation.repository';
import { MasterRepositoryPort } from '../../ports/master.repository';
import {
  QuotaException,
  QuotaNotFoundException,
} from '../../../common/exceptions/quota.exception';
import { CreateWorkflowTransactionUseCase } from '../../usecases/workflow/createWorkflowTransaction.usecase';
import { WorkflowApprovalUseCase } from '../../usecases/workflow/workflowApproval.usecase';
import { GetCurrentWorkflowStepUseCase } from '../../usecases/workflow/getCurrentWorkflowStep.usecase';
import { WorkflowSendMailUseCase } from '../../usecases/workflow/workflowSendMail.usecase';
import {
  getThaiMonthName,
  buildEmailConnection,
  allocationMeetsRoundCompletionCriteria,
  formatDateDDMMYYYY,
} from '../quota/helpers/quotaWorkflowHelpers';
import { Language } from '../../../common/enums/language.enum';

@Injectable()
export class SubmitRoundByZoneUseCase {
  private readonly logger = new Logger(SubmitRoundByZoneUseCase.name);

  constructor(
    @Inject('QuotaRoundRepository')
    private readonly quotaRoundRepo: QuotaRoundRepositoryPort,

    @Inject('MasterRepository')
    private readonly masterRepo: MasterRepositoryPort,

    @Inject('QuotaAllocationRepository')
    private readonly quotaAllocationRepo: QuotaAllocationRepositoryPort,

    private readonly createWorkFlowUsecase: CreateWorkflowTransactionUseCase,
    private readonly workflowApprovalUseCase: WorkflowApprovalUseCase,
    private readonly getCurrentWorkflowStepUseCase: GetCurrentWorkflowStepUseCase,
    private readonly workflowSendMailUseCase: WorkflowSendMailUseCase,
  ) {}

  async handler(roundId: number, zoneId: number, userId: number) {
    try {
      const allocationEntity = await this.quotaRoundRepo.submitQuotaRoundByZone(
        roundId,
        zoneId,
        userId,
      );

      const currentStepRaw = await this.getCurrentWorkflowStepUseCase.handler(
        allocationEntity.id,
        [5],
        userId,
      );

      let wfParameter = '00';
      const config = await this.quotaRoundRepo.getQuotaConfigByRoundId(roundId);

      if (!config) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Quota config not found',
          },
        };
      }

      // Get round details for email template
      const rounds = await this.quotaRoundRepo.getRoundsByConfigId(config.id);
      const round = rounds.find((r) => r.id === roundId);

      // Get zone code from zone master
      const zones = await this.masterRepo.getZones('2', 'MAIN');
      const zone = zones.find((z) => z.zoneId === zoneId);
      const zoneCode = zone?.zoneCode || zoneId.toString();

      if (allocationEntity.assignedQuota > 0) {
        wfParameter = config.locationType;
      }

      if (!currentStepRaw.success && currentStepRaw.error.code !== 'NOT_FOUND') {
        return {
          success: false,
          error: {
            code: currentStepRaw.error.code,
            message: currentStepRaw.error.message,
          },
        };
      } else if (!currentStepRaw.success && currentStepRaw.error.code === 'NOT_FOUND') {
        const workFlowCreateResult = await this.createWorkFlowUsecase.handler(
          5,
          allocationEntity.id,
          userId,
        );
        if (workFlowCreateResult.success) {
          const approvalResult = await this.workflowApprovalUseCase.handler({
            refId: allocationEntity.id,
            wfTransactionId: workFlowCreateResult.data.wfTransactionId,
            approvalAction: 'SEND_QUOTA',
            userId: userId,
            wfParameter: { QUOTA_LOCATION_TYPE: wfParameter },
          });

          if (!approvalResult.success) {
            return {
              success: false,
              error: {
                code: approvalResult.error.code,
                message: approvalResult.error.message,
              },
            };
          }

          // Send email after approval
          if (approvalResult.route?.wfEmailDetailId) {
            try {
              // ดึงชื่อ LOCATION_TYPE
              let locationTypeName = '';
              if (config.locationType) {
                const code = await this.masterRepo.getCommonCodeName(
                  'QUOTA_LOCATION_TYPE',
                  Language.TH,
                  config.locationType,
                );
                locationTypeName = code?.name || '';
              }
              await this.workflowSendMailUseCase.handler({
                wfTransactionId: workFlowCreateResult.data.wfTransactionId,
                emailDetailId: approvalResult.route.wfEmailDetailId,
                approvalAction: 'SEND_QUOTA',
                userId: userId,
                templateData: {
                  YEAR: config.year,
                  ROUND: round?.name || '',
                  ZONE: zoneCode,
                  START_MONTH: round?.startMonth
                    ? getThaiMonthName(round.startMonth)
                    : '',
                  END_MONTH: round?.endMonth ? getThaiMonthName(round.endMonth) : '',
                  DUE_DATE: formatDateDDMMYYYY(round?.dueDate),
                  WEB_LINK: process.env.BASE_URL_WEB || '',
                  LOCATION_TYPE: locationTypeName,
                },
                connection: buildEmailConnection(zoneCode),
              });
            } catch (emailError) {
              this.logger.error('Email sending failed (SEND_QUOTA):', emailError);
              // Continue even if email fails
            }
          }
        } else {
          return {
            success: false,
            error: {
              code: workFlowCreateResult.error.code,
              message: workFlowCreateResult.error.message,
            },
          };
        }
      } else if (currentStepRaw.success) {
        if (allocationEntity.assignedQuota > 0) {
          const approvalResult = await this.workflowApprovalUseCase.handler({
            refId: allocationEntity.id,
            wfTransactionId: currentStepRaw.data.wfTransactionId,
            approvalAction: 'SEND_EDIT',
            userId: userId,
            wfParameter: { QUOTA_LOCATION_TYPE: wfParameter },
            bypassPermission: true,
          });

          if (!approvalResult.success) {
            return {
              success: false,
              error: {
                code: approvalResult.error.code,
                message: approvalResult.error.message,
              },
            };
          }

          // Send email after approval
          if (approvalResult.route?.wfEmailDetailId) {
            try {
              // ดึงชื่อ LOCATION_TYPE
              let locationTypeName = '';
              if (config.locationType) {
                const code = await this.masterRepo.getCommonCodeName(
                  'QUOTA_LOCATION_TYPE',
                  Language.TH,
                  config.locationType,
                );
                locationTypeName = code?.name || '';
              }
              await this.workflowSendMailUseCase.handler({
                wfTransactionId: currentStepRaw.data.wfTransactionId,
                emailDetailId: approvalResult.route.wfEmailDetailId,
                approvalAction: 'SEND_EDIT',
                userId: userId,
                templateData: {
                  YEAR: config.year,
                  ROUND: round?.name || '',
                  ZONE: zoneCode,
                  START_MONTH: round?.startMonth
                    ? getThaiMonthName(round.startMonth)
                    : '',
                  END_MONTH: round?.endMonth ? getThaiMonthName(round.endMonth) : '',
                  DUE_DATE: formatDateDDMMYYYY(round?.dueDate),
                  WEB_LINK: process.env.BASE_URL_WEB || '',
                  LOCATION_TYPE: locationTypeName,
                },
                connection: buildEmailConnection(zoneCode),
              });
            } catch (emailError) {
              this.logger.error('Email sending failed (SEND_EDIT):', emailError);
              // Continue even if email fails
            }
          }
        } else if (allocationEntity.assignedQuota === 0) {
          const approvalResult = await this.workflowApprovalUseCase.handler({
            refId: allocationEntity.id,
            wfTransactionId: currentStepRaw.data.wfTransactionId,
            approvalAction: 'SEND_EDIT',
            userId: userId,
            wfParameter: { QUOTA_LOCATION_TYPE: wfParameter },
            bypassPermission: true,
          });

          if (!approvalResult.success) {
            return {
              success: false,
              error: {
                code: approvalResult.error.code,
                message: approvalResult.error.message,
              },
            };
          }
        }
      }

      // Check if all allocations meet the criteria to mark the quota round as completed
      try {
        const allocationsForCheck =
          await this.quotaAllocationRepo.getQuotaAllocationsForRoundStatusCheck(roundId);
        const allMeet = allocationsForCheck.every(allocationMeetsRoundCompletionCriteria);

        if (allMeet) {
          await this.quotaAllocationRepo.updateQuotaRoundStatus(roundId, 3);
        }
      } catch (e) {
        this.logger.error(
          'Error while evaluating quota_round completion after submitRoundByZone:',
          e,
        );
      }

      return {
        success: true,
        code: 'ZONE_ROUND_SUBMITTED',
        message: 'Quota zone submitted successfully',
      };
    } catch (error) {
      if (error instanceof QuotaException) {
        return {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        };
      }

      return {
        success: false,
        error: {
          code: error.code || 'DATA_ACCESS_ERROR',
          message: error.message || 'An error occurred while submitting quota data',
        },
      };
    }
  }
}
