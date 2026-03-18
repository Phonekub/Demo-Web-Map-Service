import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { TradeareaRepositoryPort } from 'src/application/ports/tradearea.repository';
import { GetCurrentWorkflowStepUseCase } from '../workflow/getCurrentWorkflowStep.usecase';
import { WorkflowType } from '@common/enums/workflow.enum';
import {
  WorkflowApprovalUseCase,
  WorkflowApprovalUseCasePayload,
} from '../workflow/workflowApproval.usecase';
import { Builder } from 'builder-pattern';
import { Tradearea } from 'src/domain/tradearea';
import {
  WorkflowSendMailUseCase,
  WorkflowSendMailUseCasePayload,
} from '../workflow/workflowSendMail.usecase';
import { WorkflowAction } from '@common/enums/action.enum';

@Injectable()
export class DeleteTradeareaUseCase {
  constructor(
    @Inject('TradeareaRepository')
    private readonly tradeareaRepository: TradeareaRepositoryPort,
    private readonly getCurrentWorkflowStepUseCase: GetCurrentWorkflowStepUseCase,
    private readonly workflowApprovalUseCase: WorkflowApprovalUseCase,
    private readonly workflowSendMailUseCase: WorkflowSendMailUseCase,
  ) {}

  async handler(tradeareaId: number, userId: number) {
    const tradearea = await this.tradeareaRepository.findById(tradeareaId);

    if (!tradearea) {
      throw new BadRequestException('Tradearea not found');
    }

    const mapStatus = new Map([
      [
        'draft',
        async () => {
          await this.isDraft(tradeareaId, userId);
        },
      ],
      [
        'active',
        async () => {
          await this.isActive(tradeareaId, WorkflowAction.DELETE, tradearea, userId);
        },
      ],
      [
        'scheduled',
        async () => {
          await this.isActive(tradeareaId, WorkflowAction.DELETE, tradearea, userId);
        },
      ],
    ]);

    const func = mapStatus.get(tradearea.status.toLowerCase());

    if (func) {
      await func();
    }
  }

  async isDraft(tradeareaId: number, userId: number): Promise<void> {
    const currentStep = await this.getCurrentWorkflowStepUseCase.handler(
      tradeareaId,
      [WorkflowType.TRADE_AREA_DRAWING, WorkflowType.TRADE_AREA_EDIT],
      userId,
    );

    const lastStepApprove = [101, 104, 201, 204];

    if (!lastStepApprove.includes(currentStep.data.wfStep.wfStepId)) {
      throw new BadRequestException('Only draft tradeareas can be deleted');
    }

    await this.tradeareaRepository.deleteTradearea(tradeareaId, userId);
  }

  async isActive(
    tradeareaId: number,
    action: WorkflowAction,
    tradearea: Tradearea,
    userId: number,
  ): Promise<void> {
    const builder = Builder<WorkflowApprovalUseCasePayload>()
      .refId(tradeareaId)
      .wfTransactionId(tradearea.wfTransactionId)
      .approvalAction(action)
      .userId(userId);

    const workflowPayload = builder.build();

    const workflowApproval = await this.workflowApprovalUseCase.handler(workflowPayload);

    if (workflowApproval.success === false) {
      throw new BadRequestException(`${workflowApproval.error?.message}`);
    }

    const route = workflowApproval.route;
    const wfTransactionId = workflowPayload.wfTransactionId;
    const approvalAction = workflowPayload.approvalAction;

    if (!route) {
      throw new BadRequestException('No workflow route found for sending email.');
    }
    const snakeToTitle = (text: string): string => {
      return text
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    const template = {
      LAYER_NAME: snakeToTitle(tradearea.tradeareaTypeName),
      STEP_NAME: route.wfStep.wfStepNameTH,
      LOG_REMARK: '',
      POI_ID: tradearea.poiId,
      ZONE: tradearea.zoneCode,
      SUB_ZONE: tradearea.subzoneCode,
      KEY_FIELD: `รหัสสาขา: ${tradearea.storeCode} ชื่อสาขา: ${tradearea.storeName}`,
      STORE_CODE: tradearea.storeCode,
      STORE_NAME: tradearea.storeName,
      TRADE_AREA_ID: tradeareaId,
      LINK: process.env.BASE_URL_WEB,
    };

    if (route.wfEmailDetailId) {
      try {
        const builder = Builder<WorkflowSendMailUseCasePayload>()
          .wfTransactionId(wfTransactionId)
          .emailDetailId(route.wfEmailDetailId)
          .approvalAction(approvalAction)
          .userId(userId)
          .remark('')
          .templateData(template);
        const sendMailPayload = builder.build();
        await this.workflowSendMailUseCase.handler(sendMailPayload);
      } catch (emailError) {
        throw Error(emailError);
      }
    }
  }
}
