import { Builder } from 'builder-pattern';
import { MasterCpallZone } from 'src/domain/masterCpallZone';
import { MasterCpallZoneEntity } from '../repositories/entities/masterCpallZone.entity';

export class MasterCpallZoneMapper {
  static toDomain(entity: MasterCpallZoneEntity): MasterCpallZone {
    const shape =
      typeof entity.shape === 'string' ? JSON.parse(entity.shape) : entity.shape;

    return Builder(MasterCpallZone)
      .id(entity.id)
      .zone(entity.zone)
      .subzone(entity.subzone)
      .shape(shape ?? '')
      .build();
  }
}
