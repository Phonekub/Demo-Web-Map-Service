// import * as _ from 'lodash';
import { Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RoleRepositoryPort } from '../../../application/ports/role.repository';
import { Department } from '../../../domain/department';
import { Level } from '../../../domain/level';
import { Zone } from '../../../domain/zone';
import { DepartmentEntity } from './entities/department.entity';
import { LevelEntity } from './entities/level.entity';
import { ZoneEntity } from './entities/zone.entity';
import { RoleEntity } from './entities/role.entity';
import { PermissionGroupEntity } from './entities/permissionGroup.entity';
import { RolePermissionEntity } from './entities/rolePermission.entity';
import { DepartmentMapper } from './mappers/department.mapper';
import { LevelMapper } from './mappers/level.mapper';
import { ZoneMapper } from './mappers/zone.mapper';
import { RoleMapper } from './mappers/role.mapper';
import { PermissionGroupMapper } from './mappers/permissionGroup.mapper';
import { Dropdown } from '../../../domain/dropdown';
import { PermissionGroup } from '../../../domain/permissionGroup';
import { RolePermissions } from '../../../domain/rolePermissions';
import { RoleSearch } from '../../../domain/roleSearch';

@Injectable()
export class RoleRepository implements RoleRepositoryPort {
  constructor(
    @InjectRepository(DepartmentEntity)
    private readonly departmentModel: Repository<DepartmentEntity>,

    @InjectRepository(LevelEntity)
    private readonly levelModel: Repository<LevelEntity>,

    @InjectRepository(ZoneEntity)
    private readonly zoneModel: Repository<ZoneEntity>,

    @InjectRepository(RoleEntity)
    private readonly roleModel: Repository<RoleEntity>,

    @InjectRepository(PermissionGroupEntity)
    private readonly permissionGroupModel: Repository<PermissionGroupEntity>,

    @InjectRepository(RolePermissionEntity)
    private readonly rolePermissionModel: Repository<RolePermissionEntity>,

    private readonly dataSource: DataSource,
  ) {}

  async getAllDepartment(): Promise<Department[]> {
    const results = await this.departmentModel
      .createQueryBuilder('dept')
      .where('dept.isActive = :isActive', { isActive: 'Y' })
      .orderBy('dept.deptId', 'ASC')
      .getMany();

    return results.map((entity) => DepartmentMapper.toDomain(entity));
  }

  async getAllLevels(): Promise<Level[]> {
    const results = await this.levelModel
      .createQueryBuilder('lvl')
      .where('lvl.isActive = :isActive', { isActive: 'Y' })
      .andWhere('lvl.org_id = :orgId', { orgId: '2' })
      .orderBy('lvl.levelId', 'ASC')
      .getMany();

    return results.map((entity) => LevelMapper.toDomain(entity));
  }

  async getAllZones(): Promise<Zone[]> {
    const raw = await this.zoneModel
      .createQueryBuilder('z')
      .innerJoin('subzone', 'sz', 'z.zone_id = sz.zone_id')
      .select(['z.zone_code AS "zoneCode"', 'sz.subzone_code AS "subZoneCode"'])
      .where('z.is_active = :isActive', { isActive: 'Y' })
      .andWhere('z.org_id = :orgId', { orgId: '2' })
      .andWhere('sz.is_active = :isActive', { isActive: 'Y' })
      .orderBy('z.zone_code', 'ASC')
      .addOrderBy('sz.subzone_code', 'ASC')
      .getRawMany();

    // group subzones per zoneCode
    const grouped: Record<string, string[]> = raw.reduce(
      (acc, row) => {
        const zoneCode = row['zoneCode'];
        const subZoneCode = row['subZoneCode'];
        if (!zoneCode || !subZoneCode) return acc;
        if (!acc[zoneCode]) acc[zoneCode] = [];
        acc[zoneCode].push(subZoneCode);
        return acc;
      },
      {} as Record<string, string[]>,
    );

    // map to Domain
    return Object.entries(grouped).map(([zoneCode, subZones]) =>
      ZoneMapper.toDomain({ zoneCode, subZones }),
    );
  }

  async getAllRoles(): Promise<Dropdown[]> {
    const results = await this.roleModel
      .createQueryBuilder('role')
      .orderBy('role.id', 'ASC')
      .getMany();

    return results.map((entity) => RoleMapper.toDomain(entity));
  }

