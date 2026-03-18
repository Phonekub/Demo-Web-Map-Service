import { Test, TestingModule } from '@nestjs/testing';
import { GetRolePermissionsUseCase } from './getRolePermissions.usecase';
import { RoleRepositoryPort } from '../../ports/role.repository';
import { RolePermissions } from '../../../domain/rolePermissions';

describe('GetRolePermissionsUseCase', () => {
  let useCase: GetRolePermissionsUseCase;
  let mockRepository: jest.Mocked<RoleRepositoryPort>;

  const mockRolePermissions: RolePermissions = {
    roleId: 1,
    permissionIds: [1, 2, 3, 4, 5],
  };

  beforeEach(async () => {
    mockRepository = {
      searchRoles: jest.fn(),
      getAllDepartment: jest.fn(),
      getAllLevels: jest.fn(),
      getAllZones: jest.fn(),
      getAllRoles: jest.fn(),
      getAllPermissionGroups: jest.fn(),
      getRolePermissions: jest.fn(),
      updateRolePermissions: jest.fn(),
      findByDepartmentAndLevel: jest.fn(),
      createRole: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetRolePermissionsUseCase,
        {
          provide: 'RoleRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetRolePermissionsUseCase>(GetRolePermissionsUseCase);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('handler', () => {
    it('should return role permissions', async () => {
      mockRepository.getRolePermissions.mockResolvedValue(mockRolePermissions);

      const result = await useCase.handler(1);

      expect(result).toEqual(mockRolePermissions);
      expect(mockRepository.getRolePermissions).toHaveBeenCalledWith(1);
    });

    it('should return role with empty permissions', async () => {
      const emptyPermissions: RolePermissions = {
        roleId: 2,
        permissionIds: [],
      };

      mockRepository.getRolePermissions.mockResolvedValue(emptyPermissions);

      const result = await useCase.handler(2);

      expect(result).toEqual(emptyPermissions);
      expect(result.permissionIds).toHaveLength(0);
    });

    it('should handle different role IDs', async () => {
      const rolePermissions: RolePermissions = {
        roleId: 999,
        permissionIds: [10, 20, 30],
      };

      mockRepository.getRolePermissions.mockResolvedValue(rolePermissions);

      const result = await useCase.handler(999);

      expect(result).toEqual(rolePermissions);
      expect(mockRepository.getRolePermissions).toHaveBeenCalledWith(999);
    });
  });
});
