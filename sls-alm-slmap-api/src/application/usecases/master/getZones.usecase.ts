import { Inject, Injectable } from '@nestjs/common';
import { MasterRepositoryPort } from '../../ports/master.repository';
import { ZoneMaster } from '../../../domain/zoneMaster';

@Injectable()
export class GetZonesUseCase {
  constructor(
    @Inject('MasterRepository')
    private readonly masterRepository: MasterRepositoryPort,
  ) {}

  async handler(orgId: string, category?: string): Promise<ZoneMaster[]> {
    return await this.masterRepository.getZones(orgId, category);
  }
}
