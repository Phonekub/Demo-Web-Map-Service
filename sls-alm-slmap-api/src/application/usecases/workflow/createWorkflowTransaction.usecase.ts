import { Inject, Injectable } from '@nestjs/common';
import { WorkflowRepositoryPort } from '../../ports/workflow.repository';

@Injectable()
export class CreateWorkflowTransactionUseCase {
  constructor(
    @Inject('WorkflowRepository')
    private readonly workflowRepository: WorkflowRepositoryPort,
  ) {}

  async handler(wfId: number, refId: number, userId: number) {
    try {
      if (!wfId || !refId || !userId) {
        return {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'ข้อมูลไม่ครบถ้วน',
          },
        };
      }

      const exists = await this.workflowRepository.checkWfTransactionExists(wfId, refId);

      if (exists) {
        return {
          success: false,
          error: {
            code: 'ALREADY_EXISTS',
            message: 'Workflow transaction นี้มีอยู่แล้ว ไม่สามารถสร้างซ้ำได้',
          },
        };
      }

      const workflow = await this.workflowRepository.getWorkflowById(wfId);

      if (!workflow) {
        return {
          success: false,
          error: {
            code: 'INVALID_WF',
            message: 'ไม่สามารถสร้าง Workflow ได้',
          },
        };
      }

      const firstStep = await this.workflowRepository.getWorkflowStepById(
        workflow.firstStepId,
      );

      if (!firstStep) {
        return {
          success: false,
          error: {
            code: 'INVALID_WF',
            message: 'ไม่สามารถสร้าง Workflow ได้',
          },
        };
      }

      const hasPermission = await this.workflowRepository.checkUserPermission(
        userId,
        firstStep.stepOwnerRole,
      );

      if (!hasPermission) {
        return {
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: 'ไม่มีสิทธิ์ดำเนินการ',
          },
        };
      }

      let approveBy: string;
      if (firstStep.stepOwnerType === 'USER') {
        // Check if stepOwnerUser is specified
        if (firstStep.stepOwnerUser) {
          approveBy = firstStep.stepOwnerUser;
        } else {
          // Fall back to using current userId
          approveBy = userId.toString();
        }
      } else if (firstStep.stepOwnerType === 'ROLE') {
        approveBy = firstStep.stepOwnerRole;
      } else {
        approveBy = '';
      }

      const wfTransactionData = {
        wfId: wfId,
        refId: refId,
        wfStepId: workflow.firstStepId,
        wfStatusId: workflow.firstStatusId,
        approveBy: approveBy,
        approveType: firstStep.stepOwnerType,
        lastApproveRemark: '',
        isActive: 'Y',
        createBy: userId,
        updateBy: userId,
      };

      const wfTransactionId =
        await this.workflowRepository.createWfTransaction(wfTransactionData);

      const wfStepHistoryData = {
        wfTransactionId: wfTransactionId,
        refId: refId,
        wfStepId: workflow.firstStepId,
        wfStatusId: workflow.firstStatusId,
        wfActionId: workflow.firstActionId,
        remark: '',
        isActive: 'Y',
        userId: userId,
      };

      await this.workflowRepository.createWfStepHistory(wfStepHistoryData);

      return {
        success: true,
        data: {
          wfTransactionId: wfTransactionId,
        },
      };
    } catch (error) {
      console.error('Error in CreateWorkflowTransactionUseCase:', error);
      return {
        success: false,
        error: {
          code: 'DB_ERROR',
          message: 'ไม่สามารถสร้างรายการได้',
        },
      };
    }
  }
}
