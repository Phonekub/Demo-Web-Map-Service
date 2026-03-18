import { Inject, Injectable } from '@nestjs/common';
import { QuotaRoundRepositoryPort } from '../../ports/quotaRound.repository';
import { MasterRepositoryPort } from '../../ports/master.repository';
import { CreateWorkflowTransactionUseCase } from '../workflow/createWorkflowTransaction.usecase';
import { WorkflowApprovalUseCase } from '../workflow/workflowApproval.usecase';
import { GetCurrentWorkflowStepUseCase } from '../workflow/getCurrentWorkflowStep.usecase';
import { WorkflowSendMailUseCase } from '../workflow/workflowSendMail.usecase';
import {
  QuotaException,
  QuotaNotFoundException,
} from '../../../common/exceptions/quota.exception';
import { QuotaRoundEntity } from '../../../adapter/outbound/repositories/entities/quotaRound.entity';
import { QuotaConfigEntity } from '../../../adapter/outbound/repositories/entities/quotaConfig.entity';
import { QuotaAllocationEntity } from '../../../adapter/outbound/repositories/entities/quotaAllocation.entity';
import { QuotaAllocationItemEntity } from '../../../adapter/outbound/repositories/entities/quotaAllocationItem.entity';
import {
  getThaiMonthName,
  buildEmailConnection,
} from '../quota/helpers/quotaWorkflowHelpers';
import { Language } from '../../../common/enums/language.enum';
@Injectable()
export class SubmitReviewRoundsByZoneUseCase {
  constructor(
    @Inject('QuotaRoundRepository')
    private readonly quotaRoundRepo: QuotaRoundRepositoryPort,

    @Inject('MasterRepository')
    private readonly masterRepo: MasterRepositoryPort,

    private readonly createWorkFlowUsecase: CreateWorkflowTransactionUseCase,
    private readonly workflowApprovalUseCase: WorkflowApprovalUseCase,
    private readonly getCurrentWorkflowStepUseCase: GetCurrentWorkflowStepUseCase,
    private readonly workflowSendMailUseCase: WorkflowSendMailUseCase,
  ) {}

  async handler(
    year: number,
    locationType: string,
    quotaType: string,
    zoneId: number,
    userId: number,
  ) {
    try {
      const config = await this.quotaRoundRepo.getQuotaConfig(
        year,
        locationType,
        quotaType,
      );
      if (!config) throw new QuotaNotFoundException(`Quota config not found error`);

      const allRounds = await this.quotaRoundRepo.getRoundsByConfigId(config.id);

      const existingReviewRounds = allRounds.find((r) => r.isReview === 'Y');
      const lastRound = allRounds
        .filter((r) => r.isReview === 'N')
        .sort((a, b) => b.seq - a.seq)[0];

      if (!lastRound) {
        return { success: true, message: 'No source round to review' };
      }

      let targetReviewRound: QuotaRoundEntity;
      if (!existingReviewRounds) {
        targetReviewRound = new QuotaRoundEntity();
        const configShell = new QuotaConfigEntity();
        configShell.id = config.id;
        targetReviewRound.quotaConfig = configShell;
        targetReviewRound.name = `ทบทวน`;
        targetReviewRound.quotaConfigId = config.id;
        targetReviewRound.startMonth = lastRound.startMonth;
        targetReviewRound.endMonth = lastRound.endMonth;
        targetReviewRound.dueDate = lastRound.dueDate;
        targetReviewRound.seq = (lastRound.seq || 0) + 1;
        targetReviewRound.isReview = 'Y';
        targetReviewRound.quotaRoundStatusId = 2;
        targetReviewRound.allocations = [];
      } else {
        targetReviewRound = existingReviewRounds;
      }

      const isZoneAlreadySubmitted = targetReviewRound.allocations?.some(
        (a) => a.zoneId === zoneId,
      );
      if (isZoneAlreadySubmitted) {
        return { success: true, message: 'Zone already submitted for review' };
      }

      const sourceAllocation = lastRound.allocations.find((a) => a.zoneId === zoneId);
      if (!sourceAllocation) {
        return { success: true, message: 'No source allocation found for this zone' };
      }

      // สร้าง Allocation ใหม่
      const newAllocation = new QuotaAllocationEntity();
      newAllocation.assignedQuota = sourceAllocation.assignedQuota;
      newAllocation.reservedQuota = sourceAllocation.reservedQuota;
      newAllocation.zoneId = zoneId;
      newAllocation.createBy = userId;
      newAllocation.updateBy = userId;

      newAllocation.quotaAllocationItems = sourceAllocation.quotaAllocationItems?.map(
        (item) => {
          const newItem = new QuotaAllocationItemEntity();
          newItem.seq = item.seq;
          newItem.type = item.type;
          newItem.poiId = item.poiId;
          newItem.openType = item.openType;
          newItem.openMonth = item.openMonth;
          return newItem;
        },
      );

      targetReviewRound.allocations.push(newAllocation);
      const roundRes = await this.quotaRoundRepo.createRound([targetReviewRound]);

      if (!roundRes || roundRes.length === 0) throw new Error('Create round failed');

      const zones = await this.masterRepo.getZones('2', 'MAIN');
      const zone = zones.find((z) => z.zoneId === zoneId);
      const zoneCode = zone?.zoneCode || zoneId.toString();

      const targetAlloc = roundRes[0].allocations.find((a) => a.zoneId === zoneId);

      if (targetAlloc) {
        try {
          const workflowTransac = await this.createWorkFlowUsecase.handler(
            5,
            targetAlloc.id,
            userId,
          );
          if (workflowTransac.success) {
            const approvalResult = await this.workflowApprovalUseCase.handler({
              refId: targetAlloc.id,
              wfTransactionId: workflowTransac.data.wfTransactionId,
              approvalAction: 'SEND_REVIEW',
              userId: userId,
              wfParameter: { QUOTA_LOCATION_TYPE: locationType },
            });

            if (approvalResult.success && approvalResult.route?.wfEmailDetailId) {
              let locationTypeName = '';
              if (config.locationType) {
                const code = await this.masterRepo.getCommonCodeName(
                  'QUOTA_LOCATION_TYPE',
                  Language.TH,
                  config.locationType.value,
                );
                locationTypeName = code?.name || '';
              }

              await this.workflowSendMailUseCase.handler({
                wfTransactionId: workflowTransac.data.wfTransactionId,
                emailDetailId: approvalResult.route.wfEmailDetailId,
                approvalAction: 'SEND_REVIEW',
                userId: userId,
                templateData: {
                  YEAR: year.toString(),
                  ROUND: roundRes[0].name,
                  ZONE: zoneCode,
                  START_MONTH: roundRes[0].startMonth
                    ? getThaiMonthName(roundRes[0].startMonth)
                    : '',
                  END_MONTH: roundRes[0].endMonth
                    ? getThaiMonthName(roundRes[0].endMonth)
                    : '',
                  DUE_DATE: roundRes[0].dueDate
                    ? new Date(roundRes[0].dueDate).toISOString()
                    : '',
                  WEB_LINK: process.env.BASE_URL_WEB || '',
                  LOCATION_TYPE: locationTypeName,
                },
                connection: buildEmailConnection(zoneCode),
              });
            }
          }
        } catch (taskError) {
          console.error('Workflow task error:', taskError);
        }
      }

      return {
        success: true,
        code: 'ZONE_REVIEW_ROUND_SUBMITTED',
        message: 'Quota review round for zone submitted successfully',
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
          message:
            error.message || 'An error occurred while submitting review quota data',
        },
      };
    }
  }
}
