import { Test, TestingModule } from '@nestjs/testing';
import { UpdateRolePermissionsUseCase } from './updateRolePermissions.usecase';
import { RoleRepositoryPort } from '../../ports/role.repository';

describe('UpdateRolePermissionsUseCase', () => {
  let useCase: UpdateRolePermissionsUseCase;
  let mockRepository: jest.Mocked<RoleRepositoryPort>;

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
        UpdateRolePermissionsUseCase,
        {
          provide: 'RoleRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<UpdateRolePermissionsUseCase>(UpdateRolePermissionsUseCase);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('handler', () => {
    it('should update role permissions successfully', async () => {
      mockRepository.updateRolePermissions.mockResolvedValue(undefined);

      await useCase.handler(1, [1, 2, 3]);

      expect(mockRepository.updateRolePermissions).toHaveBeenCalledWith(
        1,
        [1, 2, 3],
        undefined,
      );
    });

    it('should update role with empty permissions', async () => {
      mockRepository.updateRolePermissions.mockResolvedValue(undefined);

      await useCase.handler(1, []);

      expect(mockRepository.updateRolePermissions).toHaveBeenCalledWith(1, [], undefined);
    });

    it('should update role permissions with permission type', async () => {
      mockRepository.updateRolePermissions.mockResolvedValue(undefined);

      await useCase.handler(2, [1, 2], 'ZONE');

      expect(mockRepository.updateRolePermissions).toHaveBeenCalledWith(
        2,
        [1, 2],
        'ZONE',
      );
    });

    it('should clear permission type when empty string is provided', async () => {
      mockRepository.updateRolePermissions.mockResolvedValue(undefined);

      await useCase.handler(3, [1, 2], '');

      expect(mockRepository.updateRolePermissions).toHaveBeenCalledWith(3, [1, 2], '');
    });

    it('should handle repository errors', async () => {
      const error = new Error('Database error');
      mockRepository.updateRolePermissions.mockRejectedValue(error);

      await expect(useCase.handler(1, [1, 2])).rejects.toThrow('Database error');
    });
  });
});
