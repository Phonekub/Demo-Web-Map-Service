import { Inject, Injectable } from '@nestjs/common';
import { UserRepositoryPort } from '../../ports/user.repository';

@Injectable()
export class GetUserRoleUseCase {
  constructor(
    @Inject('UserRepository') private readonly userRepository: UserRepositoryPort,
  ) {}

  async handler(userId: number) {
    const userRole = await this.userRepository.getUserRole(userId);
    const userZone = await this.userRepository.getUserZone(userId);
    const userPermissions = await this.userRepository.getUserPermissions(userId);
    return { userRole, userZone, userPermissions: userPermissions.map((v) => v.code) };
  }
}
