import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { DownloadFileDetailRepository } from '../../../adapter/outbound/repositories/downloadFileDetail.repository';
import { DownloadFileDetailEntity } from '../../../adapter/outbound/repositories/entities/downloadFileDetail.entity';

@Injectable()
export class DeleteKnowledgeUseCase {
  constructor(
    @Inject('DownloadFileDetailRepository')
    private readonly downloadFileDetailRepository: DownloadFileDetailRepository,
  ) {}

  async handler(file_id: number): Promise<boolean> {
    const repo = this.downloadFileDetailRepository.getRepo();
    const found = await repo.findOne({ where: { file_id, file_type: 'knowledge' } });
    if (!found) throw new NotFoundException('Knowledge not found');
    found.is_deleted = 'Y';
    await repo.save(found);
    return true;
  }
}
