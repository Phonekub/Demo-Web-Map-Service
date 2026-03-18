import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { TradeareaRepositoryPort } from '../../ports/tradearea.repository';
import { UserRepositoryPort } from '../../ports/user.repository';
import { GetCurrentWorkflowStepUseCase } from '../workflow/getCurrentWorkflowStep.usecase';
import {
  WorkflowApprovalUseCase,
  WorkflowApprovalUseCasePayload,
  WorkflowApprovalUseCaseResult,
} from '../workflow/workflowApproval.usecase';
import {
  WorkflowSendMailUseCase,
  WorkflowSendMailUseCasePayload,
} from '../workflow/workflowSendMail.usecase';
import { WorkflowAction } from '../../../common/enums/action.enum';
import { TradeareaStatus } from '../../../common/enums/tradearea.enum';
import { TradeareaStep, WorkflowType } from '../../../common/enums/workflow.enum';
import { Builder } from 'builder-pattern';
import { Tradearea } from 'src/domain/tradearea';
import { WorkflowRepositoryPort } from 'src/application/ports/workflow.repository';

@Injectable()
export class UpdateTradeareaApproveUseCase {
  constructor(
    @Inject('TradeareaRepository')
    private readonly TradeareaRepository: TradeareaRepositoryPort,
    @Inject('UserRepository')
    private readonly userRepository: UserRepositoryPort,
    private readonly getCurrentWorkflowStepUseCase: GetCurrentWorkflowStepUseCase,
    private readonly workflowApprovalUseCase: WorkflowApprovalUseCase,
    private readonly workflowSendMailUseCase: WorkflowSendMailUseCase,
    @Inject('WorkflowRepository')
    private readonly workflowRepository: WorkflowRepositoryPort,
  ) {}

  async handler(
    tradeareaId: number,
    action: WorkflowAction,
    userId: number,
    remark?: string,
  ): Promise<void> {
    const tradearea = await this.TradeareaRepository.findById(tradeareaId);

    const workflowPayload = Builder<WorkflowApprovalUseCasePayload>()
      .refId(tradeareaId)
      .wfTransactionId(tradearea.wfTransactionId)
      .approvalAction(action)
      .userId(userId)
      .remark(remark)
      .build();

    const workflowApproval: WorkflowApprovalUseCaseResult =
      await this.workflowApprovalUseCase.handler(workflowPayload);

    if (workflowApproval.success === false) {
      throw new BadRequestException(`${workflowApproval.error?.message}`);
    }

    const currentStep = await this.getCurrentWorkflowStepUseCase.handler(
      tradeareaId,
      [
        WorkflowType.TRADE_AREA_DRAWING,
        WorkflowType.TRADE_AREA_EDIT,
        WorkflowType.TRADE_AREA_DELETE,
      ],
      userId,
    );

    if (!workflowApproval.route) {
      throw new BadRequestException('No workflow route found for sending email.');
    }

    const actionParams: ApproveActionParams = {
      data: workflowPayload,
      workflow: workflowApproval,
      tradearea,
      tradeareaId,
      currentStep,
      action,
      userId,
    };

    await this.handleAction(action, actionParams);

    await this.sendMail(tradearea, actionParams);
  }

  notApproveAction = async (params: ApproveActionParams): Promise<void> => {
    const { data, tradearea, tradeareaId, userId } = params;

    await this.TradeareaRepository.update(tradeareaId, {
      status: TradeareaStatus.INACTIVE,
    });

    if (tradearea.parentId) {
      const parentTradearea = await this.TradeareaRepository.findById(tradearea.parentId);

      await this.workflowRepository.updateWfTransaction(parentTradearea.wfTransactionId, {
        wfStepId: 201,
        wfStatusId: 206,
        approveBy: '1,5,6',
        approveType: 'ROLE',
        lastApproveRemark: data.remark,
        updateBy: userId,
        wfId: 2,
      });

      const wfStepHistoryData = {
        wfTransactionId: parentTradearea.wfTransactionId,
        refId: parentTradearea.id,
        wfStepId: 201,
        wfStatusId: 206,
        wfActionId: 8,
        remark: data.remark,
        isActive: 'Y',
        userId: userId,
      };

      await this.workflowRepository.createWfStepHistory(wfStepHistoryData);
    }
  };

