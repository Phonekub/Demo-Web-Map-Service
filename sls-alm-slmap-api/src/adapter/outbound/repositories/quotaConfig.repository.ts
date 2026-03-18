import { Injectable } from '@nestjs/common';
import { Repository, QueryRunner } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { QuotaConfigRepositoryPort } from '../../../application/ports/quotaConfig.repository';
import { QuotaConfigEntity } from './entities/quotaConfig.entity';
import { QuotaRoundEntity } from './entities/quotaRound.entity';
import { YearConfigsResponse, QuotaConfigPair } from '../../../domain/quotaConfig';
import { DataAccessException } from '../../../common/exceptions/quota.exception';

@Injectable()
export class QuotaConfigRepository implements QuotaConfigRepositoryPort {
  constructor(
    @InjectRepository(QuotaConfigEntity)
    private readonly repository: Repository<QuotaConfigEntity>,
  ) {}

  async getYearConfigs(year: string): Promise<YearConfigsResponse> {
    try {
      const results = await this.repository
        .createQueryBuilder('qc')
        .select(['qc.location_type as "locationType"', 'qc.quota_type as "quotaType"'])
        .where('qc.year = :year', { year })
        .andWhere('qc.is_visible = :isVisible', { isVisible: 'Y' })
        .getRawMany();

      // Extract unique location types and quota types
      const locationTypesSet = new Set<string>();
      const quotaTypesSet = new Set<string>();

      results.forEach((row) => {
        if (row.locationType) {
          locationTypesSet.add(row.locationType);
        }
        if (row.quotaType) {
          quotaTypesSet.add(row.quotaType);
        }
      });

      // Convert to arrays and sort
      const locationTypes = Array.from(locationTypesSet).sort();
      const quotaTypes = Array.from(quotaTypesSet).sort();

      return {
        year,
        locationTypes,
        quotaTypes,
      };
    } catch (error) {
      throw new DataAccessException(`Failed to get year configs: ${error.message}`);
    }
  }

  async getExistingPairs(
    year: string,
    queryRunner?: QueryRunner,
  ): Promise<QuotaConfigPair[]> {
    try {
      const qb = queryRunner
        ? queryRunner.manager.createQueryBuilder(QuotaConfigEntity, 'qc')
        : this.repository.createQueryBuilder('qc');

      const results = await qb
        .select([
          'qc.id as "id"',
          'qc.year as "year"',
          'qc.location_type as "locationType"',
          'qc.quota_type as "quotaType"',
          'qc.is_visible as "isVisible"',
        ])
        .where('qc.year = :year', { year })
        .getRawMany();

      return results.map((row) => ({
        id: row.id,
        year: row.year,
        locationType: row.locationType,
        quotaType: row.quotaType,
        isVisible: row.isVisible,
      }));
    } catch (error) {
      throw new DataAccessException(`Failed to get existing pairs: ${error.message}`);
    }
  }

  async createConfig(
    year: string,
    locationType: string,
    quotaType: string,
    userId: number,
    queryRunner?: QueryRunner,
  ): Promise<number> {
    try {
      const qb = queryRunner
        ? queryRunner.manager.createQueryBuilder()
        : this.repository.createQueryBuilder();

      const result = await qb
        .insert()
        .into(QuotaConfigEntity)
        .values({
          year,
          locationType,
          quotaType,
          isVisible: 'Y',
          createBy: userId,
          createDate: new Date(),
        })
        .execute();

      return result.identifiers[0].id;
    } catch (error) {
      throw new DataAccessException(`Failed to create config: ${error.message}`);
    }
  }

  async updateVisibility(
    configId: number,
    isVisible: string,
    userId: number,
    queryRunner?: QueryRunner,
  ): Promise<void> {
    try {
      const qb = queryRunner
        ? queryRunner.manager.createQueryBuilder()
        : this.repository.createQueryBuilder();

      await qb
        .update(QuotaConfigEntity)
        .set({
          isVisible,
          updateBy: userId,
          updateDate: new Date(),
        })
        .where('id = :configId', { configId })
        .execute();
    } catch (error) {
      throw new DataAccessException(`Failed to update visibility: ${error.message}`);
    }
  }

  async findConfigId(
    year: string,
    locationType: string,
    quotaType: string,
    queryRunner?: QueryRunner,
  ): Promise<number | null> {
    try {
      const qb = queryRunner
        ? queryRunner.manager.createQueryBuilder(QuotaConfigEntity, 'qc')
        : this.repository.createQueryBuilder('qc');

      const result = await qb
        .select('qc.id', 'id')
        .where('qc.year = :year', { year })
        .andWhere('qc.location_type = :locationType', { locationType })
        .andWhere('qc.quota_type = :quotaType', { quotaType })
        .getRawOne();

      return result ? result.id : null;
    } catch (error) {
      throw new DataAccessException(`Failed to find config ID: ${error.message}`);
    }
  }

  async findDistinctRoundsByYear(year: number): Promise<{ roundName: string }[]> {
    try {
      const results = await this.repository
        .createQueryBuilder('qc')
        .innerJoin(QuotaRoundEntity, 'qr', 'qr.quotaConfigId = qc.id')
        .select('qr.name', 'roundName')
        .where('qc.year = :year', { year: year.toString() })
        .andWhere('qr.quota_round_status_id != 4')
        .distinct(true)
        .orderBy('qr.name', 'ASC')
        .getRawMany();

      return results;
    } catch (error) {
      throw new DataAccessException(`Failed to find rounds by year: ${error.message}`);
    }
  }
}
