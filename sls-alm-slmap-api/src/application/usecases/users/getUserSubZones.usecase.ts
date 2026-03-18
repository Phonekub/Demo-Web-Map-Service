import { Inject, Injectable } from '@nestjs/common';
import { Dropdown } from '../../../domain/dropdown';
import { UserRepositoryPort } from '../../ports/user.repository';

@Injectable()
export class GetUserSubZonesUseCase {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async handler(userId: number, zone: string): Promise<Dropdown[]> {
    return await this.userRepository.getUserSubZonesDropdown(userId, zone);
  }
}