  approveAction = async (params: ApproveActionParams): Promise<void> => {
    const { tradearea, tradeareaId, currentStep, action, userId } = params;

    const lastStepApprove = [TradeareaStep.DRAFT_COMPLETE, TradeareaStep.EDIT_COMPLETE];

    if (
      lastStepApprove.includes(currentStep.data.wfStep.wfStepId) &&
      action === WorkflowAction.APPROVE
    ) {
      await this.TradeareaRepository.update(tradeareaId, {
        status: TradeareaStatus.SCHEDULED,
      });

      if (tradearea.parentId) {
        await this.TradeareaRepository.update(tradearea.parentId, {
          deletedAt: new Date(tradearea.effectiveDate),
        });
      }
    }

    const lastStepDelete = [TradeareaStep.DELETE_COMPLETE];

    if (
      lastStepDelete.includes(currentStep.data.wfStep.wfStepId) &&
      action === WorkflowAction.APPROVE
    ) {
      await this.TradeareaRepository.deleteTradearea(tradeareaId, userId);
    }
  };

  // notApproveAction = async (params: ApproveActionParams): Promise<void> => {
  //   const { data, userId, tradearea } = params;

  //   if (tradearea.parentId) {
  //     const parentTradearea = await this.TradeareaRepository.findById(tradearea.parentId);

  //     await this.workflowRepository.updateWfTransaction(parentTradearea.wfTransactionId, {
  //       wfStepId: 201,
  //       wfStatusId: 206,
  //       approveBy: '1,5,6',
  //       approveType: 'ROLE',
  //       lastApproveRemark: data.remark,
  //       updateBy: userId,
  //       wfId: 2,
  //     });

  //     const wfStepHistoryData = {
  //       wfTransactionId: parentTradearea.wfTransactionId,
  //       refId: parentTradearea.id,
  //       wfStepId: 201,
  //       wfStatusId: 206,
  //       wfActionId: 8,
  //       remark: data.remark,
  //       isActive: 'Y',
  //       userId: userId,
  //     };

  //     await this.workflowRepository.createWfStepHistory(wfStepHistoryData);
  //   }
  // };

  sendMail = async (tradearea: Tradearea, params: ApproveActionParams): Promise<void> => {
    const { data, workflow, userId } = params;
    const route = workflow.route;
    const wfTransactionId = data.wfTransactionId;
    const approvalAction = data.approvalAction;

    const snakeToTitle = (text: string): string => {
      return text
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    const template = {
      LAYER_NAME: snakeToTitle(tradearea.tradeareaTypeName),
      STEP_NAME: route.wfStep.wfStepNameTH,
      LOG_REMARK: data.remark || '-',
      POI_ID: tradearea.poiId,
      ZONE: tradearea.zoneCode,
      SUB_ZONE: tradearea.subzoneCode,
      KEY_FIELD: `รหัสสาขา: ${tradearea.storeCode} ชื่อสาขา: ${tradearea.storeName}`,
      STORE_CODE: tradearea.storeCode,
      STORE_NAME: tradearea.storeName,
      TRADE_AREA_ID: data.refId,
      LINK: process.env.BASE_URL_WEB,
    };

    if (route.wfEmailDetailId) {
      try {
        const sendMailPayload = Builder<WorkflowSendMailUseCasePayload>()
          .wfTransactionId(wfTransactionId)
          .emailDetailId(route.wfEmailDetailId)
          .approvalAction(approvalAction)
          .userId(userId)
          .remark(data.remark || '-')
          .templateData(template)
          .build();

        await this.workflowSendMailUseCase.handler(sendMailPayload);
      } catch (emailError) {
        throw Error(emailError);
      }
    }
  };

  async handleAction(action: WorkflowAction, params: ApproveActionParams): Promise<void> {
    const actionMap = new Map<WorkflowAction, () => Promise<void>>([
      [WorkflowAction.APPROVE, () => this.approveAction(params)],
      [WorkflowAction.NOT_APPROVE, () => this.notApproveAction(params)],
    ]);

    const actionHandler = actionMap.get(action);
    if (!actionHandler) {
      throw new BadRequestException(`Unsupported action: ${action}`);
    }

    await actionHandler();
  }
}

interface ApproveActionParams {
  data: WorkflowApprovalUseCasePayload;
  workflow: WorkflowApprovalUseCaseResult;
  tradearea: Tradearea;
  tradeareaId: number;
  currentStep: Awaited<ReturnType<GetCurrentWorkflowStepUseCase['handler']>>;
  action: WorkflowAction;
  userId: number;
}
