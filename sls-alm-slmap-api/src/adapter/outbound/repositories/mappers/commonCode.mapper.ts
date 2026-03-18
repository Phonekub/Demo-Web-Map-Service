import { Builder } from 'builder-pattern';
import { CommonCodeEntity } from '../entities/commonCode.entity';
import { Dropdown } from '../../../../domain/dropdown';

export class CommonCodeMapper {
  static toDomain(entity: CommonCodeEntity): Dropdown {
    return Builder(Dropdown)
      .text(entity.codeName)
      .value(entity.codeValue)
      .codeMapping(entity.codeMapping)
      .build();
  }
}
