import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { CreateRoleUseCase } from './createRole.usecase';
import { RoleRepositoryPort } from '../../ports/role.repository';

describe('CreateRoleUseCase', () => {
  let useCase: CreateRoleUseCase;
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
        CreateRoleUseCase,
        {
          provide: 'RoleRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreateRoleUseCase>(CreateRoleUseCase);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should create a new role successfully', async () => {
      const mockNewRole = {
        id: 1,
        departmentId: 1,
        levelId: 1,
        permissionType: 'ZONE',
      };

      mockRepository.findByDepartmentAndLevel.mockResolvedValue(null);
      mockRepository.createRole.mockResolvedValue(mockNewRole);

      const result = await useCase.execute(1, 1, [1, 2, 3], 'ZONE');

      expect(result).toEqual(mockNewRole);
      expect(mockRepository.findByDepartmentAndLevel).toHaveBeenCalledWith(1, 1);
      expect(mockRepository.createRole).toHaveBeenCalledWith(1, 1, [1, 2, 3], 'ZONE');
    });

    it('should create role without permission type', async () => {
      const mockNewRole = {
        id: 2,
        departmentId: 2,
        levelId: 2,
      };

      mockRepository.findByDepartmentAndLevel.mockResolvedValue(null);
      mockRepository.createRole.mockResolvedValue(mockNewRole);

      const result = await useCase.execute(2, 2, []);

      expect(result).toEqual(mockNewRole);
      expect(mockRepository.createRole).toHaveBeenCalledWith(2, 2, [], undefined);
    });

    it('should throw error when department+level combination already exists', async () => {
      const existingRole = {
        id: 1,
        departmentId: 1,
        levelId: 1,
      };

      mockRepository.findByDepartmentAndLevel.mockResolvedValue(existingRole);

      await expect(useCase.execute(1, 1, [])).rejects.toThrow(HttpException);

      try {
        await useCase.execute(1, 1, []);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
        expect(error.getResponse()).toMatchObject({
          statusCode: HttpStatus.BAD_REQUEST,
          errorCode: 'ROLE_DEPARTMENT_LEVEL_DUPLICATE',
        });
      }

      expect(mockRepository.findByDepartmentAndLevel).toHaveBeenCalledWith(1, 1);
      expect(mockRepository.createRole).not.toHaveBeenCalled();
    });

    it('should create role with empty permissions array', async () => {
      const mockNewRole = {
        id: 3,
        departmentId: 1,
        levelId: 2,
      };

      mockRepository.findByDepartmentAndLevel.mockResolvedValue(null);
      mockRepository.createRole.mockResolvedValue(mockNewRole);

      const result = await useCase.execute(1, 2, []);

      expect(result).toEqual(mockNewRole);
      expect(mockRepository.createRole).toHaveBeenCalledWith(1, 2, [], undefined);
    });

    it('should create role with multiple permissions and permission type', async () => {
      const mockNewRole = {
        id: 4,
        departmentId: 2,
        levelId: 3,
        permissionType: 'STORE',
      };

      mockRepository.findByDepartmentAndLevel.mockResolvedValue(null);
      mockRepository.createRole.mockResolvedValue(mockNewRole);

      const result = await useCase.execute(2, 3, [1, 2, 3, 4, 5], 'STORE');

      expect(result).toEqual(mockNewRole);
      expect(mockRepository.createRole).toHaveBeenCalledWith(
        2,
        3,
        [1, 2, 3, 4, 5],
        'STORE',
      );
    });
  });
});
