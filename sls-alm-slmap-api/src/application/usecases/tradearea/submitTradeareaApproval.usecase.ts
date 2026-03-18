import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { TradeareaRepositoryPort } from '../../ports/tradearea.repository';
import { GetCurrentWorkflowStepUseCase } from '../workflow/getCurrentWorkflowStep.usecase';
import { UserRepositoryPort } from '../../ports/user.repository';
import { WorkflowApprovalUseCase } from '../workflow/workflowApproval.usecase';
import {
  WorkflowSendMailUseCase,
  WorkflowSendMailUseCasePayload,
} from '../workflow/workflowSendMail.usecase';
import { WorkflowAction } from '../../../common/enums/action.enum';
import { Builder } from 'builder-pattern';

export interface ISubmitTradeareaApprovalRequest {
  TradeareaId: number;
  submittedBy: string;
  comments?: string;
}

export interface ISubmitTradeareaApprovalResponse {
  success: boolean;
  message: string;
  TradeareaId: number;
  approvalStatus: string;
  submittedAt: Date;
}

@Injectable()
export class SubmitTradeareaApprovalUseCase {
  constructor(
    @Inject('TradeareaRepository')
    private readonly TradeareaRepository: TradeareaRepositoryPort,
    @Inject('UserRepository')
    private readonly userRepository: UserRepositoryPort,
    private readonly getCurrentWorkflowStepUseCase: GetCurrentWorkflowStepUseCase,
    private readonly workflowApprovalUseCase: WorkflowApprovalUseCase,
    private readonly workflowSendMailUseCase: WorkflowSendMailUseCase,
  ) {}

  async handler(TradeareaId: number, userId: number): Promise<void> {
    // Validate trade area exists
    if (!TradeareaId) {
      throw new BadRequestException('Trade Area ID is required');
    }

    const Tradearea = await this.TradeareaRepository.findById(TradeareaId);

    const workflowApproval = await this.workflowApprovalUseCase.handler({
      refId: TradeareaId,
      wfTransactionId: Tradearea.wfTransactionId,
      approvalAction: WorkflowAction.SEND_APPROVE,
      userId,
    });

    if (workflowApproval.success === false) {
      throw new BadRequestException(`${workflowApproval.error?.message}`);
    }

    await this.TradeareaRepository.insertTradeareaHistory(
      TradeareaId,
      userId.toString(),
      'SUBMITTED',
      'CREATE',
    );

    const route = workflowApproval.route;


    const snakeToTitle = (text: string): string => {
      return text
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    const template = {
      LAYER_NAME: snakeToTitle(Tradearea.tradeareaTypeName),
      STEP_NAME: route.wfStep.wfStepNameTH,
      LOG_REMARK: '-',
      POI_ID: Tradearea.poiId,
      ZONE: Tradearea.zoneCode,
      SUB_ZONE: Tradearea.subzoneCode,
      KEY_FIELD: `รหัสสาขา: ${Tradearea.storeCode} ชื่อสาขา: ${Tradearea.storeName}`,
      STORE_CODE: Tradearea.storeCode,
      STORE_NAME: Tradearea.storeName,
      TRADE_AREA_ID: TradeareaId,
      LINK: process.env.BASE_URL_WEB,
    };

    if (route.wfEmailDetailId) {
      try {
        const builder = Builder<WorkflowSendMailUseCasePayload>()
          .wfTransactionId(Tradearea.wfTransactionId)
          .emailDetailId(route.wfEmailDetailId)
          .approvalAction(WorkflowAction.SEND_APPROVE)
          .userId(userId)
          .templateData(template);
        const sendMailPayload = builder.build();
        await this.workflowSendMailUseCase.handler(sendMailPayload);
      } catch (emailError) {
        throw Error(emailError);
      }
    }
  }
}
