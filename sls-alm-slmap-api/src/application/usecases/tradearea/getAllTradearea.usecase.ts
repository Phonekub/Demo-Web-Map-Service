import { Inject, Injectable } from '@nestjs/common';
import { TradeareaRepositoryPort } from '../../ports/tradearea.repository';

@Injectable()
export class GetAllTradeareaUseCase {
  constructor(
    @Inject('TradeareaRepository')
    private readonly TradeareaRepository: TradeareaRepositoryPort,
  ) {}

  async handler(
    search: string,
    page?: number,
    sortBy?: string,
    order?: 'asc' | 'desc',
    limit?: number,
    status?: string,
  ) {
    const Tradeareas = await this.TradeareaRepository.findAll(
      search,
      page,
      sortBy,
      order,
      limit,
      status,
    );
    return Tradeareas || { data: [], total: 0 };
  }
}
