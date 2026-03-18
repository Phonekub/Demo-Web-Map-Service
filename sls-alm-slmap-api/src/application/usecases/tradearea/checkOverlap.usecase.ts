import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { TradeareaRepositoryPort } from '../../ports/tradearea.repository';
import { CheckOverlapDto } from '../../../adapter/inbound/dtos/tradearea.dto';
import { Tradearea } from '../../../domain/tradearea';
import * as _ from 'lodash';
@Injectable()
export class CheckOverlapUseCase {
  constructor(
    @Inject('TradeareaRepository')
    private readonly TradeareaRepository: TradeareaRepositoryPort,
  ) {}

  async handler(dto: CheckOverlapDto): Promise<{
    hasOverlap: boolean;
    overlappingAreas: Tradearea[];
  }> {
    const excludeId = [];

    if (dto.excludeId) {
      excludeId.push(dto.excludeId);
      const tradearea = await this.TradeareaRepository.findById(dto.excludeId);
      if (!tradearea) {
        throw new BadRequestException(`Trade area with ID ${dto.excludeId} not found`);
      }
      if (!_.isNil(tradearea.parentId)) {
        excludeId.push(tradearea.parentId);
      }
    }

    const overlapping = await this.TradeareaRepository.findOverlapping(
      dto.shape,
      excludeId,
      dto.tradeareaTypeName,
    );

    return {
      hasOverlap: overlapping.length > 0,
      overlappingAreas: overlapping,
    };
  }
}
