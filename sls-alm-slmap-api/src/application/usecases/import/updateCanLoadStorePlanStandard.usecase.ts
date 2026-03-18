import { Injectable, Inject } from '@nestjs/common';
import { StorePlanStandardRepository } from '../../../adapter/outbound/repositories/storePlanStandard.repository';
import { StorePlanStandardEntity } from '../../../adapter/outbound/repositories/entities/storePlanStandard.entity';

@Injectable()
export class UpdateCanLoadStorePlanStandardUseCase {
  constructor(
    @Inject('StorePlanStandardRepository')
    private readonly storePlanStandardRepository: StorePlanStandardRepository,
  ) {}

  async handler(
    file_id: number,
    can_load: string,
  ): Promise<StorePlanStandardEntity | null> {
    return await this.storePlanStandardRepository.updateCanLoad(file_id, can_load);
  }
}
