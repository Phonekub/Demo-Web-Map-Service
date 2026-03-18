import { Inject, Injectable } from '@nestjs/common';
import { Stream } from 'stream';
import { QuotaAnnualTargetRepositoryPort } from '../../ports/quotaAnnualTarget.repository';
import { ExcelExportGatewayPort } from '../../ports/generateExcelGateway.repository';
import { MasterRepositoryPort } from '../../ports/master.repository';
import { Language } from '../../../common/enums/language.enum';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { QuotaConfigRepositoryPort } from '../../ports/quotaConfig.repository';
import { QuotaConfigPair } from '../../../domain/quotaConfig';

@Injectable()
export class ExportAnnualQuotaUseCase {
  constructor(
    @Inject('QuotaConfigRepository')
    private readonly quotaConfigRepository: QuotaConfigRepositoryPort,

    @Inject('QuotaAnnualTargetRepository')
    private readonly quotaRepository: QuotaAnnualTargetRepositoryPort,

    @Inject('ExcelExportGatewayPort')
    private readonly excelGateway: ExcelExportGatewayPort,

    @Inject('MasterRepository')
    private readonly masterRepository: MasterRepositoryPort,

    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async execute(year: string, language: Language): Promise<Stream> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const [targets, zones, locationCodes, quotaCodes] = await Promise.all([
        this.quotaRepository.getZoneAnnualTargetsByYear(year),
        this.masterRepository.getZones('2', 'MAIN'),
        this.masterRepository.getCommonCode('QUOTA_LOCATION_TYPE', language),
        this.masterRepository.getCommonCode('QUOTA_TYPE', language),
      ]);

      const zoneOrderMap = new Map<number, number>();
      zones.forEach((zone, index) => {
        zoneOrderMap.set(zone.zoneId, index);
      });

      const configs = (
        await this.quotaConfigRepository.getExistingPairs(year, queryRunner)
      ).sort();

      const configMap = new Map<string, QuotaConfigPair>();
      configs.forEach((config) =>
        configMap.set(`${config.locationType}_${config.quotaType}`, config),
      );

      const filterdTargets = targets.filter((t) => {
        const targetConfigKey = `${t.locationType}_${t.quotaType}`;
        const config = configMap.get(targetConfigKey);
        return config && config.isVisible === 'Y';
      });

      const mappedData = filterdTargets.map((item) => {
        const zoneObj = zones.find((z) => z.zoneId === item.zoneId);
        const locObj = locationCodes.find((l) => l.value === item.locationType);
        const quotaObj = quotaCodes.find((q) => q.value === item.quotaType);
        return {
          ...item,
          zoneCode: zoneObj ? zoneObj.zoneCode : `Zone-${item.zoneId}`,
          locationTypeName: locObj ? locObj.text : item.locationType,
          quotaTypeName: quotaObj ? quotaObj.text : item.quotaType,
        };
      });

      mappedData.sort((a, b) => {
        const indexA = zoneOrderMap.get(a.zoneId) ?? Number.MAX_SAFE_INTEGER;
        const indexB = zoneOrderMap.get(b.zoneId) ?? Number.MAX_SAFE_INTEGER;
        return indexA - indexB;
      });

      return this.excelGateway.generateQuotaReport(mappedData, language);
    } finally {
      await queryRunner.release();
    }
  }
}
