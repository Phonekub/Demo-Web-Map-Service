import { Builder } from 'builder-pattern';
import { PoiEntertainmentAreaEntity } from '../entities/entertainmentArea.entity';
import { Poi } from '../../../../domain/poi';

export class EntertainmentAreaNearbyMapper {
  static toDomain(entity: PoiEntertainmentAreaEntity): Poi {
    return Builder(Poi)
      .id(entity.id || 0)
      .uid(entity.poi?.uid || '')
      .branchName(entity.name || entity.namt || '')
      .branchCode('')
      .location(entity.poi?.locationT || entity.locationT || '')
      .subCode(entity.subCode)
      .personAmount(entity.personAmount)
      .parkingAmount(entity.parkingAmount)
      .workingDay(entity.workingDay)
      .openTime(entity.openTime)
      .closeTime(entity.closeTime)
      .build();
  }
}
