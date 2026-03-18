import { Inject, Injectable } from '@nestjs/common';
import { QuotaRoundRepositoryPort } from '../../ports/quotaRound.repository';
import { MasterRepositoryPort } from '../../ports/master.repository';
import { CreateWorkflowTransactionUseCase } from '../workflow/createWorkflowTransaction.usecase';
import { WorkflowApprovalUseCase } from '../workflow/workflowApproval.usecase';
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
export class SubmitReviewRoundsAllZonesUseCase {
  constructor(
    @Inject('QuotaRoundRepository')
    private readonly quotaRoundRepo: QuotaRoundRepositoryPort,
    @Inject('MasterRepository')
    private readonly masterRepo: MasterRepositoryPort,
    private readonly createWorkFlowUsecase: CreateWorkflowTransactionUseCase,
    private readonly workflowApprovalUseCase: WorkflowApprovalUseCase,
    private readonly workflowSendMailUseCase: WorkflowSendMailUseCase,
  ) {}

  async handler(year: number, locationType: string, quotaType: string, userId: number) {
    try {
      const config = await this.quotaRoundRepo.getQuotaConfig(
        year,
        locationType,
        quotaType,
      );
      if (!config) throw new QuotaNotFoundException(`Quota config not found error`);

      const allRounds = await this.quotaRoundRepo.getRoundsByConfigId(config.id);
      const existingReviewRound = allRounds.find((r) => r.isReview === 'Y');
      const lastNormalRound = allRounds
        .filter((r) => r.isReview === 'N')
        .sort((a, b) => b.seq - a.seq)[0];

      if (!lastNormalRound) {
        throw new QuotaException('NOT_FOUND', 'ไม่พบรอบปกติที่จะนำมาทำข้อมูลทบทวน');
      }

      let targetReviewRound: QuotaRoundEntity;

      if (!existingReviewRound) {
        targetReviewRound = new QuotaRoundEntity();
        const configShell = new QuotaConfigEntity();
        configShell.id = config.id;
        targetReviewRound.quotaConfig = configShell;
        targetReviewRound.quotaConfigId = config.id;

        targetReviewRound.name = `ทบทวน`;
        targetReviewRound.startMonth = lastNormalRound.startMonth;
        targetReviewRound.endMonth = lastNormalRound.endMonth;
        targetReviewRound.dueDate = lastNormalRound.dueDate;
        targetReviewRound.seq = lastNormalRound.seq + 1;
        targetReviewRound.isReview = 'Y';
        targetReviewRound.quotaRoundStatusId = 1;
        targetReviewRound.createBy = userId;
        targetReviewRound.updateBy = userId;
        targetReviewRound.allocations = [];
      } else {
        targetReviewRound = existingReviewRound;
      }

      const currentZoneIdsInReview = new Set(
        targetReviewRound.allocations?.map((a) => a.zoneId) || [],
      );

      const newZoneIdsAdded: number[] = [];

      for (const sourceAlloc of lastNormalRound.allocations) {
        if (currentZoneIdsInReview.has(sourceAlloc.zoneId)) {
          continue;
        }

        const newAlloc = new QuotaAllocationEntity();
        newAlloc.zoneId = sourceAlloc.zoneId;
        newAlloc.assignedQuota = sourceAlloc.assignedQuota;
        newAlloc.reservedQuota = sourceAlloc.reservedQuota;
        newAlloc.createBy = userId;
        newAlloc.updateBy = userId;

        if (sourceAlloc.quotaAllocationItems?.length > 0) {
          newAlloc.quotaAllocationItems = sourceAlloc.quotaAllocationItems.map((item) => {
            const newItem = new QuotaAllocationItemEntity();
            newItem.seq = item.seq;
            newItem.type = item.type;
            newItem.poiId = item.poiId;
            newItem.openType = item.openType;
            newItem.openMonth = item.openMonth;
            newItem.createBy = userId;
            newItem.updateBy = userId;
            return newItem;
          });
        }

        targetReviewRound.allocations.push(newAlloc);
        newZoneIdsAdded.push(sourceAlloc.zoneId);
      }

      if (newZoneIdsAdded.length === 0) {
        return { success: true, message: 'ทุก Zone ถูกส่งทบทวนครบถ้วนแล้ว' };
      }
      const savedRounds = await this.quotaRoundRepo.createRound([targetReviewRound]);
      const savedReviewRound = savedRounds[0];

      const zones = await this.masterRepo.getZones('2', 'MAIN');
      let locationTypeName = '';

      if (config.locationType) {
        const code = await this.masterRepo.getCommonCodeName(
          'QUOTA_LOCATION_TYPE',
          Language.TH,
          config.locationType.value,
        );
        locationTypeName = code?.name || '';
      }
      const tasks = savedReviewRound.allocations
        .filter((a) => newZoneIdsAdded.includes(a.zoneId))
        .map(async (allocation) => {
          try {
            const zone = zones.find((z) => z.zoneId === allocation.zoneId);
            const zoneCode = zone?.zoneCode || allocation.zoneId.toString();

            const wfResult = await this.createWorkFlowUsecase.handler(
              5,
              allocation.id,
              userId,
            );

            if (wfResult.success) {
              const approval = await this.workflowApprovalUseCase.handler({
                refId: allocation.id,
                wfTransactionId: wfResult.data.wfTransactionId,
                approvalAction: 'SEND_REVIEW',
                userId: userId,
                wfParameter: { QUOTA_LOCATION_TYPE: locationType },
              });

              if (approval.success && approval.route?.wfEmailDetailId) {
                await this.workflowSendMailUseCase
                  .handler({
                    wfTransactionId: wfResult.data.wfTransactionId,
                    emailDetailId: approval.route.wfEmailDetailId,
                    approvalAction: 'SEND_REVIEW',
                    userId: userId,
                    templateData: {
                      YEAR: year.toString(),
                      ROUND: savedReviewRound.name,
                      ZONE: zoneCode,
                      START_MONTH: savedReviewRound.startMonth
                        ? getThaiMonthName(savedReviewRound.startMonth)
                        : '',
                      END_MONTH: savedReviewRound.endMonth
                        ? getThaiMonthName(savedReviewRound.endMonth)
                        : '',
                      DUE_DATE: savedReviewRound.dueDate
                        ? new Date(savedReviewRound.dueDate).toISOString()
                        : '',
                      WEB_LINK: process.env.BASE_URL_WEB || '',
                      LOCATION_TYPE: locationTypeName,
                    },
                    connection: buildEmailConnection(zoneCode),
                  })
                  .catch((e) => console.error(`Email error for zone ${zoneCode}:`, e));
              }
            }
          } catch (error) {
            console.error(`Workflow error for zone ID ${allocation.zoneId}:`, error);
          }
        });

      await Promise.all(tasks);

      return {
        success: true,
        code: 'ALL_ZONES_REVIEW_SUBMITTED',
        message: `ส่งข้อมูลทบทวนเพิ่มสำหรับ ${newZoneIdsAdded.length} Zone เรียบร้อยแล้ว`,
      };
    } catch (error) {
      if (error instanceof QuotaException) {
        return { success: false, error: { code: error.code, message: error.message } };
      }
      return {
        success: false,
        error: {
          code: error.code || 'DATA_ACCESS_ERROR',
          message: error.message || 'เกิดข้อผิดพลาดในการส่งข้อมูลทบทวนทั้งหมด',
        },
      };
    }
  }
}
