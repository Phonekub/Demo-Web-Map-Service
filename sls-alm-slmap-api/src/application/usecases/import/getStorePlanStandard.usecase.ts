import { Injectable, Inject } from '@nestjs/common';
import { StorePlanStandardRepository } from '../../../adapter/outbound/repositories/storePlanStandard.repository';
import { StorePlanStandardEntity } from '../../../adapter/outbound/repositories/entities/storePlanStandard.entity';

@Injectable()
export class GetStorePlanStandardUseCase {
  constructor(
    @Inject('StorePlanStandardRepository')
    private readonly storeplanstandardRepository: StorePlanStandardRepository,
  ) {}
  // for S3 integration
  async findById(id: number): Promise<StorePlanStandardEntity | null> {
    return await this.storeplanstandardRepository.findById(id);
  }

  async handler(): Promise<Partial<StorePlanStandardEntity>[]> {
    const data = await this.storeplanstandardRepository.findAll();
    return data.map(
      ({ file_id, filename, version, upload_date, upload_by, filepath, can_load }) => ({
        file_id,
        filename,
        version,
        upload_date,
        upload_by,
        filepath,
        can_load,
      }),
    );
  }
}
