import { Inject, Injectable } from '@nestjs/common';
import { WorkflowRepositoryPort } from '../../ports/workflow.repository';

@Injectable()
export class GetWorkflowHistoryUseCase {
  constructor(
    @Inject('WorkflowRepository')
    private readonly workflowRepository: WorkflowRepositoryPort,
  ) {}

  async handler(refId: number, wfId?: number, language?: string) {
    if (!refId) {
      throw new Error('refId is required');
    }

    try {
      const result = await this.workflowRepository.getWorkflowHistory(
        refId,
        wfId,
        language,
      );

      if (!result) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'ไม่พบข้อมูล',
          },
        };
      }

      return {
        success: true,
        data: {
          refId: result.refId,
          histories: result.histories.map((history) => ({
            id: history.id,
            wfTransactionId: history.wfTransactionId,
            wfStep: {
              wfStepId: history.wfStepId,
              wfStepName: history.wfStepName,
            },
            wfStatus: {
              wfStatusId: history.wfStatusId,
              wfStatusName: history.wfStatusName,
            },
            wfAction: {
              wfActionId: history.wfActionId,
              wfActionName: history.wfActionName,
            },
            remark: history.remark,
            createBy: {
              userId: history.createBy,
              name: history.createByName,
            },
            createDate: history.createDate,
          })),
        },
      };
    } catch (e) {
      return {
        success: false,
        error: {
          code: 'DB_ERROR',
          message: 'ไม่สามารถดึงข้อมูลได้',
        },
      };
    }
  }
}
