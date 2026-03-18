import { Inject, Injectable } from '@nestjs/common';
import { TradeareaRepositoryPort } from '../../ports/tradearea.repository';

@Injectable()
export class GetTradeareaByZoneUseCase {
  constructor(
    @Inject('TradeareaRepository')
    private readonly TradeareaRepository: TradeareaRepositoryPort,
  ) {}

  async handler(zoneCode: string) {
    return await this.TradeareaRepository.findByZone(zoneCode);
  }
}
