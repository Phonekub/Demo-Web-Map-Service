import { Test, TestingModule } from '@nestjs/testing';
import { SearchRolesUseCase } from './searchRoles.usecase';
import { RoleRepositoryPort } from '../../ports/role.repository';
import { RoleSearch } from '../../../domain/roleSearch';

describe('SearchRolesUseCase', () => {
  let useCase: SearchRolesUseCase;
  let mockRepository: jest.Mocked<RoleRepositoryPort>;

  const mockRoleSearchData: RoleSearch[] = [
    {
      id: 1,
      // roleName: 'Admin',
      department: 'IT',
      departmentId: 1,
      level: 'Senior',
      levelId: 1,
    },
    {
      id: 2,
      // roleName: 'Manager',
      department: 'Sales',
      departmentId: 2,
      level: 'Manager',
      levelId: 2,
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
        SearchRolesUseCase,
        {
          provide: 'RoleRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<SearchRolesUseCase>(SearchRolesUseCase);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return all roles when no filters provided', async () => {
      mockRepository.searchRoles.mockResolvedValue(mockRoleSearchData);

      const result = await useCase.execute();

      expect(result).toEqual(mockRoleSearchData);
      expect(mockRepository.searchRoles).toHaveBeenCalledWith(undefined, undefined);
    });

    // Removed: it('should search by role name', ...) because roleName is not a parameter

    it('should search by department', async () => {
      const filteredData = [mockRoleSearchData[0]];
      mockRepository.searchRoles.mockResolvedValue(filteredData);

      const result = await useCase.execute(1);

      expect(result).toEqual(filteredData);
      expect(mockRepository.searchRoles).toHaveBeenCalledWith(1, undefined);
    });

    it('should search by level', async () => {
      const filteredData = [mockRoleSearchData[1]];
      mockRepository.searchRoles.mockResolvedValue(filteredData);

      const result = await useCase.execute(undefined, 2);

      expect(result).toEqual(filteredData);
      expect(mockRepository.searchRoles).toHaveBeenCalledWith(undefined, 2);
    });

    it('should search with all filters', async () => {
      const filteredData = [mockRoleSearchData[0]];
      mockRepository.searchRoles.mockResolvedValue(filteredData);

      const result = await useCase.execute(1, 1);

      expect(result).toEqual(filteredData);
      expect(mockRepository.searchRoles).toHaveBeenCalledWith(1, 1);
    });

    it('should return empty array when no roles found', async () => {
      mockRepository.searchRoles.mockResolvedValue([]);

      const result = await useCase.execute(9999); // use a departmentId that doesn't exist

      expect(result).toEqual([]);
      expect(mockRepository.searchRoles).toHaveBeenCalledWith(9999, undefined);
    });
  });
});
