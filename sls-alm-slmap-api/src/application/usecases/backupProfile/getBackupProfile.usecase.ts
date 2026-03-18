import { Inject, Injectable } from '@nestjs/common';
import { BackupProfileRepositoryPort } from '../../ports/backupProfile.repository';
import { BackupProfile } from '../../../domain/backupProfile';

@Injectable()
export class GetBackupProfileUseCase {
  constructor(
    @Inject('BackupProfileRepository')
    private readonly backupProfileRepository: BackupProfileRepositoryPort,
  ) {}

  async handler(poiId: string): Promise<BackupProfile> {
    return await this.backupProfileRepository.getBackupProfileByPoiId(poiId);
  }
}
