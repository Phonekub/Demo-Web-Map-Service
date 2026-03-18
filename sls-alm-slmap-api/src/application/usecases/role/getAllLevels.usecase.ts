import { Inject, Injectable } from '@nestjs/common';
import { RoleRepositoryPort } from '../../ports/role.repository';
import { Level } from '../../../domain/level';

@Injectable()
export class GetAllLevelsUseCase {
  constructor(
    @Inject('RoleRepository') private readonly roleRepository: RoleRepositoryPort,
  ) {}

  async handler(): Promise<Level[]> {
    return await this.roleRepository.getAllLevels();
  }
}
