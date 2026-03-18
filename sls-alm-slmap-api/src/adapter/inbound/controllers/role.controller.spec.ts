import { Test, TestingModule } from '@nestjs/testing';
import { RoleController } from './role.controller';
import { GetAllDepartmentUseCase } from '../../../application/usecases/role/getAllDepartment.usecase';
import { GetAllLevelsUseCase } from '../../../application/usecases/role/getAllLevels.usecase';
import { GetAllZonesUseCase } from '../../../application/usecases/role/getAllZones.usecase';
import { GetAllPermissionGroupsUseCase } from '../../../application/usecases/role/getAllPermissionGroups.usecase';
import { GetRolePermissionsUseCase } from '../../../application/usecases/role/getRolePermissions.usecase';
import { UpdateRolePermissionsUseCase } from '../../../application/usecases/role/updateRolePermissions.usecase';
import { CreateRoleUseCase } from '../../../application/usecases/role/createRole.usecase';
import { SearchRolesUseCase } from '../../../application/usecases/role/searchRoles.usecase';

describe('RoleController', () => {
  let controller: RoleController;
  let getAllDepartmentUseCase: jest.Mocked<GetAllDepartmentUseCase>;
  let getAllLevelsUseCase: jest.Mocked<GetAllLevelsUseCase>;
  let getAllPermissionGroupsUseCase: jest.Mocked<GetAllPermissionGroupsUseCase>;
  let getRolePermissionsUseCase: jest.Mocked<GetRolePermissionsUseCase>;
  let updateRolePermissionsUseCase: jest.Mocked<UpdateRolePermissionsUseCase>;
  let createRoleUseCase: jest.Mocked<CreateRoleUseCase>;
  let searchRolesUseCase: jest.Mocked<SearchRolesUseCase>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoleController],
      providers: [
        {
          provide: GetAllDepartmentUseCase,
          useValue: { handler: jest.fn() },
        },
        {
          provide: GetAllLevelsUseCase,
          useValue: { handler: jest.fn() },
        },
        {
          provide: GetAllZonesUseCase,
          useValue: { handler: jest.fn() },
        },
        {
          provide: GetAllPermissionGroupsUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetRolePermissionsUseCase,
          useValue: { handler: jest.fn() },
        },
        {
          provide: UpdateRolePermissionsUseCase,
          useValue: { handler: jest.fn() },
        },
        {
          provide: CreateRoleUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: SearchRolesUseCase,
          useValue: { execute: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<RoleController>(RoleController);
    getAllDepartmentUseCase = module.get(GetAllDepartmentUseCase);
    getAllLevelsUseCase = module.get(GetAllLevelsUseCase);
    getAllPermissionGroupsUseCase = module.get(GetAllPermissionGroupsUseCase);
    getRolePermissionsUseCase = module.get(GetRolePermissionsUseCase);
    updateRolePermissionsUseCase = module.get(UpdateRolePermissionsUseCase);
    createRoleUseCase = module.get(CreateRoleUseCase);
    searchRolesUseCase = module.get(SearchRolesUseCase);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('searchRoles', () => {
    it('should search roles with all filters', async () => {
      const mockRoles = [
        {
          id: 1,
          roleName: 'Admin',
          department: 'IT',
          departmentId: 1,
          level: 'Senior',
          levelId: 1,
        },
      ];

      searchRolesUseCase.execute.mockResolvedValue(mockRoles);

      const result = await controller.searchRoles('1', '1');

      expect(result).toEqual({ data: mockRoles });
      expect(searchRolesUseCase.execute).toHaveBeenCalledWith(1, 1);
    });

    it('should search roles without filters', async () => {
      const mockRoles = [
        {
          id: 1,
          roleName: 'Test',
          department: 'IT',
          departmentId: 1,
          level: 'Mid',
          levelId: 2,
        },
      ];
      searchRolesUseCase.execute.mockResolvedValue(mockRoles);

      const result = await controller.searchRoles();

      expect(result).toEqual({ data: mockRoles });
      expect(searchRolesUseCase.execute).toHaveBeenCalledWith(undefined, undefined);
    });
  });

  describe('getAllPermissionGroups', () => {
    it('should get permission groups with Thai language by default', async () => {
      const mockGroups = [
        { permissionGroupId: 1, permissionGroupName: 'Dashboard', permissions: [] },
      ];
      getAllPermissionGroupsUseCase.execute.mockResolvedValue(mockGroups);

      const result = await controller.getAllPermissionGroups();

      expect(result).toEqual({ data: mockGroups });
      expect(getAllPermissionGroupsUseCase.execute).toHaveBeenCalledWith('th');
    });

    it('should get permission groups with specified language', async () => {
      const mockGroups = [
        { permissionGroupId: 1, permissionGroupName: 'Dashboard', permissions: [] },
      ];
      getAllPermissionGroupsUseCase.execute.mockResolvedValue(mockGroups);

      const result = await controller.getAllPermissionGroups('en');

      expect(result).toEqual({ data: mockGroups });
      expect(getAllPermissionGroupsUseCase.execute).toHaveBeenCalledWith('en');
    });
  });

  describe('getRolePermissions', () => {
    it('should get role permissions by roleId', async () => {
      const mockPermissions = { roleId: 1, roleName: 'Admin', permissionIds: [1, 2, 3] };
      getRolePermissionsUseCase.handler.mockResolvedValue(mockPermissions);

      const result = await controller.getRolePermissions(1);

      expect(result).toEqual({ data: mockPermissions });
      expect(getRolePermissionsUseCase.handler).toHaveBeenCalledWith(1);
    });
  });

  describe('updateRolePermissions', () => {
    it('should update role permissions with valid data', async () => {
      updateRolePermissionsUseCase.handler.mockResolvedValue(undefined);

      const dto = { roleId: 1, permissionIds: [1, 2, 3], permissionType: 'full' };
      const result = await controller.updateRolePermissions(dto);

      expect(result).toEqual({ message: 'Permissions updated successfully' });
      expect(updateRolePermissionsUseCase.handler).toHaveBeenCalledWith(
        1,
        [1, 2, 3],
        'full',
      );
    });

    it('should handle empty permission IDs', async () => {
      updateRolePermissionsUseCase.handler.mockResolvedValue(undefined);

      const dto = { roleId: 1, permissionIds: [], permissionType: 'full' };
      const result = await controller.updateRolePermissions(dto);

      expect(result).toEqual({ message: 'Permissions updated successfully' });
      expect(updateRolePermissionsUseCase.handler).toHaveBeenCalledWith(1, [], 'full');
    });

    it('should handle null permission IDs', async () => {
      updateRolePermissionsUseCase.handler.mockResolvedValue(undefined);

      const dto = { roleId: 1, permissionIds: [], permissionType: undefined };
      const result = await controller.updateRolePermissions(dto);

      expect(result).toEqual({ message: 'Permissions updated successfully' });
      expect(updateRolePermissionsUseCase.handler).toHaveBeenCalledWith(1, [], undefined);
    });
  });

  describe('createRole', () => {
    it('should create role successfully', async () => {
      const mockNewRole = { id: 1, roleName: 'New Role', departmentId: 1, levelId: 1 };
      createRoleUseCase.execute.mockResolvedValue(mockNewRole);

      const dto = {
        departmentId: 1,
        levelId: 1,
        permissionIds: [1, 2, 3],
        permissionType: 'full',
      };
      const result = await controller.createRole(dto);

      expect(result).toEqual({ data: mockNewRole, message: 'Role created successfully' });
      expect(createRoleUseCase.execute).toHaveBeenCalledWith(1, 1, [1, 2, 3], 'full');
    });

    it('should create role with empty permissions', async () => {
      const mockNewRole = { id: 2, roleName: 'Empty Role', departmentId: 2, levelId: 2 };
      createRoleUseCase.execute.mockResolvedValue(mockNewRole);

      const dto = {
        departmentId: 2,
        levelId: 2,
        permissionIds: [],
        permissionType: 'full',
      };
      const result = await controller.createRole(dto);

      expect(result).toEqual({ data: mockNewRole, message: 'Role created successfully' });
      expect(createRoleUseCase.execute).toHaveBeenCalledWith(2, 2, [], 'full');
    });

    it('should create role with null permissions', async () => {
      const mockNewRole = { id: 3, roleName: 'Null Perms', departmentId: 1, levelId: 2 };
      createRoleUseCase.execute.mockResolvedValue(mockNewRole);

      const dto = {
        departmentId: 1,
        levelId: 2,
        permissionIds: [],
        permissionType: undefined,
      };
      const result = await controller.createRole(dto);

      expect(result).toEqual({ data: mockNewRole, message: 'Role created successfully' });
      expect(createRoleUseCase.execute).toHaveBeenCalledWith(1, 2, [], undefined);
    });
  });
});
