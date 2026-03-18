import { Inject, Injectable } from '@nestjs/common';
import { UserRepositoryPort } from '../../ports/user.repository';
import { User } from '../../../domain/user';
import { UserWithZone } from '../../../domain/userWithZone';

@Injectable()
export class FindAllUserWithZonesUseCase {
  constructor(
    @Inject('UserRepository') private readonly userRepository: UserRepositoryPort,
  ) {}

  async handler(
    search: string,
    page?: number,
    pageSize?: number,
  ): Promise<{ data: UserWithZone[]; total: number }> {
    return await this.userRepository.findAllUserWithZones(search, page, pageSize);
  }
}
