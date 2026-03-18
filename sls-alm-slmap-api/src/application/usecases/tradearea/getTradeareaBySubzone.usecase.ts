import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { TradeareaRepositoryPort } from '../../ports/tradearea.repository';
import { Tradearea } from '../../../domain/tradearea';

@Injectable()
export class GetTradeareaBySubzoneUseCase {
  constructor(
    @Inject('TradeareaRepository')
    private readonly TradeareaRepository: TradeareaRepositoryPort,
  ) {}

  async handler(zoneCode: string, subzoneCode: string): Promise<Tradearea[]> {
    // Validate inputs
    if (!zoneCode?.trim()) {
      throw new BadRequestException('Zone code is required');
    }

    if (!subzoneCode?.trim()) {
      throw new BadRequestException('Subzone code is required');
    }

    return this.TradeareaRepository.findBySubzone(
      zoneCode.trim().toUpperCase(),
      subzoneCode.trim(),
    );
  }
}
