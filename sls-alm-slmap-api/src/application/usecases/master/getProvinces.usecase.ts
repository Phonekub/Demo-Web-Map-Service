import { Inject, Injectable } from '@nestjs/common';
import { Dropdown } from '../../../domain/dropdown';
import { MasterRepositoryPort } from '../../ports/master.repository';

@Injectable()
export class GetProvincesUseCase {
  constructor(
    @Inject('MasterRepository')
    private readonly masterRepository: MasterRepositoryPort,
  ) {}

  async handler(countryCode?: string): Promise<Dropdown[]> {
    return await this.masterRepository.getProvinces(countryCode);
  }
}
