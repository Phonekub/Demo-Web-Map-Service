import { Inject, Injectable, Logger } from '@nestjs/common';
import { QuotaRoundRepositoryPort } from '../../ports/quotaRound.repository';
import { QuotaRound } from '../../../domain/quotaRound';
import { QuotaQueryParams } from '../../../domain/quotaQueryParams';
import { MasterRepository } from '../../../adapter/outbound/repositories/master.repository';
import { Language } from '../../../common/enums/language.enum';
import {
  CatalogNotFoundException,
  QuotaException,
  QuotaNotFoundException,
} from '../../../common/exceptions/quota.exception';
import { QuotaAllocationEntity } from '../../../adapter/outbound/repositories/entities/quotaAllocation.entity';
import { QuotaRoundEntity } from '../../../adapter/outbound/repositories/entities/quotaRound.entity';
import { QuotaConfigEntity } from '../../../adapter/outbound/repositories/entities/quotaConfig.entity';
@Injectable()
export class CreateRoundUseCase {
  private readonly logger = new Logger(CreateRoundUseCase.name);
  constructor(
    @Inject('QuotaRoundRepository')
    private readonly quotaRoundRepo: QuotaRoundRepositoryPort,
    @Inject('MasterRepository')
    private readonly masterRepository: MasterRepository,
  ) {}

  private async validateCatalogTypes(
    types: string[],
    catalogKey: string,
    catalogName: string,
  ): Promise<void> {
    const catalogItems = await this.masterRepository.getCommonCode(
      catalogKey,
      Language.EN,
    );
    const validValues = catalogItems.map((item) => item.value.toString());
    const invalidTypes = types.filter((type) => !validValues.includes(type));

    if (invalidTypes.length > 0) {
      throw new CatalogNotFoundException(
        `${catalogName} not found in catalog: ${invalidTypes.join(', ')}`,
      );
    }
  }

  async handler(
    round: QuotaRound,
    quotaQueryParams: QuotaQueryParams,
    userId?: number,
  ): Promise<any> {
    try {
      await this.validateCatalogTypes(
        [quotaQueryParams.locationType],
        'QUOTA_LOCATION_TYPE',
        'Location types',
      );
      this.logger.debug(`Location types validated: ${quotaQueryParams.locationType}`);

      await this.validateCatalogTypes(
        [quotaQueryParams.quotaType],
        'QUOTA_LOCATION_TYPE',
        'Location types',
      );
      this.logger.debug(`Location types validated: ${quotaQueryParams.quotaType}`);

      const config = await this.quotaRoundRepo.getQuotaConfig(
        quotaQueryParams.year,
        quotaQueryParams.locationType,
        quotaQueryParams.quotaType,
      );
      if (!config) {
        throw new QuotaNotFoundException(`Quota config not found`);
      }

      const roundsMap = new Map<number, QuotaRoundEntity>();
      const rounds = await this.quotaRoundRepo.getRoundsByConfigId(config.id);
      rounds.forEach((r) => roundsMap.set(r.seq, r));

      const lastseq = await this.quotaRoundRepo.getLasetRoundSeq(config.id);

      const seq = lastseq + 1;

      const roundEntity = new QuotaRoundEntity();
      const quotaConfigEntity = new QuotaConfigEntity();
      quotaConfigEntity.id = config.id;

      roundEntity.quotaConfig = quotaConfigEntity;
      roundEntity.quotaRoundStatusId = 1;
      roundEntity.isReview = 'N';
      roundEntity.name = round.name;
      roundEntity.startMonth = round.startMonth;
      roundEntity.endMonth = round.endMonth;
      roundEntity.dueDate = round.dueDate;
      roundEntity.seq = seq;
      roundEntity.createBy = userId;
      roundEntity.updateBy = userId;

      if (round.allocations && round.allocations.length > 0) {
        roundEntity.allocations = round.allocations.map((allocation) => {
          const allocationEntity = new QuotaAllocationEntity();
          allocationEntity.zoneId = allocation.zoneId;
          allocationEntity.assignedQuota = allocation.assignedQuota;
          allocationEntity.reservedQuota = allocation.reservedQuota;

          const lastRound = roundsMap.get(lastseq);
          if (lastRound) {
            const prevAlloc = lastRound.allocations.find(
              (a) => a.zoneId === allocation.zoneId,
            );
            if (prevAlloc && prevAlloc.quotaAllocationItems) {
              allocationEntity.quotaAllocationItems = prevAlloc.quotaAllocationItems
                .filter((item) => item.type === 'RESERVE')
                .map((item) => {
                  item.updateBy = userId;
                  item.updateDate = new Date();
                  return item;
                });
            }
          }
          return allocationEntity;
        });
      }

      const result = await this.quotaRoundRepo.createRound([roundEntity]);

      return {
        round_id: result[0].id,
        success: true,
        code: 'ROUND_CREATED',
        message: 'Quota round created successfully',
      };
    } catch (error) {
      if (error instanceof QuotaException) {
        return {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        };
      }

      return {
        success: false,
        error: {
          code: error.code || 'DATA_ACCESS_ERROR',
          message: error.message || 'An error occurred while creating quota data',
        },
      };
    }
  }
}
