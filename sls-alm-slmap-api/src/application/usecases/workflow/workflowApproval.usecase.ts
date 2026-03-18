import { Inject, Injectable } from '@nestjs/common';
import { WorkflowRepositoryPort } from '../../ports/workflow.repository';
import { GetCurrentWorkflowStepUseCase } from './getCurrentWorkflowStep.usecase';
import { WorkflowSendMailUseCase } from './workflowSendMail.usecase';
import {
  CurrentWorkflowStepData,
  WorkflowAction,
} from '../../../domain/currentWorkflowStep';
import { WfRouteEntity } from 'src/adapter/outbound/repositories/entities/wfRoute.entity';

export interface WorkflowApprovalUseCasePayload {
  refId: number;
  wfTransactionId: number;
  approvalAction: string;
  userId: number;
  templateData?: Record<string, string | number | boolean>;
  remark?: string;
  condition?: WorkflowUseCaseCondition;
  wfParameter?: any;
  bypassPermission?: boolean;
}

export interface WorkflowUseCaseCondition {
  zone?: string;
  subZone?: string;
}

export interface WorkflowApprovalUseCaseResult {
  success: boolean;
  error?: {
    code: string;
    message: unknown;
  };
  route?: WfRouteEntity;
  data?: CurrentWorkflowStepData;
}

@Injectable()
export class WorkflowApprovalUseCase {
  constructor(
    @Inject('WorkflowRepository')
    private readonly workflowRepository: WorkflowRepositoryPort,
    private readonly getCurrentWorkflowStepUseCase: GetCurrentWorkflowStepUseCase,
    private readonly workflowSendMailUseCase: WorkflowSendMailUseCase,
  ) {}

  async handler(
    payload: WorkflowApprovalUseCasePayload,
  ): Promise<WorkflowApprovalUseCaseResult> {
    const {
      refId,
      wfTransactionId,
      approvalAction,
      userId,
      remark,
      wfParameter,
      bypassPermission,
      condition,
    } = payload;

    try {
      if (!refId || !wfTransactionId || !approvalAction || !userId) {
        return {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'ข้อมูลไม่ครบถ้วน',
          },
        };
      }

      const transactionData =
        await this.workflowRepository.getWfIdByTransactionId(wfTransactionId);

      if (!transactionData) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'ไม่พบข้อมูล workflow transaction',
          },
        };
      }

      const { wfId, refId: refIdFromDb } = transactionData;

      const currentStepResult = await this.getCurrentWorkflowStepUseCase.handler(
        refIdFromDb,
        [wfId],
        userId,
      );

      if (!currentStepResult.success) {
        return {
          success: false,
          error: currentStepResult.error,
        };
      }

      const currentData = currentStepResult.data;
      const fullCurrentData = await this.workflowRepository.getCurrentWorkflowStep(
        refIdFromDb,
        [wfId],
        userId,
        undefined,
      );

      if (!fullCurrentData) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'ไม่พบข้อมูล',
          },
        };
      }

      const latestWfTransactionId = currentData.wfTransactionId;
      const wfStepId = currentData.wfStep.wfStepId;
      const wfStatusId = currentData.wfStatus.wfStatusId;
      const canAction = currentData.canAction;
      const availableActions = currentData.availableActions || [];

      if (latestWfTransactionId !== wfTransactionId) {
        return {
          success: false,
          error: {
            code: 'TRANSACTION_MISMATCH',
            message: 'ไม่สามารถดำเนินการได้ เนื่องจาก Workflow ไม่ตรงกัน',
          },
        };
      }

      if (!canAction && !bypassPermission) {
        return {
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: 'ไม่มีสิทธิ์ดำเนินการ',
          },
        };
      }

      const actionMatch = availableActions.find(
        (a: WorkflowAction) => a.actionCode === approvalAction,
      );

      if (!actionMatch && !bypassPermission) {
        return {
          success: false,
          error: {
            code: 'INVALID_ACTION',
            message: 'ไม่สามารถดำเนินการได้ ไม่พบ Action ที่ระบุ',
          },
        };
      }

      const route = await this.workflowRepository.getRouteByStepActionAndParameter(
        wfStepId,
        approvalAction,
        wfParameter,
      );

      console.log('role: ', route);

      if (!route) {
        return {
          success: false,
          error: {
            code: 'INVALID_ACTION',
            message: 'ไม่สามารถดำเนินการได้ ไม่พบ Route',
          },
        };
      }

      const nextStep = await this.workflowRepository.getWorkflowStepById(
        route.wfToStepId,
      );

      if (!nextStep) {
        return {
          success: false,
          error: {
            code: 'DB_ERROR',
            message: 'ไม่สามารถดำเนินการได้ ไม่พบขั้นตอนถัดไป',
          },
        };
      }

      let approveBy = '';

      const isStayInSameStep = wfStepId === route.wfToStepId;

      if (nextStep.stepOwnerType === 'USER') {
        if (isStayInSameStep) {
          approveBy = String(fullCurrentData.approveBy);
        } else {
          // Check if stepOwnerUser is specified
          if (nextStep.stepOwnerUser) {
            // กรณีมีหลาย user ID ให้กรองเฉพาะคนที่มีสิทธิ์ zone ตรง
            const allUserIds = nextStep.stepOwnerUser
              .split(',')
              .map((id) => parseInt(id.trim(), 10))
              .filter((id) => !isNaN(id));

            const filteredUserIds =
              await this.workflowRepository.filterUserIdsByZone(
                allUserIds,
                condition?.zone,
                condition?.subZone,
              );

            if (filteredUserIds.length === 0) {
              return {
                success: false,
                error: {
                  code: 'DB_ERROR',
                  message: 'ไม่พบผู้อนุมัติที่มีสิทธิ์ในโซนที่กำหนด',
                },
              };
            }

            approveBy = filteredUserIds.join(',');
          } else {
            // Fall back to finding user by stepOwnerRole (with zone filter)
            const userIdForApprove =
              await this.workflowRepository.findUserIdByStepOwnerRole(
                nextStep.stepOwnerRole,
                condition?.zone,
                condition?.subZone,
              );

            if (!userIdForApprove) {
              return {
                success: false,
                error: {
                  code: 'DB_ERROR',
                  message: 'ไม่พบผู้อนุมัติ',
                },
              };
            }

            approveBy = userIdForApprove;
          }
        }
      } else if (nextStep.stepOwnerType === 'ROLE') {
        approveBy = nextStep.stepOwnerRole;
      }

      await this.workflowRepository.updateWfTransaction(wfTransactionId, {
        wfStepId: route.wfToStepId,
        wfStatusId: route.wfToStatusId,
        approveBy: approveBy,
        approveType: nextStep.stepOwnerType,
        lastApproveRemark: remark ?? null,
        updateBy: userId,
        wfId: wfId,
      });

      await this.workflowRepository.createWfStepHistory({
        wfTransactionId: wfTransactionId,
        refId: refIdFromDb,
        wfStepId: wfStepId,
        wfStatusId: wfStatusId,
        wfActionId: route.wfActionId,
        remark: remark ?? null,
        isActive: 'Y',
        userId: userId,
      });

      return {
        success: true,
        route,
        data: currentData,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DB_ERROR',
          message: 'ไม่สามารถดำเนินการได้ ' + (error as any).message,
        },
      };
    }
  }
}
