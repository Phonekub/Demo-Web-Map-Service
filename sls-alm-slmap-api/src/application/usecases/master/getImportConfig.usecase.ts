import { Inject, Injectable } from '@nestjs/common';
import { MasterRepositoryPort } from '../../ports/master.repository';
import { Dropdown } from '../../../domain/dropdown';

@Injectable()
export class GetImportConfigUseCase {
  constructor(
    @Inject('MasterRepository')
    private readonly masterRepository: MasterRepositoryPort,
  ) {}

  async handler(orgId?: string, importId?: string): Promise<Dropdown[]> {
    const results = await this.masterRepository.getImportConfig(orgId, importId);
    return results.map(item => ({
      ...item,
      orgId: orgId || item.orgId || ''
    }));
  }

  async getImportConfigById(importId: string) {
    return await this.masterRepository.getImportConfigById(importId);
  }

  async getImportConfigByFields(importId: string) {
    return await this.masterRepository.getImportFields(importId);
  }
}
