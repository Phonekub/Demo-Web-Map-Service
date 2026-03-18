import { Builder } from 'builder-pattern';
import { QuotaConfig } from '../../../../domain/quotaConfig';
import { QuotaConfigEntity } from '../entities/quotaConfig.entity';

export class QuotaConfigMapper {
  static toDomain(
    entity: QuotaConfigEntity,
    locData?: { id: number; name: string },
    quotaData?: { id: number; name: string },
  ): QuotaConfig {
    return Builder(QuotaConfig)
      .id(entity.id)
      .year(parseInt(entity.year))
      .locationType({
        id: locData?.id || 0,
        value: entity.locationType,
        name: locData?.name || entity.locationType,
      })
      .quotaType({
        id: quotaData?.id || 0,
        value: entity.quotaType,
        name: quotaData?.name || entity.quotaType,
      })
      .isClosed(entity.isClosed as 'Y' | 'N')
      .isVisible(entity.isVisible as 'Y' | 'N')
      .annualTargets(
        entity.annualTargets?.map((t) => ({
          id: t.id,
          quotaConfigId: t.quotaConfigId,
          year: parseInt(entity.year),
          locationType: entity.locationType,
          quotaType: entity.quotaType,
          zoneId: t.zone?.id,
          zoneCode: t.zone?.zoneCode || '',
          target: t.target,
          isClosed: entity.isClosed as 'Y' | 'N',
          isVisible: entity.isVisible as 'Y' | 'N',
        })) || [],
      )
      .build();
  }
}
