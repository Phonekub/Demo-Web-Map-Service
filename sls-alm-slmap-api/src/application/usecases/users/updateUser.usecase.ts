import { Inject, Injectable } from '@nestjs/common';
import { UserRepositoryPort } from '../../ports/user.repository';
import { UpdateUserDto } from '../../../adapter/inbound/dtos/update-user.dto';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject('UserRepository') private readonly userRepository: UserRepositoryPort,
  ) {}

  async handler(userId: number, payload: UpdateUserDto) {
    const user = await this.userRepository.updateUser(userId, payload);
    await this.userRepository.updateUserRole(userId, payload);
    await this.userRepository.updateUserZone(userId, payload);
    await this.userRepository.updateUserPermission(userId, {
      allow_permissions: payload.allow_permissions,
      revoke_permissions: payload.revoke_permissions,
    });

    return user;
  }
}
