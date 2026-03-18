import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { AnnounceRepository } from '../../../adapter/outbound/repositories/announce.repository';

@Injectable()
export class DeleteAnnounceUseCase {
  constructor(
    @Inject('AnnounceRepository')
    private readonly announceRepository: AnnounceRepository,
  ) {}

  async handler(id: number): Promise<boolean> {
    const repo = this.announceRepository.getRepo();
    const found = await repo.findOne({ where: { announceId: id } });
    if (!found) throw new NotFoundException('Announce not found');
    found.is_deleted = 'Y';
    await repo.save(found);
    return true;
  }
}
