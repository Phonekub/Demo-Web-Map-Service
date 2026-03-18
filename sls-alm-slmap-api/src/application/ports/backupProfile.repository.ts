import { BackupProfile } from '../../domain/backupProfile';
import { BackupLocationEntity } from '../../adapter/outbound/repositories/entities/backupLocation.entity';

export interface BackupProfileRepositoryPort {
  getBackupProfileByPoiId(poiId: string): Promise<BackupProfile>;
  findByUid(uid: string): Promise<BackupLocationEntity | null>;
  findByPoiId(poiId: number): Promise<BackupLocationEntity | null>;
  createBackupProfile(data: any): Promise<any>;
  updateBackupProfile(uid: string, data: any): Promise<any>;
  getBackupLocationByPoiId(poiId: number): Promise<BackupLocationEntity>;
  updateBackupLocationFormLocNumber(
    poiId: number,
    formLocNumber: string,
    updateBy: number,
  ): Promise<void>;
}
