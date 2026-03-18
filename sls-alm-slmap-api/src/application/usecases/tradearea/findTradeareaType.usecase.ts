import { Inject, Injectable } from '@nestjs/common';
import { TradeareaRepositoryPort } from '../../ports/tradearea.repository';
import { TradeareaTypeEntity } from '../../../adapter/outbound/repositories/entities/tradeareaType.entity';

@Injectable()
export class FindTradeareaTypeUseCase {
  constructor(
    @Inject('TradeareaRepository')
    private readonly tradeareaRepository: TradeareaRepositoryPort,
  ) {}

  async handler(): Promise<TradeareaTypeEntity[]> {
    return this.tradeareaRepository.findTradeareaTypes();
  }
}
