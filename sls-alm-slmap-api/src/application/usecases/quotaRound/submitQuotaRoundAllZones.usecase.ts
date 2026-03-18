import { Inject, Injectable, Logger } from '@nestjs/common';
import { QuotaRoundRepositoryPort } from '../../ports/quotaRound.repository';
import { QuotaAllocationRepositoryPort } from '../../ports/quotaAllocation.repository';
import { MasterRepositoryPort } from '../../ports/master.repository';
import {
  QuotaException,
  QuotaNotFoundException,
} from '../../../common/exceptions/quota.exception';
import { CreateWorkflowTransactionUseCase } from '../workflow/createWorkflowTransaction.usecase';
import { WorkflowApprovalUseCase } from '../workflow/workflowApproval.usecase';
import { GetCurrentWorkflowStepUseCase } from '../workflow/getCurrentWorkflowStep.usecase';
import { WorkflowSendMailUseCase } from '../workflow/workflowSendMail.usecase';
import {
  getThaiMonthName,
  buildEmailConnection,
  allocationMeetsRoundCompletionCriteria,
  formatDateDDMMYYYY,
} from '../quota/helpers/quotaWorkflowHelpers';
import { Language } from '../../../common/enums/language.enum';
import { all } from 'axios';
import { skip } from 'node:test';

@Injectable()
export class SubmitQuotaRoundAllZonesUseCase {
  private readonly logger = new Logger(SubmitQuotaRoundAllZonesUseCase.name);

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

  async handler(roundId: number, userId: number, zoneToNotProcess: number[]) {
    let skipAllo = 0;
    try {
      const allocationEntity = await this.quotaRoundRepo.getAllocationsByRoundId(roundId);
      const config = await this.quotaRoundRepo.getQuotaConfigByRoundId(roundId);
      if (!config) {
        throw new QuotaNotFoundException('Quota config not found');
      }

      // Get round details for email template
      const rounds = await this.quotaRoundRepo.getRoundsByConfigId(config.id);
      const round = rounds.find((r) => r.id === roundId);

      // Get all zones
      const zones = await this.masterRepo.getZones('2', 'MAIN');

      for (const allocation of allocationEntity) {
        if (zoneToNotProcess.includes(allocation.zoneId)) {
          skipAllo += 1;
          continue;
        }

        const zone = zones.find((z) => z.zoneId === allocation.zoneId);
        const zoneCode = zone?.zoneCode || allocation.zoneId.toString();
        const currentStepRaw = await this.getCurrentWorkflowStepUseCase.handler(
          allocation.id,
          [5],
          userId,
        );

        if (!currentStepRaw.success && currentStepRaw.error.code === 'NOT_FOUND') {
          const wfTransaction = await this.createWorkFlowUsecase.handler(
            5,
            allocation.id,
            userId,
          );

          if (!wfTransaction.success) {
            throw new QuotaException(
              wfTransaction.error.code as string,
              wfTransaction.error.message as string,
            );
          }

          // ส่ง SEND_QUOTA หลังสร้าง wf ใหม่
          const wfParam = allocation.assignedQuota > 0 ? config.locationType : '00';
          const approvalResult = await this.workflowApprovalUseCase.handler({
            refId: allocation.id,
            wfTransactionId: wfTransaction.data.wfTransactionId,
            approvalAction: 'SEND_QUOTA',
            userId: userId,
            wfParameter: { QUOTA_LOCATION_TYPE: wfParam },
          });

          if (!approvalResult.success) {
            throw new QuotaException(
              approvalResult.error.code as string,
              approvalResult.error.message as string,
            );
          }

          // Send email after approval
          if (approvalResult.route?.wfEmailDetailId) {
            try {
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
                wfTransactionId: wfTransaction.data.wfTransactionId,
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
            }
          }
        } else if (currentStepRaw.success) {
          // ข้าม zone ที่ wfComplete ไม่ใช่ 'W' (เช่น 'Y' = อนุมัติแล้ว, 'C' = ปิดแล้ว)
          if (currentStepRaw.data.wfStatus?.wfComplete !== 'W') {
            continue;
          }

          const wfParam = allocation.assignedQuota > 0 ? config.locationType : '00';
          const approvalResult = await this.workflowApprovalUseCase.handler({
            refId: allocation.id,
            wfTransactionId: currentStepRaw.data.wfTransactionId,
            approvalAction: 'SEND_EDIT',
            userId: userId,
            wfParameter: { QUOTA_LOCATION_TYPE: wfParam },
            bypassPermission: true,
          });

          if (!approvalResult.success) {
            throw new QuotaException(
              approvalResult.error.code as string,
              approvalResult.error.message as string,
            );
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
              this.logger.error('Email sending failed:', emailError);
              // Continue even if email fails
            }
          }
        }
      }

      // await Promise.all(workflowPromises);
      await this.quotaRoundRepo.submitQuotaRoundAllZones(roundId, userId);

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
          'Error while evaluating quota_round completion after submitQuotaRoundAllZones:',
          e,
        );
      }
      return {
        success: true,
        code: 'ALL_ZONES_ROUND_SUBMITTED',
        message: 'Quota all zones submitted successfully',
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
