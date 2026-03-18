import { Inject, Injectable } from '@nestjs/common';
import { UserRepositoryPort } from '../../ports/user.repository';
import { User } from '../../../domain/user';

@Injectable()
export class FindAllUserUseCase {
  constructor(
    @Inject('UserRepository') private readonly userRepository: UserRepositoryPort,
  ) {}

  async handler(
    search: string,
    page?: number,
    pageSize?: number,
  ): Promise<{ data: User[]; total: number }> {
    return await this.userRepository.findAll(search, page, pageSize);
  }
}
