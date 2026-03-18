import { Inject, Injectable } from '@nestjs/common';
import { RoleRepositoryPort } from '../../ports/role.repository';
import { Department } from '../../../domain/department';

@Injectable()
export class GetAllDepartmentUseCase {
  constructor(
    @Inject('RoleRepository') private readonly roleRepository: RoleRepositoryPort,
  ) {}

  async handler(): Promise<Department[]> {
    return await this.roleRepository.getAllDepartment();
  }
}
