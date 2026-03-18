import { Builder } from 'builder-pattern';
import { Zone } from '../../../../domain/zone';

export class ZoneMapper {
  static toDomain(raw: { zoneCode: string; subZones: string[] }): Zone {
    return Builder(Zone).zoneCode(raw.zoneCode).subZonesCode(raw.subZones).build();
  }
}
