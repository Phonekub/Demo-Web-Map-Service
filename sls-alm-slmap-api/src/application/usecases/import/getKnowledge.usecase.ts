import { Inject, Injectable } from '@nestjs/common';
import { DownloadFileDetailRepository } from '../../../adapter/outbound/repositories/downloadFileDetail.repository';
import { DownloadFileDetailEntity } from '../../../adapter/outbound/repositories/entities/downloadFileDetail.entity';

@Injectable()
export class GetKnowledgeUseCase {
  constructor(
    @Inject('DownloadFileDetailRepository')
    private readonly downloadFileDetailRepository: DownloadFileDetailRepository,
  ) {}
  async findById(id: number): Promise<DownloadFileDetailEntity | null> {
    return await this.downloadFileDetailRepository.findById(Number(id));
  }

  async handler(): Promise<Partial<DownloadFileDetailEntity>[]> {
    const data = await this.downloadFileDetailRepository.findAll();
    return data;
  }

  async getByRoleId(roleId: string): Promise<Partial<DownloadFileDetailEntity>[]> {
    const data = await this.downloadFileDetailRepository.findByRoleId(Number(roleId));
    return data;
  }
}
