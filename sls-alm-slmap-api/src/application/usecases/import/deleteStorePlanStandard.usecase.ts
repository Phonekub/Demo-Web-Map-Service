import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { StorePlanStandardRepository } from '../../../adapter/outbound/repositories/storePlanStandard.repository';

@Injectable()
export class DeleteStorePlanStandardUseCase {
  constructor(
    @Inject('StorePlanStandardRepository')
    private readonly storePlanStandardRepository: StorePlanStandardRepository,
  ) {}

  async handler(file_id: number): Promise<{ success: boolean }> {
    // หา entity ตาม id
    const entity = await this.storePlanStandardRepository['storeplanstandardRepository'].findOne({ where: { file_id } });
    if (!entity) {
      throw new NotFoundException('StorePlanStandard not found');
    }
    entity.is_deleted = 'Y';
    await this.storePlanStandardRepository.create(entity);
    return { success: true };
  }
}
