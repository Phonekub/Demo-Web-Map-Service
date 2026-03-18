import { Inject, Injectable } from '@nestjs/common';
import { RoleRepositoryPort } from '../../ports/role.repository';
import { Zone } from '../../../domain/zone';

@Injectable()
export class GetAllZonesUseCase {
  constructor(
    @Inject('RoleRepository') private readonly roleRepository: RoleRepositoryPort,
  ) {}

  async handler(): Promise<Zone[]> {
    return await this.roleRepository.getAllZones();
  }
}
