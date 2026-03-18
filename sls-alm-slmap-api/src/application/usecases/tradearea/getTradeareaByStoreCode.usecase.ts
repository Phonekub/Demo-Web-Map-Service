import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { TradeareaRepositoryPort } from '../../ports/tradearea.repository';
import { Tradearea } from '../../../domain/tradearea';

@Injectable()
export class GetTradeareaByStoreCodeUseCase {
  constructor(
    @Inject('TradeareaRepository')
    private readonly TradeareaRepository: TradeareaRepositoryPort,
  ) {}

  async handler(storeCode: string, type: string): Promise<Tradearea[]> {
    if (!storeCode || storeCode.trim() === '') {
      throw new BadRequestException('Store code is required');
    }

    const tradeareaType = await this.TradeareaRepository.findTradeareaTypeByName(type);

    return await this.TradeareaRepository.findByStoreCode(storeCode, tradeareaType.id);
  }
}
