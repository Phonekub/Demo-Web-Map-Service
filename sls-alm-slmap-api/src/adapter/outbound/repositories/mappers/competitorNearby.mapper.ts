import { Builder } from 'builder-pattern';
import { PoiCompetitorEntity } from '../entities/competitor.entity';
import { Poi } from '../../../../domain/poi';

export class CompetitorNearbyMapper {
  static toDomain(entity: PoiCompetitorEntity): Poi {
    return Builder(Poi)
      .id(entity.poiId || entity.id)
      .uid(entity.poi?.uid || '')
      .branchName(entity.poi?.name || entity.poi?.namt || '')
      .branchCode('')
      .location(entity.poi?.locationT || '')
      .grade(entity.grade || '')
      .saleAverage(entity.saleAverage || null)
      .openTime(entity.openTime || '')
      .closeTime(entity.closeTime || '')
      .competitorType(entity.type || null)
      .build();
  }
}
