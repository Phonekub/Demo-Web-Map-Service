import { Stream } from 'stream';
import { QuotaAnnualTarget } from '../../domain/quotaAnnualTarget';
import { QueryRunner } from 'typeorm';

export interface QuotaAnnualTargetRepositoryPort {
  getZoneAnnualTargetsByYear(year: string): Promise<QuotaAnnualTarget[]>;
  upsertZoneTargets(
    zonesTarget: { quotaConfigId: number; zoneId: number; target: number }[],
    userId: number,
    queryRunner?: QueryRunner,
  ): Promise<void>;
}
