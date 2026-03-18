import { Inject, Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { RoleRepositoryPort } from '../../ports/role.repository';

@Injectable()
export class CreateRoleUseCase {
  constructor(
    @Inject('RoleRepository')
    private readonly roleRepository: RoleRepositoryPort,
  ) {}

  async execute(
    departmentId: number,
    levelId: number,
    permissionIds: number[],
    permissionType?: string,
  ): Promise<any> {
    // Check if role with same department and level already exists
    const existingRole = await this.roleRepository.findByDepartmentAndLevel(
      departmentId,
      levelId,
    );

    if (existingRole) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Role with this department and level already exists',
          errorCode: 'ROLE_DEPARTMENT_LEVEL_DUPLICATE',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    // Create new role
    const newRole = await this.roleRepository.createRole(
      departmentId,
      levelId,
      permissionIds,
      permissionType,
    );

    return newRole;
  }
}
