import { Builder } from 'builder-pattern';
import { PoiSevenElevenEntity } from '../entities/sevenEleven.entity';
import { Poi } from '../../../../domain/poi';

export class SevenElevenNearbyMapper {
  static toDomain(entity: PoiSevenElevenEntity): Poi {
    return Builder(Poi)
      .id(entity.poiId || entity.id)
      .uid(entity.poi?.uid || entity.uid || '')
      .branchName(entity.storename || '')
      .branchCode(entity.storecode || '')
      .location(entity.poi?.locationT || '')
      .formLocNumber(entity.formLocNumber || '')
      .sevenType(entity.sevenType || null)
      .layerId(entity.poi?.layerId || null)
      .saleAverage(entity.saleAverage || null)
      .build();
  }
}
