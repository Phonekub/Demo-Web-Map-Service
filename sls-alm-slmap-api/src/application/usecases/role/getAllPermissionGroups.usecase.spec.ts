import { Test, TestingModule } from '@nestjs/testing';
import { GetAllPermissionGroupsUseCase } from './getAllPermissionGroups.usecase';
import { RoleRepositoryPort } from '../../ports/role.repository';
import { PermissionGroup } from '../../../domain/permissionGroup';

describe('GetAllPermissionGroupsUseCase', () => {
  let useCase: GetAllPermissionGroupsUseCase;
  let mockRepository: jest.Mocked<RoleRepositoryPort>;

  const mockPermissionGroups: PermissionGroup[] = [
    {
      permissionGroupId: 1,
      permissionGroupName: 'Dashboard',
      permissions: [
        {
          permissionId: 1,
          permissionName: 'View Dashboard',
          permissionGroupId: 1,
        },
        {
          permissionId: 2,
          permissionName: 'Edit Dashboard',
          permissionGroupId: 1,
          parentId: 1,
        },
      ],
    },
    {
      permissionGroupId: 2,
      permissionGroupName: 'User Management',
      permissions: [
        {
          permissionId: 3,
          permissionName: 'View Users',
          permissionGroupId: 2,
        },
      ],
    },
  ];

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
        GetAllPermissionGroupsUseCase,
        {
          provide: 'RoleRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetAllPermissionGroupsUseCase>(GetAllPermissionGroupsUseCase);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return permission groups in Thai language by default', async () => {
      mockRepository.getAllPermissionGroups.mockResolvedValue(mockPermissionGroups);

      const result = await useCase.execute();

      expect(result).toEqual(mockPermissionGroups);
      expect(mockRepository.getAllPermissionGroups).toHaveBeenCalledWith('th');
    });

    it('should return permission groups in English', async () => {
      mockRepository.getAllPermissionGroups.mockResolvedValue(mockPermissionGroups);

      const result = await useCase.execute('en');

      expect(result).toEqual(mockPermissionGroups);
      expect(mockRepository.getAllPermissionGroups).toHaveBeenCalledWith('en');
    });

    it('should return permission groups in Khmer', async () => {
      mockRepository.getAllPermissionGroups.mockResolvedValue(mockPermissionGroups);

      const result = await useCase.execute('km');

      expect(result).toEqual(mockPermissionGroups);
      expect(mockRepository.getAllPermissionGroups).toHaveBeenCalledWith('km');
    });

    it('should handle empty permission groups', async () => {
      mockRepository.getAllPermissionGroups.mockResolvedValue([]);

      const result = await useCase.execute('th');

      expect(result).toEqual([]);
      expect(mockRepository.getAllPermissionGroups).toHaveBeenCalledWith('th');
    });
  });
});
