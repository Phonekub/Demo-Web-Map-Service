import * as _ from 'lodash';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Builder } from 'builder-pattern';
import { UserRepositoryPort } from '../../../application/ports/user.repository';
import { User } from '../../../domain/user';
import { UserRole } from '../../../domain/userrole';
import { Zone } from '../../../domain/zone';
import { Dropdown } from '../../../domain/dropdown';
import { UserEntity } from './entities/user.entity';
import { UserRoleEntity } from './entities/userrole.entity';
import { UserZoneEntity } from './entities/userzone.entity';
import { UserPermissionEntity } from './entities/userPermission.entity';
import { UserMapper } from './mappers/user.mapper';
import { UserRoleMapper } from './mappers/userrole.mapper';
import { UpdateUserDto } from '../../../adapter/inbound/dtos/update-user.dto';
import { UserPermissions } from '../../../domain/permissions';
import { RoleEntity } from './entities/role.entity';
import { SevenProfileEntity } from './entities/sevenProfile.entity';
import { UserWithZone } from '../../../domain/userWithZone';

@Injectable()
export default class UserRepository implements UserRepositoryPort {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userModel: Repository<UserEntity>,
    @InjectRepository(UserRoleEntity)
    private readonly userRoleModel: Repository<UserRoleEntity>,
    @InjectRepository(UserZoneEntity)
    private readonly userZoneModel: Repository<UserZoneEntity>,
    @InjectRepository(UserPermissionEntity)
    private readonly userPermissionModel: Repository<UserPermissionEntity>,
    @InjectRepository(SevenProfileEntity)
    private readonly sevenProfileModel: Repository<SevenProfileEntity>,
  ) {}

  async findAll(
    search: string,
    page?: number,
    pageSize?: number,
  ): Promise<{ data: User[]; total: number }> {
    const queryBuilder = this.userModel
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.username',
        'user.employeeId',
        'user.firstName',
        'user.lastName',
        'user.isActive',
      ])
      .orderBy('user.employeeId', 'ASC');

    if (search) {
      queryBuilder.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.employeeId ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (page !== undefined && pageSize !== undefined && pageSize > 0) {
      const skip = (page - 1) * pageSize;
      queryBuilder.skip(skip).take(pageSize);
    }

    const [results, total] = await queryBuilder.getManyAndCount();
    const users = results.map((entity) => UserMapper.toDomain(entity));

    return { data: users, total };
  }

  async findAllUserWithZones(
    search: string,
    page?: number,
    pageSize?: number,
  ): Promise<{ data: UserWithZone[]; total: number }> {
    const dataQb = this.userModel
      .createQueryBuilder('u')
      .leftJoin('user_zone', 'uz', 'uz.user_id = u.id')
      .select([
        'u.id AS "userId"',
        'u.username AS "username"',
        'u.employeeId AS "employeeId"',
        'u.firstName AS "firstName"',
        'u.lastName AS "lastName"',
        'u.email AS "email"',
        'u.isActive AS "isActive"',
        `COALESCE(
         STRING_AGG(DISTINCT uz.zone_code, ',' ORDER BY uz.zone_code),
         ''
       ) AS "zones"`,
      ])
      .andWhere('u.isActive = :isActive', { isActive: 'Y' })
      .groupBy(
        `
          "u"."ID",
          "u"."USERNAME",
          "u"."EMPLOYEE_ID",
          "u"."FIRST_NAME",
          "u"."LAST_NAME",
          "u"."EMAIL",
          "u"."IS_ACTIVE"
        `,
      )
      .orderBy('u.employeeId', 'ASC');

    if (search) {
      dataQb.andWhere(
        `(u.firstName ILIKE :search
        OR u.lastName ILIKE :search
        OR u.employeeId ILIKE :search)`,
        { search: `%${search}%` },
      );
    }

    if (page && pageSize && pageSize > 0) {
      dataQb.offset((page - 1) * pageSize).limit(pageSize);
    }

    const countQb = this.userModel
      .createQueryBuilder('u')
      .leftJoin('user_zone', 'uz', 'uz.user_id = u.id');

    if (search) {
      countQb.andWhere(
        `(u.firstName ILIKE :search
        OR u.lastName ILIKE :search
        OR u.employeeId ILIKE :search)`,
        { search: `%${search}%` },
      );
    }

    const totalResult = await countQb.select('COUNT(DISTINCT u.id)', 'count').getRawOne();

    const total = Number(totalResult.count);

    const data = await dataQb.getRawMany<UserWithZone>();

    return { data, total };
  }

  async findById(userId: number): Promise<User | undefined> {
    const result = await this.userModel
      .createQueryBuilder('user')
      .where('user.id = :userId', { userId })
      .andWhere('user.isActive = :isActive', { isActive: 'Y' })
      .getOne();

    return !_.isNull(result) ? UserMapper.toDomain(result) : undefined;
  }

  async findUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.userModel
      .createQueryBuilder('user')
      .where('user.username = :username', { username })
      .andWhere('user.IS_ACTIVE = :isActive', { isActive: 'Y' })
      .getOne();

    return !_.isNull(result) ? UserMapper.toDomain(result) : undefined;
  }

  async findByNumber(employeeId: string): Promise<User | undefined> {
    const result = await this.userModel
      .createQueryBuilder('user')
      .where('user.EMPLOYEE_ID = :employeeId', { employeeId })
      .andWhere('user.isActive = :isActive', { isActive: 'Y' })
      .getOne();

    return !_.isNull(result) ? UserMapper.toDomain(result) : undefined;
  }

  async getUserRole(userId: number): Promise<UserRole> {
    const query = this.userRoleModel
      .createQueryBuilder('userRole')
      .select('role.id', 'roleId')
      .addSelect('role.permissionType', 'permissionType')
      .addSelect('userRole.isActive', 'isActive')
      .addSelect('userRole.createBy', 'createBy')
      .addSelect('userRole.createDate', 'createDate')
      .addSelect('userRole.updateBy', 'updateBy')
      .addSelect('userRole.updateDate', 'updateDate')
      .addSelect('userRole.deptId', 'deptId')
      .addSelect('userRole.levelId', 'levelId')
      .where('userRole.userId = :userId', { userId: userId.toString() })
      .innerJoin(
        RoleEntity,
        'role',
        'userRole.level_id = role.level_id AND userRole.dept_id = role.department_id',
      );

    const result = await query.getRawOne<UserRole>();
    return !_.isUndefined(result) ? UserRoleMapper.toDomain(result) : undefined;
  }

  async getUserZone(userId: number): Promise<Zone[]> {
    const userZones = await this.userZoneModel.find({
      where: { userId },
      select: ['zoneCode', 'subzoneCode'],
    });
    // แปลงเป็น Zone[]
    const zoneMap: Record<string, string[]> = {};
    userZones.forEach((uz) => {
      if (!zoneMap[uz.zoneCode]) zoneMap[uz.zoneCode] = [];
      zoneMap[uz.zoneCode].push(uz.subzoneCode);
    });
    const zones: Zone[] = Object.entries(zoneMap).map(([zoneCode, subzoneCodes]) => ({
      zoneCode,
      subZonesCode: subzoneCodes,
    }));
    return zones;
  }

  async getUserZonesDropdown(userId: number): Promise<Dropdown[]> {
    const results = await this.userZoneModel
      .createQueryBuilder('userZone')
      .select('DISTINCT userZone.zoneCode', 'zoneCode')
      .where('userZone.userId = :userId', { userId })
      .orderBy('userZone.zoneCode', 'ASC')
      .getRawMany();

    return results.map((row) =>
      Builder(Dropdown).text(row.zoneCode).value(row.zoneCode).build(),
    );
  }

  async getUserSubZonesDropdown(userId: number, zone: string): Promise<Dropdown[]> {
    const results = await this.userZoneModel
      .createQueryBuilder('userZone')
      .select('DISTINCT userZone.subzoneCode', 'subzoneCode')
      .where('userZone.userId = :userId', { userId })
      .andWhere('userZone.zoneCode = :zone', { zone })
      .orderBy('userZone.subzoneCode', 'ASC')
      .getRawMany();

    return results.map((row) =>
      Builder(Dropdown).text(row.subzoneCode).value(row.subzoneCode).build(),
    );
  }

  async getUserPermissions(userId: number): Promise<UserPermissions[]> {
    // Get user role (dept_id and level_id)
    const userRole = await this.userRoleModel.findOne({
      where: { userId: userId.toString() },
      select: ['deptId', 'levelId'],
    });

    if (!userRole) {
      return [];
    }

    // Get role.id from department_id and level_id
    const role = await this.userModel.manager.getRepository(RoleEntity).findOne({
      where: {
        departmentId: userRole.deptId,
        levelId: userRole.levelId,
      },
    });

    if (!role) {
      return [];
    }

    // Get permissions from role_default_permission
    const rolePermissions = await this.userModel.manager
      .createQueryBuilder()
      .select('permission.code', 'code')
      .from('role_default_permission', 'rdp')
      .innerJoin('permission', 'permission', 'permission.id = rdp.permission_id')
      .where('rdp.role_id = :roleId', { roleId: role.id })
      .andWhere('permission.is_active = :isActive', { isActive: 'Y' })
      .getRawMany();

    return rolePermissions.map((perm) =>
      Builder(UserPermissions).code(perm.code).build(),
    );
  }

  async updateUser(userId: number, payload: UpdateUserDto): Promise<User> {
    await this.userModel.update(
      { id: userId },
      {
        isActive: payload.isActive,
      },
    );

    const updatedUser = await this.userModel
      .createQueryBuilder('user')
      .where('user.id = :id', { id: userId })
      .getOne();

    return UserMapper.toDomain(updatedUser);
  }

  async updateUserRole(userId: number, payload: UpdateUserDto): Promise<User> {
    await this.userRoleModel.update(
      { userId: userId.toString() },
      {
        deptId: payload.deptId,
        levelId: payload.levelId,
        isActive: payload.isActive,
      },
    );

    const updatedUser = await this.userModel
      .createQueryBuilder('user')
      .where('user.id = :id', { id: userId })
      .getOne();

    return UserMapper.toDomain(updatedUser);
  }

  async updateUserZone(userId: number, payload: UpdateUserDto): Promise<User> {
    const zones = payload.zones || {};
    // 1. ดึง user_zone เดิมทั้งหมดของ user นี้
    const existingZones = await this.userZoneModel.find({
      where: { userId },
    });
    // 2. เตรียมข้อมูลใหม่จาก payload
    const newZonePairs: { zoneCode: string; subzoneCode: string }[] = [];
    Object.entries(zones).forEach(([zoneCode, subzoneArr]) => {
      (subzoneArr as string[]).forEach((subzoneCode) => {
        newZonePairs.push({ zoneCode, subzoneCode });
      });
    });
    // 3. หาอันที่ต้องลบ (มีใน DB แต่ไม่มีใน payload)
    const toDelete = existingZones.filter(
      (ez) =>
        !newZonePairs.some(
          (nz) => nz.zoneCode === ez.zoneCode && nz.subzoneCode === ez.subzoneCode,
        ),
    );
    // 4. หาอันที่ต้อง insert (มี in payload แต่ไม่มีใน DB)
    const toInsert = newZonePairs.filter(
      (nz) =>
        !existingZones.some(
          (ez) => ez.zoneCode === nz.zoneCode && ez.subzoneCode === nz.subzoneCode,
        ),
    );
    // 5. ลบรายการที่ไม่มีใน payload
    if (toDelete.length > 0) {
      await this.userZoneModel.delete(
        toDelete.map((ez) => ({
          userId,
          zoneCode: ez.zoneCode,
          subzoneCode: ez.subzoneCode,
        })),
      );
    }
    // 6. เพิ่มรายการใหม่
    if (toInsert.length > 0) {
      await this.userZoneModel.save(
        toInsert.map((nz) => ({
          userId, // ต้องใส่ userId ด้วย
          zoneCode: nz.zoneCode,
          subzoneCode: nz.subzoneCode,
        })),
      );
    }
    // 7. คืนค่า user ล่าสุด
    const updatedUser = await this.userModel
      .createQueryBuilder('user')
      .where('user.id = :id', { id: userId })
      .getOne();

    return UserMapper.toDomain(updatedUser);
  }

  async updateUserPermission(
    userId: number,
    data: { allow_permissions?: string[]; revoke_permissions?: string[] },
  ): Promise<void> {
    // Add new permissions
    if (data.allow_permissions && data.allow_permissions.length > 0) {
      for (const code of data.allow_permissions) {
        const exists = await this.userPermissionModel.findOne({
          where: { userId: userId, permissionCode: code },
        });
        if (!exists) {
          await this.userPermissionModel.save({
            userId: userId,
            permissionCode: code,
            createdDate: new Date(),
          });
        }
      }
    }
    // Remove permissions by code and userId
    if (data.revoke_permissions && data.revoke_permissions.length > 0) {
      await this.userPermissionModel
        .createQueryBuilder()
        .delete()
        .where('user_id = :userId', { userId: userId })
        .andWhere('permission_code IN (:...codes)', { codes: data.revoke_permissions })
        .execute();
    }
  }

  async getUserSevenProfile(userId: string): Promise<SevenProfileEntity[]> {
    return await this.sevenProfileModel.find({
      where: [
        { fcEmployeeId: userId },
        { mnEmployeeId: userId },
        { dvEmployeeId: userId },
        { gmEmployeeId: userId },
        { avpEmployeeId: userId },
      ],
    });
  }

  private buildBoundaryAreaPlaceholders(boundaryArea: [string, string][]): {
    placeholders: string;
    parameters: Record<string, string>;
  } {
    const parameters: Record<string, string> = {};
    const placeholders = boundaryArea
      .map((pair, index) => {
        const zoneParam = `zone${index}`;
        const subzoneParam = `subzone${index}`;

        parameters[zoneParam] = pair[0];
        parameters[subzoneParam] = pair[1];

        return `(:${zoneParam}, :${subzoneParam})`;
      })
      .join(',');

    return { placeholders, parameters };
  }

  async getSevenProfileByNoneUser(
    boundaryArea: [string, string][] = [],
  ): Promise<SevenProfileEntity[]> {
    const queryBuilder = this.sevenProfileModel
      .createQueryBuilder('sevenProfile')
      .where('sevenProfile.fcEmployeeId IS NULL')
      .andWhere('sevenProfile.mnEmployeeId IS NULL')
      .andWhere('sevenProfile.dvEmployeeId IS NULL')
      .andWhere('sevenProfile.gmEmployeeId IS NULL')
      .andWhere('sevenProfile.avpEmployeeId IS NULL');

    if (boundaryArea.length > 0) {
      const { placeholders, parameters } =
        this.buildBoundaryAreaPlaceholders(boundaryArea);
      queryBuilder.andWhere(
        `(sevenProfile.zoneCode, sevenProfile.subzoneCode) IN (${placeholders})`,
        parameters,
      );
    }

    const result = await queryBuilder.getMany();
    return result;
  }
}
