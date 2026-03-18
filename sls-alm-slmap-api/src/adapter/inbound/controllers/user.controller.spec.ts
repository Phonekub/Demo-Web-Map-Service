import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { FindAllUserUseCase } from '../../../application/usecases/users/findAllUser.usecase';
import { UpdateUserUseCase } from '../../../application/usecases/users/updateUser.usecase';
import { GetUserRoleUseCase } from '../../../application/usecases/users/getUserRole.usecase';
import { GetUserZonesUseCase } from '../../../application/usecases/users/getUserZones.usecase';
import { GetUserSubZonesUseCase } from '../../../application/usecases/users/getUserSubZones.usecase';
import { FindAllUserWithZonesUseCase } from '../../../application/usecases/users/findAllUserWithZones.usecase';
import { CustomRequest } from '../interfaces/requests/customRequest';

describe('UserController', () => {
  let controller: UserController;

  let findAllUserUseCase: jest.Mocked<FindAllUserUseCase>;
  let updateUserUseCase: jest.Mocked<UpdateUserUseCase>;
  let getUserRoleUseCase: jest.Mocked<GetUserRoleUseCase>;
  let getUserZonesUseCase: jest.Mocked<GetUserZonesUseCase>;
  let getUserSubZonesUseCase: jest.Mocked<GetUserSubZonesUseCase>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: FindAllUserUseCase, useValue: { handler: jest.fn() } },
        { provide: FindAllUserWithZonesUseCase, useValue: { handler: jest.fn() } },
        { provide: UpdateUserUseCase, useValue: { handler: jest.fn() } },
        { provide: GetUserRoleUseCase, useValue: { handler: jest.fn() } },
        { provide: GetUserZonesUseCase, useValue: { handler: jest.fn() } },
        { provide: GetUserSubZonesUseCase, useValue: { handler: jest.fn() } },
      ],
    }).compile();

    controller = module.get(UserController);

    findAllUserUseCase = module.get(FindAllUserUseCase);
    updateUserUseCase = module.get(UpdateUserUseCase);
    getUserRoleUseCase = module.get(GetUserRoleUseCase);
    getUserZonesUseCase = module.get(GetUserZonesUseCase);
    getUserSubZonesUseCase = module.get(GetUserSubZonesUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should pass through search/page/pageSize and default search to empty string', async () => {
      const mockResult = {
        data: [{ id: 1, fullName: 'Test User' }],
        total: 1,
        page: 1,
        pageSize: 10,
      };
      findAllUserUseCase.handler.mockResolvedValue(mockResult as any);

      const result = await controller.findAll({ page: 1, pageSize: 10 });

      expect(findAllUserUseCase.handler).toHaveBeenCalledWith('', 1, 10);
      expect(result).toBe(mockResult);
    });

    it('should forward search when provided', async () => {
      const mockResult = { data: [], total: 0 };
      findAllUserUseCase.handler.mockResolvedValue(mockResult as any);

      const result = await controller.findAll({
        search: 'john',
        page: 2,
        pageSize: 20,
      });

      expect(findAllUserUseCase.handler).toHaveBeenCalledWith('john', 2, 20);
      expect(result).toBe(mockResult);
    });

    it('should propagate errors from use case', async () => {
      findAllUserUseCase.handler.mockRejectedValue(new Error('boom'));

      await expect(
        controller.findAll({ search: 'x', page: 1, pageSize: 10 }),
      ).rejects.toThrow('boom');
    });
  });

  describe('getProfile', () => {
    it('should return profile data mapped from req.user', async () => {
      const req = {
        user: {
          id: 123,
          employeeId: 'E001',
          fullName: 'Jane Doe',
          permissions: ['P1', 'P2'],
          roleId: 9,
        },
      } as unknown as CustomRequest;

      const result = await controller.getProfile(req);

      expect(result).toEqual({
        data: {
          id: 123,
          employeeId: 'E001',
          fullName: 'Jane Doe',
          permissions: ['P1', 'P2'],
          roleId: 9,
        },
      });
    });
  });

  describe('getUserZones', () => {
    it('should call getUserZonesUseCase with userId from req.user and wrap result in data', async () => {
      const req = { user: { id: 7 } } as unknown as CustomRequest;
      const mockZones = [{ zoneCode: 'Z001' }, { zoneCode: 'Z002' }];
      getUserZonesUseCase.handler.mockResolvedValue(mockZones as any);

      const result = await controller.getUserZones(req);

      expect(getUserZonesUseCase.handler).toHaveBeenCalledWith(7);
      expect(result).toEqual({ data: mockZones });
    });

    it('should propagate errors from use case', async () => {
      const req = { user: { id: 7 } } as unknown as CustomRequest;
      getUserZonesUseCase.handler.mockRejectedValue(new Error('db down'));

      await expect(controller.getUserZones(req)).rejects.toThrow('db down');
    });
  });

  describe('getUserSubZones', () => {
    it('should call getUserSubZonesUseCase with userId and zone and wrap result in data', async () => {
      const req = { user: { id: 11 } } as unknown as CustomRequest;
      const mockSubZones = [{ subZoneCode: 'SZ001' }];
      getUserSubZonesUseCase.handler.mockResolvedValue(mockSubZones as any);

      const result = await controller.getUserSubZones(req, 'Z001');

      expect(getUserSubZonesUseCase.handler).toHaveBeenCalledWith(11, 'Z001');
      expect(result).toEqual({ data: mockSubZones });
    });

    it('should propagate errors from use case', async () => {
      const req = { user: { id: 11 } } as unknown as CustomRequest;
      getUserSubZonesUseCase.handler.mockRejectedValue(new Error('boom'));

      await expect(controller.getUserSubZones(req, 'Z001')).rejects.toThrow('boom');
    });
  });

  describe('getUserRole', () => {
    it('should call getUserRoleUseCase with userId and wrap in data', async () => {
      const mockRole = { userId: 5, roleId: 2, roleName: 'Admin' };
      getUserRoleUseCase.handler.mockResolvedValue(mockRole as any);

      const result = await controller.getUserRole(5);

      expect(getUserRoleUseCase.handler).toHaveBeenCalledWith(5);
      expect(result).toEqual({ data: mockRole });
    });

    it('should propagate errors from use case', async () => {
      getUserRoleUseCase.handler.mockRejectedValue(new Error('not found'));

      await expect(controller.getUserRole(999)).rejects.toThrow('not found');
    });
  });

  describe('updateUser', () => {
    it('should call updateUserUseCase with (userId, body) and return the usecase result', async () => {
      const body = {
        roleId: 3,
      } as any;

      const mockResult = { success: true };
      updateUserUseCase.handler.mockResolvedValue(mockResult as any);

      const result = await controller.updateUser(10, body);

      expect(updateUserUseCase.handler).toHaveBeenCalledWith(10, body);
      expect(result).toBe(mockResult);
    });

    it('should propagate errors from use case', async () => {
      updateUserUseCase.handler.mockRejectedValue(new Error('update failed'));

      await expect(controller.updateUser(10, { roleId: 1 } as any)).rejects.toThrow(
        'update failed',
      );
    });
  });
});
