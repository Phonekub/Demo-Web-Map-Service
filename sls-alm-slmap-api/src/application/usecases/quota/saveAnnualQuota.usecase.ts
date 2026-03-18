import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  SaveAnnualQuotaRequest,
  SaveAnnualQuotaResponse,
} from 'src/domain/quotaAnnualTarget';
import { QuotaConfigRepositoryPort } from '../../ports/quotaConfig.repository';
import { QuotaAnnualTargetRepositoryPort } from '../../ports/quotaAnnualTarget.repository';
import { MasterRepositoryPort } from '../../ports/master.repository';
import { Language } from '../../../common/enums/language.enum';
import { YearValidator } from '../../../common/helpers/yearValidator';
import {
  QuotaException,
  CatalogNotFoundException,
  NegativeTargetException,
  PairNotSelectedException,
  ConfigNotVisibleException,
} from '../../../common/exceptions/quota.exception';
import { QuotaConfigPair } from '../../../domain/quotaConfig';
import { config } from 'process';

@Injectable()
export class SaveAnnualQuotaUseCase {
  private readonly logger = new Logger(SaveAnnualQuotaUseCase.name);

  constructor(
    @Inject('QuotaConfigRepository')
    private readonly quotaConfigRepository: QuotaConfigRepositoryPort,
    @Inject('QuotaAnnualTargetRepository')
    private readonly quotaAnnualTargetRepository: QuotaAnnualTargetRepositoryPort,
    @Inject('MasterRepository')
    private readonly masterRepository: MasterRepositoryPort,
    @InjectDataSource()
    private readonly dataSource: DataSource,
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

  async execute(
    request: SaveAnnualQuotaRequest,
    userId: number,
  ): Promise<SaveAnnualQuotaResponse> {
    // [Perf] Start total execution timer
    const startTotal = performance.now();

    this.logger.log(`Saving annual quota for year ${request.year} by user ${userId}`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Validate year format (YYYY)
      YearValidator.validate(request.year);
      this.logger.debug(`Year validation passed: ${request.year}`);

      // [Perf] Start validation timer
      const startVal = performance.now();

      // 2. Validate location types exist in master catalog
      await this.validateCatalogTypes(
        request.locationTypes,
        'QUOTA_LOCATION_TYPE',
        'Location types',
      );
      this.logger.debug(`Location types validated: ${request.locationTypes.join(', ')}`);

      // 3. Validate quota types exist in master catalog
      await this.validateCatalogTypes(request.quotaTypes, 'QUOTA_TYPE', 'Quota types');
      this.logger.debug(`Quota types validated: ${request.quotaTypes.join(', ')}`);

      // [Perf] Log validation time
      this.logger.debug(
        `[Perf] Validation took: ${(performance.now() - startVal).toFixed(2)}ms`,
      );

      // 4. Validate all targets are non-negative
      if (request.zoneTargets && request.zoneTargets.length > 0) {
        const negativeTargets = request.zoneTargets.filter((zt) => zt.target < 0);
        if (negativeTargets.length > 0) {
          throw new NegativeTargetException();
        }
        this.logger.debug(
          `Zone targets validated: ${request.zoneTargets.length} targets`,
        );
      }

      // 5. Calculate Cartesian product of locationTypes × quotaTypes
      const selectedPairs: Array<{
        locationType: string;
        quotaType: string;
      }> = [];
      for (const locationType of request.locationTypes) {
        for (const quotaType of request.quotaTypes) {
          selectedPairs.push({ locationType, quotaType });
        }
      }
      this.logger.debug(`Cartesian product generated: ${selectedPairs.length} pairs`);

      // [Perf] Start fetch existing config timer
      const startFetch = performance.now();

      // 6. Get existing configs for the year
      const existingPairs = await this.quotaConfigRepository.getExistingPairs(
        request.year,
        queryRunner,
      );
      this.logger.debug(`Found ${existingPairs.length} existing configs`);

      // [Perf] Log fetch existing config time
      this.logger.debug(
        `[Perf] Fetch Config took: ${(performance.now() - startFetch).toFixed(2)}ms`,
      );

      // 7. Determine which pairs to create, show, or hide
      const pairsToCreate = selectedPairs.filter(
        (sp) =>
          !existingPairs.some(
            (ep) => ep.locationType === sp.locationType && ep.quotaType === sp.quotaType,
          ),
      );

      const pairsToShow = existingPairs.filter(
        (ep) =>
          ep.isVisible === 'N' &&
          selectedPairs.some(
            (sp) => sp.locationType === ep.locationType && sp.quotaType === ep.quotaType,
          ),
      );

      const pairsToHide = existingPairs.filter(
        (ep) =>
          ep.isVisible === 'Y' &&
          !selectedPairs.some(
            (sp) => sp.locationType === ep.locationType && sp.quotaType === ep.quotaType,
          ),
      );

      this.logger.log(
        `Config changes: ${pairsToCreate.length} to create, ${pairsToShow.length} to show, ${pairsToHide.length} to hide`,
      );

      // [Perf] Start config update timer
      const startConfig = performance.now();

      // 8. Create new configs
      for (const pair of pairsToCreate) {
        await this.quotaConfigRepository.createConfig(
          request.year,
          pair.locationType,
          pair.quotaType,
          userId,
          queryRunner,
        );
      }

      // 9. Update visibility for configs to show
      for (const pair of pairsToShow) {
        await this.quotaConfigRepository.updateVisibility(
          pair.id,
          'Y',
          userId,
          queryRunner,
        );
      }

      // 10. Update visibility for configs to hide
      for (const pair of pairsToHide) {
        await this.quotaConfigRepository.updateVisibility(
          pair.id,
          'N',
          userId,
          queryRunner,
        );
      }

      // [Perf] Log config update time
      this.logger.debug(
        `[Perf] Config Update took: ${(performance.now() - startConfig).toFixed(2)}ms`,
      );

      const startZone = performance.now();

      // 11. Process zone targets for each selected pair (if any)
      if (request.zoneTargets && request.zoneTargets.length > 0) {
        this.logger.log(`Processing ${request.zoneTargets.length} zone targets`);

        // [Perf-Detail] ตัวแปรสะสมเวลา
        let totalFindTime = 0;
        const totalLogicTime = 0;
        let totalUpsertTime = 0;

        // --- จับเวลาส่วนที่ 1: การค้นหา Config ID ---
        const t1 = performance.now();

        const configs = await this.quotaConfigRepository.getExistingPairs(
          request.year,
          queryRunner,
        );

        const configMap = new Map<string, QuotaConfigPair>();
        configs.forEach((config) =>
          configMap.set(`${config.locationType}_${config.quotaType}`, config),
        );

        totalFindTime += performance.now() - t1;

        const zonesToSave: {
          quotaConfigId: number;
          zoneId: number;
          target: number;
        }[] = [];

        // --- จับเวลาส่วนที่ 3: การบันทึก (Upsert) ---
        const t3 = performance.now();
        for (const zoneTarget of request.zoneTargets) {
          const configKey = `${zoneTarget.locationType}_${zoneTarget.quotaType}`;
          const config = configMap.get(configKey);

          if (!config) {
            throw new PairNotSelectedException(
              `Configuration not found for locationType=${zoneTarget.locationType}, quotaType=${zoneTarget.quotaType}`,
            );
          }

          if (config.isVisible !== 'Y') {
            throw new ConfigNotVisibleException(
              `Configuration is not visible for locationType=${zoneTarget.locationType}, quotaType=${zoneTarget.quotaType}`,
            );
          }

          zonesToSave.push({
            quotaConfigId: config.id,
            zoneId: zoneTarget.zoneId,
            target: zoneTarget.target,
          });
        }

        await this.quotaAnnualTargetRepository.upsertZoneTargets(
          zonesToSave,
          userId,
          queryRunner,
        );

        totalUpsertTime += performance.now() - t3;

        // [Perf-Detail] สรุปผลหลังจบลูป
        this.logger.debug(
          `--- Zone Processing Breakdown (${request.zoneTargets.length} items) ---`,
        );
        this.logger.debug(`[Perf] 1. Find Config ID (DB): ${totalFindTime.toFixed(2)}ms`);
        this.logger.debug(
          `[Perf] 2. Logic Check (CPU):   ${totalLogicTime.toFixed(2)}ms`,
        );
        this.logger.debug(
          `[Perf] 3. Upsert Target (DB):  ${totalUpsertTime.toFixed(2)}ms`,
        );
      }

      // [Perf] Log zone target time (Total)
      this.logger.debug(
        `[Perf] Zone Processing took: ${(performance.now() - startZone).toFixed(2)}ms`,
      );

      // [Perf] Start commit timer
      const startCommit = performance.now();

      await queryRunner.commitTransaction();

      // [Perf] Log commit time
      this.logger.debug(
        `[Perf] DB Commit took: ${(performance.now() - startCommit).toFixed(2)}ms`,
      );

      this.logger.log(`Successfully saved annual quota for year ${request.year}`);

      // [Perf] Log total execution time
      this.logger.log(
        `[Perf] Total time: ${(performance.now() - startTotal).toFixed(2)}ms`,
      );

      return {
        success: true,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to save annual quota: ${error.message}`, error.stack);

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
          code: 'DATA_ACCESS_ERROR',
          message: 'An error occurred while saving quota data',
        },
      };
    } finally {
      await queryRunner.release();
    }
  }
}
