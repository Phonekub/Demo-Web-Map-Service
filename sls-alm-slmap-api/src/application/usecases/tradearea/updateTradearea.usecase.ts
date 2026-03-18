import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TradeareaRepositoryPort } from '../../ports/tradearea.repository';
import { Tradearea } from '../../../domain/tradearea';
import { UpdateTradeareaDto } from '../../../adapter/inbound/dtos/tradearea.dto';
import { WorkflowSendMailUseCase } from '../workflow/workflowSendMail.usecase';
import { WorkflowApprovalUseCase } from '../workflow/workflowApproval.usecase';
import { GetCurrentWorkflowStepUseCase } from '../workflow/getCurrentWorkflowStep.usecase';

@Injectable()
export class UpdateTradeareaUseCase {
  constructor(
    @Inject('TradeareaRepository')
    private readonly TradeareaRepository: TradeareaRepositoryPort,
    private readonly getCurrentWorkflowStepUseCase: GetCurrentWorkflowStepUseCase,
    private readonly workflowApprovalUseCase: WorkflowApprovalUseCase,
    private readonly workflowSendMailUseCase: WorkflowSendMailUseCase,
  ) {}

  async handler(payload: UpdateTradeareaDto & { id: number }): Promise<Tradearea> {
    // ✅ Validate trade area exists
    const existingTradearea = await this.TradeareaRepository.findById(payload.id);
    if (!existingTradearea) {
      throw new NotFoundException(`Trade area with ID ${payload.id} not found`);
    }

    console.log('effectiveDate', payload.effectiveDate);
    const effectiveDate = payload.effectiveDate ? payload.effectiveDate : undefined;
    const Tradearea = await this.TradeareaRepository.update(payload.id, {
      refStoreCode: payload.refStoreCode,
      zoneCode: payload.zoneCode?.toUpperCase(),
      subzoneCode: payload.subzoneCode,
      status: payload.status,
      effectiveDate,
      shape: {
        type: 'Polygon',
        coordinates:
          payload.shape.coordinates[0]?.length > 0
            ? payload.shape.coordinates
            : existingTradearea.shape.coordinates,
      },
      storeName: payload.storeName,
      areaColor: payload.areaColor,
      comment: payload.comment,
      warning: payload.warning,
      updateUser: payload.updateUser || 'SYSTEM',
    });

    if (!Tradearea) {
      throw new NotFoundException(`Failed to update trade area with ID ${payload.id}`);
    }

    return Tradearea;
  }
}
