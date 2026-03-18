import { Builder } from 'builder-pattern';
import { GeoLocationEntity } from '../entities/geoLocation.entity';
import { Dropdown } from '../../../../domain/dropdown';

export class GeoLocationMapper {
  static toDomain(entity: GeoLocationEntity): Dropdown {
    return Builder(Dropdown).text(entity.name).value(entity.code).build();
  }
}
