import { User } from '../../domain/user';
import { UserRole } from '../../domain/userrole';
import { Zone } from '../../domain/zone';
import { UserPermissions } from 'src/domain/permissions';
import { UpdateUserDto } from '../../adapter/inbound/dtos/update-user.dto';
import { Dropdown } from '../../domain/dropdown';
import { SevenProfileEntity } from 'src/adapter/outbound/repositories/entities/sevenProfile.entity';
import { UserWithZone } from '../../domain/userWithZone';

export interface UserRepositoryPort {
  findById(userId: number): Promise<User | undefined>;
  findUserByUsername(username: string): Promise<User | undefined>;
  findByNumber(employeeId: string): Promise<User | undefined>;
  findAll(
    search: string,
    page?: number,
    pageSize?: number,
  ): Promise<{ data: User[]; total: number }>;
  findAllUserWithZones(
    search: string,
    page?: number,
    pageSize?: number,
  ): Promise<{ data: UserWithZone[]; total: number }>;
  getUserRole(userId: number): Promise<UserRole | undefined>;
  getUserZone(userId: number): Promise<Zone[] | undefined>;
  getUserZonesDropdown(userId: number): Promise<Dropdown[]>;
  getUserSubZonesDropdown(userId: number, zone: string): Promise<Dropdown[]>;
  getUserPermissions(userId: number): Promise<UserPermissions[]>;
  updateUser(userId: number, user: UpdateUserDto): Promise<User>;
  updateUserRole(userId: number, user: UpdateUserDto): Promise<User>;
  updateUserZone(userId: number, user: UpdateUserDto): Promise<User>;
  updateUserPermission(
    userId: number,
    data: { allow_permissions?: string[]; revoke_permissions?: string[] },
  ): Promise<void>;
  getUserSevenProfile(userId: string): Promise<SevenProfileEntity[]>;
  getSevenProfileByNoneUser(
    boundaryArea?: [string, string][],
  ): Promise<SevenProfileEntity[]>;
}
