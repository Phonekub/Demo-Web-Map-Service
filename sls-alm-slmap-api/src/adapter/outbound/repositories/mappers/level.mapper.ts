import { Builder } from 'builder-pattern';
import { LevelEntity } from '../entities/level.entity';
import { Level } from '../../../../domain/level';

export class LevelMapper {
  static toDomain(entity: LevelEntity): Level {
    return Builder(Level).levelId(entity.levelId).levelName(entity.levelName).build();
  }
}
