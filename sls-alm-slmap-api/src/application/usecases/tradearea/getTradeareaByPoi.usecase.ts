import { Inject, Injectable } from '@nestjs/common';
import { TradeareaRepositoryPort } from 'src/application/ports/tradearea.repository';

@Injectable()
export class GetTradeareaByPoiUseCase {
  constructor(
    @Inject('TradeareaRepository')
    private readonly tradeareaRepository: TradeareaRepositoryPort,
  ) {}

  async handler(poiId: number) {
    return await this.tradeareaRepository.findByPoi(poiId);
  }
}
