import { Inject, Injectable } from '@nestjs/common';
import { Dropdown } from '../../../domain/dropdown';
import { MasterRepositoryPort } from '../../ports/master.repository';

@Injectable()
export class GetDistrictsUseCase {
  constructor(
    @Inject('MasterRepository')
    private readonly masterRepository: MasterRepositoryPort,
  ) {}

  async handler(provinceCode?: string): Promise<Dropdown[]> {
    return await this.masterRepository.getDistricts(provinceCode);
  }
}
