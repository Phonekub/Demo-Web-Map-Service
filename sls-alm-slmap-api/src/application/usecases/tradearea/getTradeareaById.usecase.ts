import {
  Inject,
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { TradeareaRepositoryPort } from '../../ports/tradearea.repository';

@Injectable()
export class GetTradeareaByIdUseCase {
  constructor(
    @Inject('TradeareaRepository')
    private readonly TradeareaRepository: TradeareaRepositoryPort,
  ) {}

  async handler(id: number) {
    if (!id || id <= 0) {
      throw new BadRequestException('Invalid trade area ID');
    }

    const Tradearea = await this.TradeareaRepository.findById(id);

    if (!Tradearea) {
      throw new NotFoundException(`Trade area with ID ${id} not found`);
    }

    return Tradearea;
  }
}
