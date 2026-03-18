import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner } from 'typeorm';
import { QuotaAnnualTargetRepositoryPort } from '../../../application/ports/quotaAnnualTarget.repository';
import { QuotaAnnualTarget } from '../../../domain/quotaAnnualTarget';
import { QuotaAnnualTargetEntity } from './entities/quotaAnnualTarget.entity';
import { DataAccessException } from '../../../common/exceptions/quota.exception';

@Injectable()
export class QuotaAnnualTargetRepository implements QuotaAnnualTargetRepositoryPort {
  constructor(
    @InjectRepository(QuotaAnnualTargetEntity)
    private readonly repository: Repository<QuotaAnnualTargetEntity>,
  ) {}

  async getZoneAnnualTargetsByYear(year: string): Promise<QuotaAnnualTarget[]> {
    try {
      const results = await this.repository
        .createQueryBuilder('qat')
        .innerJoin('quota_config', 'qc', 'qat.quota_config_id = qc.id')
        .select('qat.id', 'id')
        .addSelect('qat.quota_config_id', 'quotaConfigId')
        .addSelect('qc.location_type', 'locationType')
        .addSelect('qc.quota_type', 'quotaType')
        .addSelect('qat.zone_id', 'zoneId')
        .addSelect('qat.target', 'target')
        .where('qc.year = :year', { year })
        .orderBy('qat.zone_id', 'ASC')
        .getRawMany();

      return results.map((row) => ({
        id: row.id,
        quotaConfigId: row.quotaConfigId,
        locationType: row.locationType,
        quotaType: row.quotaType,
        zoneId: row.zoneId,
        target: row.target,
      }));
    } catch (error) {
      throw new DataAccessException(
        `Failed to get zone annual targets: ${error.message}`,
      );
    }
  }

  async upsertZoneTargets(
    zonesTarget: { quotaConfigId: number; zoneId: number; target: number }[],
    userId: number,
    queryRunner?: QueryRunner,
  ): Promise<void> {
    try {
      const manager = queryRunner ? queryRunner.manager : this.repository.manager;

      const qb = queryRunner
        ? queryRunner.manager.createQueryBuilder()
        : this.repository.createQueryBuilder();

      const zoneToInserts = zonesTarget.map((zone) => ({
        quotaConfigId: zone.quotaConfigId,
        zoneId: zone.zoneId,
        target: zone.target,
        createBy: userId,
        createDate: new Date(),
        updateBy: userId,
        updateDate: new Date(),
      }));

      await qb
        .insert()
        .into(QuotaAnnualTargetEntity)
        .values(zoneToInserts)
        .orUpdate(['target', 'update_by', 'update_date'], ['quota_config_id', 'zone_id'])
        .execute();
    } catch (error) {
      throw new DataAccessException(`Failed to upsert zone targets: ${error.message}`);
    }
  }
}
