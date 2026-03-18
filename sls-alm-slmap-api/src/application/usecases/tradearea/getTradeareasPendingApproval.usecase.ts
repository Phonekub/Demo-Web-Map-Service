import { Injectable, Inject } from '@nestjs/common';
import { TradeareaRepositoryPort } from '../../ports/tradearea.repository';

@Injectable()
export class GetTradeareasPendingApprovalUseCase {
  constructor(
    @Inject('TradeareaRepository')
    private readonly TradeareaRepository: TradeareaRepositoryPort,
  ) {}

  async handler(wfId?: number, roleId?: number) {
    return await this.TradeareaRepository.findTradeareasPendingApproval(wfId, roleId);
  }
}
