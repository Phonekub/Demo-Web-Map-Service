import { Inject, Injectable } from '@nestjs/common';
import { TradeareaRepositoryPort } from '../../ports/tradearea.repository';

@Injectable()
export class CheckPointInTradeareaUseCase {
  constructor(
    @Inject('TradeareaRepository')
    private readonly TradeareaRepository: TradeareaRepositoryPort,
  ) {}

  async handler(lng: number, lat: number) {
    return await this.TradeareaRepository.findByPoint(lng, lat);
  }
}
