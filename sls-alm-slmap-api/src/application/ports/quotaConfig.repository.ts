import { YearConfigsResponse, QuotaConfigPair } from '../../domain/quotaConfig';
import { QueryRunner } from 'typeorm';

export interface QuotaConfigRepositoryPort {
  getYearConfigs(year: string): Promise<YearConfigsResponse>;
  getExistingPairs(year: string, queryRunner?: QueryRunner): Promise<QuotaConfigPair[]>;
  createConfig(
    year: string,
    locationType: string,
    quotaType: string,
    userId: number,
    queryRunner?: QueryRunner,
  ): Promise<number>;
  updateVisibility(
    configId: number,
    isVisible: string,
    userId: number,
    queryRunner?: QueryRunner,
  ): Promise<void>;
  findConfigId(
    year: string,
    locationType: string,
    quotaType: string,
    queryRunner?: QueryRunner,
  ): Promise<number | null>;
  findDistinctRoundsByYear(year: number): Promise<{ roundName: string }[]>;
}
