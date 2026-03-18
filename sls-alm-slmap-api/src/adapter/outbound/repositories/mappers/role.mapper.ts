import { Builder } from 'builder-pattern';
import { RoleEntity } from '../entities/role.entity';
import { Dropdown } from '../../../../domain/dropdown';

export class RoleMapper {
  static toDomain(roleEntity: RoleEntity): Dropdown {
    // Use id as both value and text since name field is removed
    return Builder(Dropdown).value(roleEntity.id).text(roleEntity.id.toString()).build();
  }
}
