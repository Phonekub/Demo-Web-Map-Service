import { Inject, Injectable } from '@nestjs/common';
import { Dropdown } from '../../../domain/dropdown';
import { UserRepositoryPort } from '../../ports/user.repository';

@Injectable()
export class GetUserZonesUseCase {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async handler(userId: number): Promise<Dropdown[]> {
    return await this.userRepository.getUserZonesDropdown(userId);
  }
}
