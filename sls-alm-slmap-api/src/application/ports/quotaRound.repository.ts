import { QuotaAllocationEntity } from '../../adapter/outbound/repositories/entities/quotaAllocation.entity';
import { QuotaConfigEntity } from '../../adapter/outbound/repositories/entities/quotaConfig.entity';
import { QuotaRoundEntity } from '../../adapter/outbound/repositories/entities/quotaRound.entity';
import { Language } from '../../common/enums/language.enum';
import { QuotaConfig } from '../../domain/quotaConfig';
import { QuotaQueryParams } from '../../domain/quotaQueryParams';
import { QuotaAllocation, QuotaRound } from '../../domain/quotaRound';

export interface QuotaRoundRepositoryPort {
  getQuotaConfig(
    year: number,
    locationType: string,
    quotaType: string,
    language?: Language,
  ): Promise<QuotaConfig>;
  getRoundsWithAllocations(
    year: number,
    locationType: string,
    quotaType: string,
    language?: Language,
  ): Promise<QuotaRound[]>;

  createRound(rounds: QuotaRoundEntity[]): Promise<QuotaRoundEntity[]>;

  updateRound(round: QuotaRound, userId?: number): Promise<number>;

  deleteRound(roundId: number, userId: number): Promise<void>;

  submitQuotaRoundByZone(
    roundId: number,
    zoneId: number,
    userId: number,
  ): Promise<QuotaAllocationEntity>;

  submitQuotaRoundAllZones(
    roundId: number,
    userId: number,
  ): Promise<QuotaAllocationEntity[]>;

  closeQuotaConfig(
    year: number,
    locationType: string,
    quotaType: string,
    userId: number,
  ): Promise<void>;

  getLasetRoundSeq(quotaConfigId: number): Promise<number>;

  getRoundsByConfigIdAndZone(
    quotaConfigId: number,
    zoneId: number,
  ): Promise<QuotaRoundEntity[]>;

  getRoundsByConfigId(quotaConfigId: number): Promise<QuotaRoundEntity[]>;

  getQuotaConfigByRoundId(roundId: number): Promise<QuotaConfigEntity>;

  getAllocationsByRoundId(roundId: number): Promise<QuotaAllocationEntity[]>;

  // submitQuotaRound(roundId: number): Promise<void>;
}
