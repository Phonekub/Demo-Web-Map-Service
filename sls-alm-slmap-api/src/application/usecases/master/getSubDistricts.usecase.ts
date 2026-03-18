import { Inject, Injectable } from '@nestjs/common';
import { Dropdown } from '../../../domain/dropdown';
import { MasterRepositoryPort } from '../../ports/master.repository';

@Injectable()
export class GetSubDistrictsUseCase {
  constructor(
    @Inject('MasterRepository')
    private readonly masterRepository: MasterRepositoryPort,
  ) {}

  async handler(districtCode?: string): Promise<Dropdown[]> {
    return await this.masterRepository.getSubDistricts({ districtCode });
  }
}
