import { Inject, Injectable } from '@nestjs/common';
import { TradeareaRepositoryPort } from '../../ports/tradearea.repository';
import { PoiTradearea } from '../../../domain/poiTradearea';

@Injectable()
export class FindPoiTradeareaUseCase {
  constructor(
    // @Inject('PoiRepository')
    // private readonly poiRepository: PoiRepositoryPort,
    @Inject('TradeareaRepository')
    private readonly tradeareaRepository: TradeareaRepositoryPort,
  ) {}

  async handler(tradeareaId: number): Promise<PoiTradearea | null> {
    return await this.tradeareaRepository.findPoiTradeareaById(tradeareaId);
  }
}
