import { Builder } from 'builder-pattern';
import { UserEntity } from '../entities/user.entity';
import { User } from '../../../../domain/user';

export class UserMapper {
  static toDomain(userEntity: UserEntity): User {
    return Builder(User)
      .userId(userEntity.id)
      .username(userEntity.username)
      .firstName(userEntity.firstName)
      .lastName(userEntity.lastName)
      .employeeId(userEntity.employeeId)
      .isExternal(userEntity.isExternal)
      .email(userEntity.email)
      .tel(userEntity.tel)
      .isActive(userEntity.isActive)
      .createBy(userEntity.createBy)
      .createDate(userEntity.createDate)
      .updateBy(userEntity.updateBy)
      .updateDate(userEntity.updateDate)
      .build();
  }
}
