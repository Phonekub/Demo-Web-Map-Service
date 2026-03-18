import { Inject, Injectable } from '@nestjs/common';
import { AnnounceRepository } from '../../../adapter/outbound/repositories/announce.repository';
import { AnnounceEntity } from '../../../adapter/outbound/repositories/entities/announce.entity';

@Injectable()
export class GetAnnounceUseCase {
  constructor(
    @Inject('AnnounceRepository')
    private readonly announceRepository: AnnounceRepository,
  ) {}

  async handler(): Promise<Partial<AnnounceEntity>[]> {
    const data = await this.announceRepository
      .getRepo()
      .find({ where: { is_deleted: 'N' }, order: { announceId: 'ASC' } });
    return data;
  }
}
