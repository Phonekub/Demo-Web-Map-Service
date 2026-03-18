import { Injectable, Inject } from '@nestjs/common';
import { AnnounceRepository } from '../../../adapter/outbound/repositories/announce.repository';
import { AnnounceEntity } from '../../../adapter/outbound/repositories/entities/announce.entity';

@Injectable()
export class UpdateAnnounceIsShowUseCase {
  constructor(
    @Inject('AnnounceRepository')
    private readonly announceRepository: AnnounceRepository,
  ) {}

  async handler(
    announceId: number,
    isShow: string,
    updateBy: string
  ): Promise<AnnounceEntity | null> {
    const repo = this.announceRepository.getRepo();
    const announce = await repo.findOne({ where: { announceId } });
    if (!announce) return null;
    announce.isShow = isShow;
    announce.updateBy = updateBy;
    announce.updateDate = new Date();
    await repo.save(announce);
    return announce;
  }
}