  async searchRoles(departmentId?: number, levelId?: number): Promise<RoleSearch[]> {
    const query = this.roleModel
      .createQueryBuilder('r')
      .leftJoin('department', 'd', 'r.department_id = d.dept_id')
      .leftJoin('level', 'l', 'r.level_id = l.level_id')
      .select([
        'r.id AS id',
        'd.dept_name AS department',
        'r.department_id AS "departmentId"',
        'l.level_name AS level',
        'r.level_id AS "levelId"',
        'r.permission_type AS "permissionType"',
      ]);

    // Apply filters
    if (departmentId) {
      query.andWhere('r.department_id = :departmentId', { departmentId });
    }
    if (levelId) {
      query.andWhere('r.level_id = :levelId', { levelId });
    }

    query.orderBy('r.department_id', 'ASC').addOrderBy('r.level_id', 'ASC');

    const results = await query.getRawMany();

    return results.map((row) => {
      const roleSearch = new RoleSearch();
      roleSearch.id = row.id;
      roleSearch.department = row.department;
      roleSearch.departmentId = row.departmentId;
      roleSearch.level = row.level;
      roleSearch.levelId = row.levelId;
      roleSearch.permissionType = row.permissionType;
      return roleSearch;
    });
  }

  async getAllPermissionGroups(language: string = 'th'): Promise<PermissionGroup[]> {
    const results = await this.permissionGroupModel
      .createQueryBuilder('pg')
      .leftJoinAndSelect('pg.permissions', 'p')
      .where('pg.isActive = :isActive', { isActive: 'Y' })
      .andWhere('p.isActive = :isActive', { isActive: 'Y' })
      .orderBy('pg.id', 'ASC')
      .addOrderBy('p.id', 'ASC')
      .getMany();

    return results.map((entity) => PermissionGroupMapper.toDomain(entity, language));
  }

  async getRolePermissions(roleId: number): Promise<RolePermissions> {
    // Get role details including permission type
    const role = await this.roleModel
      .createQueryBuilder('r')
      .where('r.id = :roleId', { roleId })
      .getOne();

    const permissions = await this.rolePermissionModel
      .createQueryBuilder('rp')
      .where('rp.roleId = :roleId', { roleId })
      .getMany();

    const rolePermissions = new RolePermissions();
    rolePermissions.roleId = roleId;
    rolePermissions.permissionIds = permissions.map((p) => p.permissionId);
    rolePermissions.permissionType = role?.permissionType;

    return rolePermissions;
  }

  async updateRolePermissions(
    roleId: number,
    permissionIds: number[],
    permissionType?: string,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      if (permissionType !== undefined) {
        const typeToUpdate = permissionType === '' ? null : permissionType;
        await manager.update(
          RoleEntity,
          { id: roleId },
          { permissionType: typeToUpdate },
        );
      }

      // Delete all existing permissions for this role
      await manager.delete(RolePermissionEntity, { roleId });

      // Insert new permissions
      const newPermissions = permissionIds.map((permissionId) => ({
        roleId,
        permissionId,
      }));

      if (newPermissions.length > 0) {
        await manager.insert(RolePermissionEntity, newPermissions);
      }
    });
  }

  async findByDepartmentAndLevel(departmentId: number, levelId: number): Promise<any> {
    const role = await this.roleModel
      .createQueryBuilder('role')
      .where('role.departmentId = :departmentId', { departmentId })
      .andWhere('role.levelId = :levelId', { levelId })
      .getOne();

    return role;
  }

  async createRole(
    departmentId: number,
    levelId: number,
    permissionIds: number[],
    permissionType?: string,
  ): Promise<any> {
    return await this.dataSource.transaction(async (manager) => {
      // Create new role with permission type
      const newRole = manager.create(RoleEntity, {
        departmentId,
        levelId,
        permissionType,
      });

      const savedRole = await manager.save(newRole);

      // Insert permissions if provided
      if (permissionIds.length > 0) {
        const newPermissions = permissionIds.map((permissionId) => ({
          roleId: savedRole.id,
          permissionId,
        }));

        await manager.insert(RolePermissionEntity, newPermissions);
      }

      return {
        id: savedRole.id,
        departmentId: savedRole.departmentId,
        levelId: savedRole.levelId,
        permissionType: savedRole.permissionType,
      };
    });
  }
}
