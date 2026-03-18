import { Builder } from 'builder-pattern';
import { LayerEntity } from '../repositories/entities/layer.entity';
import { Dropdown } from '../../../domain/dropdown';

export class LayerMapper {
  static toDomain(entity: LayerEntity): Dropdown {
    return {
      value: entity.id.toString(),
      text: entity.name,
      spatialType: entity.spatialType,
    };
  }
}
