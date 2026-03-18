import { TradeareaStatus } from '@common/enums/tradearea.enum';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { UpdateTradeareaDto } from 'src/adapter/inbound/dtos/tradearea.dto';
import { TradeareaRepositoryPort } from 'src/application/ports/tradearea.repository';
import { WorkflowApprovalUseCase } from '../workflow/workflowApproval.usecase';
import { WorkflowAction } from '@common/enums/action.enum';
import { CreateWorkflowTransactionUseCase } from '../workflow/createWorkflowTransaction.usecase';

@Injectable()
export class CreateChildTradeareaUseCase {
  constructor(
    @Inject('TradeareaRepository')
    private readonly tradeareaRepository: TradeareaRepositoryPort,
    private readonly workflowApprovalUseCase: WorkflowApprovalUseCase,
    private readonly createWorkflowTransactionUseCase: CreateWorkflowTransactionUseCase,
  ) {}

  async handler(
    tradeareaId: number,
    payload: UpdateTradeareaDto,
    userId: number,
  ): Promise<void> {
    const tradearea = await this.tradeareaRepository.findById(tradeareaId);

    if (!tradearea) {
      throw new Error(`Trade area with ID ${tradeareaId} not found`);
    }

    const tradeareaStatus = [TradeareaStatus.ACTIVE, TradeareaStatus.SCHEDULED];

    if (!tradeareaStatus.includes(tradearea.status as TradeareaStatus)) {
      throw new Error(`Trade area with ID ${tradeareaId} is not active or scheduled`);
    }
    const effectiveDate = payload.effectiveDate ? payload.effectiveDate : undefined;
    const childTradearea = await this.tradeareaRepository.create({
      parentId: tradeareaId,
      status: TradeareaStatus.DRAFT,
      effectiveDate,
      shape: {
        type: 'Polygon',
        coordinates:
          payload.shape.coordinates[0]?.length > 0
            ? payload.shape.coordinates
            : tradearea.shape.coordinates,
      },
      areaColor: payload.areaColor,
      comment: payload.comment,
      warning: payload.warning,
      updateUser: payload.updateUser || 'SYSTEM',
      poiId: tradearea.poiId,
    });

    await this.tradeareaRepository.update(tradeareaId, {
      deletedAt: new Date(payload.effectiveDate),
    });

    await this.workflowApprovalUseCase.handler({
      refId: tradeareaId,
      wfTransactionId: tradearea.wfTransactionId,
      approvalAction: WorkflowAction.EDIT,
      userId: userId,
    });

    const workflowTransaction = await this.createWorkflowTransactionUseCase.handler(
      2,
      childTradearea.id,
      userId,
    );

    console.log('Workflow Transaction Result:', workflowTransaction);

    if (!workflowTransaction.success) {
      throw new BadRequestException(workflowTransaction.error.message);
    }

    await this.tradeareaRepository.update(childTradearea.id, {
      wfTransactionId: workflowTransaction.data.wfTransactionId,
    });
  }
}
