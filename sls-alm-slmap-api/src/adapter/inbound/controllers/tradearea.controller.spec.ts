import { Test, TestingModule } from '@nestjs/testing';
import { TradeareaController } from './tradearea.controller';

import { GetAllTradeareaUseCase } from '../../../application/usecases/tradearea/getAllTradearea.usecase';
import { GetTradeareaByIdUseCase } from '../../../application/usecases/tradearea/getTradeareaById.usecase';
import { GetTradeareaByStoreCodeUseCase } from '../../../application/usecases/tradearea/getTradeareaByStoreCode.usecase';
import { GetTradeareaByZoneUseCase } from '../../../application/usecases/tradearea/getTradeareaByZone.usecase';
import { GetTradeareaBySubzoneUseCase } from '../../../application/usecases/tradearea/getTradeareaBySubzone.usecase';
import { CheckPointInTradeareaUseCase } from '../../../application/usecases/tradearea/checkPointInTradearea.usecase';
import { CheckOverlapUseCase } from '../../../application/usecases/tradearea/checkOverlap.usecase';
import { CreateTradeareaUseCase } from '../../../application/usecases/tradearea/createTradearea.usecase';
import { UpdateTradeareaUseCase } from '../../../application/usecases/tradearea/updateTradearea.usecase';
import { SpatialSearchUseCase } from '../../../application/usecases/locations/spatialSearch.usecase';
import { SubmitTradeareaApprovalUseCase } from '../../../application/usecases/tradearea/submitTradeareaApproval.usecase';
import { GetTradeareasPendingApprovalUseCase } from '../../../application/usecases/tradearea/getTradeareasPendingApproval.usecase';
import { FindPoiTradeareaUseCase } from '../../../application/usecases/tradearea/findPoiTradearea.usecase';
import { UpdateTradeareaApproveUseCase } from '../../../application/usecases/tradearea/updateTradeareaApprove.usecase';
import { FindTradeareaTypeUseCase } from '../../../application/usecases/tradearea/findTradeareaType.usecase';
import { DeleteTradeareaUseCase } from '../../../application/usecases/tradearea/deleteTradearea.usecase';
import { GetTradeareaByPoiUseCase } from '../../../application/usecases/tradearea/getTradeareaByPoi.usecase';
import { CreateChildTradeareaUseCase } from '../../../application/usecases/tradearea/createChildTradearea.usecase';

import { CustomRequest } from '../interfaces/requests/customRequest';

describe('TradeareaController', () => {
  let controller: TradeareaController;

  let getAllTradeareaUseCase: jest.Mocked<GetAllTradeareaUseCase>;
  let getTradeareaByIdUseCase: jest.Mocked<GetTradeareaByIdUseCase>;
  let getTradeareaByStoreCodeUseCase: jest.Mocked<GetTradeareaByStoreCodeUseCase>;
  let getTradeareaByZoneUseCase: jest.Mocked<GetTradeareaByZoneUseCase>;
  let getTradeareaBySubzoneUseCase: jest.Mocked<GetTradeareaBySubzoneUseCase>;
  let checkPointInTradeareaUseCase: jest.Mocked<CheckPointInTradeareaUseCase>;
  let checkOverlapUseCase: jest.Mocked<CheckOverlapUseCase>;
  let createTradeareaUseCase: jest.Mocked<CreateTradeareaUseCase>;
  let updateTradeareaUseCase: jest.Mocked<UpdateTradeareaUseCase>;
  let spatialSearchUseCase: jest.Mocked<SpatialSearchUseCase>;
  let submitApprovalUseCase: jest.Mocked<SubmitTradeareaApprovalUseCase>;
  let getTradeareasPendingApprovalUseCase: jest.Mocked<GetTradeareasPendingApprovalUseCase>;
  let findPoiTradeareaUseCase: jest.Mocked<FindPoiTradeareaUseCase>;
  let updateTradeareaApproveUseCase: jest.Mocked<UpdateTradeareaApproveUseCase>;
  let findTradeareaTypeUseCase: jest.Mocked<FindTradeareaTypeUseCase>;
  let deleteTradeareaUseCase: jest.Mocked<DeleteTradeareaUseCase>;
  let getTradeareaByPoiUseCase: jest.Mocked<GetTradeareaByPoiUseCase>;
  let createChildTradeareaUseCase: jest.Mocked<CreateChildTradeareaUseCase>;

  const mockReq = {
    user: {
      id: 123,
      roleId: 7,
      zoneCodes: { Z001: ['SZ001'] },
    },
  } as unknown as CustomRequest;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TradeareaController],
      providers: [
        { provide: GetAllTradeareaUseCase, useValue: { handler: jest.fn() } },
        { provide: GetTradeareaByIdUseCase, useValue: { handler: jest.fn() } },
        { provide: GetTradeareaByStoreCodeUseCase, useValue: { handler: jest.fn() } },
        { provide: GetTradeareaByZoneUseCase, useValue: { handler: jest.fn() } },
        { provide: GetTradeareaBySubzoneUseCase, useValue: { handler: jest.fn() } },
        { provide: CheckPointInTradeareaUseCase, useValue: { handler: jest.fn() } },
        { provide: CheckOverlapUseCase, useValue: { handler: jest.fn() } },
        { provide: CreateTradeareaUseCase, useValue: { handler: jest.fn() } },
        { provide: UpdateTradeareaUseCase, useValue: { handler: jest.fn() } },
        { provide: SpatialSearchUseCase, useValue: { handler: jest.fn() } },
        { provide: SubmitTradeareaApprovalUseCase, useValue: { handler: jest.fn() } },
        {
          provide: GetTradeareasPendingApprovalUseCase,
          useValue: { handler: jest.fn() },
        },
        { provide: FindPoiTradeareaUseCase, useValue: { handler: jest.fn() } },
        { provide: UpdateTradeareaApproveUseCase, useValue: { handler: jest.fn() } },
        { provide: FindTradeareaTypeUseCase, useValue: { handler: jest.fn() } },
        { provide: DeleteTradeareaUseCase, useValue: { handler: jest.fn() } },
        { provide: GetTradeareaByPoiUseCase, useValue: { handler: jest.fn() } },
        { provide: CreateChildTradeareaUseCase, useValue: { handler: jest.fn() } },
      ],
    }).compile();

    controller = module.get(TradeareaController);

    getAllTradeareaUseCase = module.get(GetAllTradeareaUseCase);
    getTradeareaByIdUseCase = module.get(GetTradeareaByIdUseCase);
    getTradeareaByStoreCodeUseCase = module.get(GetTradeareaByStoreCodeUseCase);
    getTradeareaByZoneUseCase = module.get(GetTradeareaByZoneUseCase);
    getTradeareaBySubzoneUseCase = module.get(GetTradeareaBySubzoneUseCase);
    checkPointInTradeareaUseCase = module.get(CheckPointInTradeareaUseCase);
    checkOverlapUseCase = module.get(CheckOverlapUseCase);
    createTradeareaUseCase = module.get(CreateTradeareaUseCase);
    updateTradeareaUseCase = module.get(UpdateTradeareaUseCase);
    spatialSearchUseCase = module.get(SpatialSearchUseCase);
    submitApprovalUseCase = module.get(SubmitTradeareaApprovalUseCase);
    getTradeareasPendingApprovalUseCase = module.get(GetTradeareasPendingApprovalUseCase);
    findPoiTradeareaUseCase = module.get(FindPoiTradeareaUseCase);
    updateTradeareaApproveUseCase = module.get(UpdateTradeareaApproveUseCase);
    findTradeareaTypeUseCase = module.get(FindTradeareaTypeUseCase);
    deleteTradeareaUseCase = module.get(DeleteTradeareaUseCase);
    getTradeareaByPoiUseCase = module.get(GetTradeareaByPoiUseCase);
    createChildTradeareaUseCase = module.get(CreateChildTradeareaUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllTradeareas', () => {
    it('should call usecase with defaults when optional params are missing', async () => {
      const mockResult = { data: [], total: 0 };
      getAllTradeareaUseCase.handler.mockResolvedValue(mockResult as any);

      const result = await controller.getAllTradeareas();

      expect(getAllTradeareaUseCase.handler).toHaveBeenCalledWith(
        '',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
      );
      expect(result).toBe(mockResult);
    });

    it('should pass through query params', async () => {
      const mockResult = { data: [{ id: 1 }], total: 1 };
      getAllTradeareaUseCase.handler.mockResolvedValue(mockResult as any);

      const result = await controller.getAllTradeareas(
        'abc',
        2,
        'id',
        'desc',
        50,
        'ACTIVE',
      );

      expect(getAllTradeareaUseCase.handler).toHaveBeenCalledWith(
        'abc',
        2,
        'id',
        'desc',
        50,
        'ACTIVE',
      );
      expect(result).toBe(mockResult);
    });
  });

  describe('getPendingApproval', () => {
    it('should call usecase with wfId and roleId from request', async () => {
      const mockItems = [{ id: 1 }, { id: 2 }];
      getTradeareasPendingApprovalUseCase.handler.mockResolvedValue(mockItems as any);

      const result = await controller.getPendingApproval(mockReq, 99);

      expect(getTradeareasPendingApprovalUseCase.handler).toHaveBeenCalledWith(
        99,
        mockReq.user.roleId,
      );
      expect(result).toEqual({ data: mockItems });
    });

    it('should allow wfId to be undefined', async () => {
      getTradeareasPendingApprovalUseCase.handler.mockResolvedValue([] as any);

      const result = await controller.getPendingApproval(mockReq, undefined);

      expect(getTradeareasPendingApprovalUseCase.handler).toHaveBeenCalledWith(
        undefined,
        mockReq.user.roleId,
      );
      expect(result).toEqual({ data: [] });
    });
  });

  describe('getTradeareaTypes', () => {
    it('should return types wrapped in data', async () => {
      const mockTypes = [{ id: 1, name: 'A' }];
      findTradeareaTypeUseCase.handler.mockResolvedValue(mockTypes as any);

      const result = await controller.getTradeareaTypes();

      expect(findTradeareaTypeUseCase.handler).toHaveBeenCalled();
      expect(result).toEqual({ data: mockTypes });
    });
  });

  describe('getById', () => {
    it('should return tradearea by id wrapped in data', async () => {
      const mockTradearea = { id: 10 };
      getTradeareaByIdUseCase.handler.mockResolvedValue(mockTradearea as any);

      const result = await controller.getById(10);

      expect(getTradeareaByIdUseCase.handler).toHaveBeenCalledWith(10);
      expect(result).toEqual({ data: mockTradearea });
    });
  });

  describe('getByStoreCode', () => {
    it('should return results and total', async () => {
      const mockList = [{ id: 1 }, { id: 2 }, { id: 3 }];
      getTradeareaByStoreCodeUseCase.handler.mockResolvedValue(mockList as any);

      const result = await controller.getByStoreCode('S001', 'MAIN');

      expect(getTradeareaByStoreCodeUseCase.handler).toHaveBeenCalledWith('S001', 'MAIN');
      expect(result).toEqual({ data: mockList, total: 3 });
    });

    it('should return total=0 when empty', async () => {
      getTradeareaByStoreCodeUseCase.handler.mockResolvedValue([] as any);

      const result = await controller.getByStoreCode('S001', 'MAIN');

      expect(result).toEqual({ data: [], total: 0 });
    });
  });

  describe('getByZone', () => {
    it('should return results and total', async () => {
      const mockList = [{ id: 1 }];
      getTradeareaByZoneUseCase.handler.mockResolvedValue(mockList as any);

      const result = await controller.getByZone('Z001');

      expect(getTradeareaByZoneUseCase.handler).toHaveBeenCalledWith('Z001');
      expect(result).toEqual({ data: mockList, total: 1 });
    });
  });

  describe('getBySubzone', () => {
    it('should return results and total', async () => {
      const mockList = [{ id: 1 }, { id: 2 }];
      getTradeareaBySubzoneUseCase.handler.mockResolvedValue(mockList as any);

      const result = await controller.getBySubzone('Z001', 'SZ001');

      expect(getTradeareaBySubzoneUseCase.handler).toHaveBeenCalledWith('Z001', 'SZ001');
      expect(result).toEqual({ data: mockList, total: 2 });
    });
  });

  describe('spatialSearch', () => {
    it('should pass query and user zoneCodes and return {data,total}', async () => {
      const query = { any: 'payload' } as any;
      spatialSearchUseCase.handler.mockResolvedValue([[{ id: 1 }], 1] as any);

      const result = await controller.spatialSearch(mockReq, query);

      expect(spatialSearchUseCase.handler).toHaveBeenCalledWith(query, mockReq.user);
      expect(result).toEqual({ data: [{ id: 1 }], total: 1 });
    });
  });

  describe('checkPoint', () => {
    it('should return handler result wrapped in data', async () => {
      const mock = { inside: true };
      checkPointInTradeareaUseCase.handler.mockResolvedValue(mock as any);

      const result = await controller.checkPoint(100.123, 13.456);

      expect(checkPointInTradeareaUseCase.handler).toHaveBeenCalledWith(100.123, 13.456);
      expect(result).toEqual({ data: mock });
    });
  });

  describe('checkOverlap', () => {
    it('should return usecase response as-is', async () => {
      const dto = { foo: 'bar' } as any;
      const mockRes = { success: true };
      checkOverlapUseCase.handler.mockResolvedValue(mockRes as any);

      const result = await controller.checkOverlap(dto);

      expect(checkOverlapUseCase.handler).toHaveBeenCalledWith(dto);
      expect(result).toBe(mockRes);
    });
  });

  describe('create', () => {
    it('should call create usecase with dto and userId and wrap response', async () => {
      const dto = { name: 'TA' } as any;
      const created = { id: 1 };
      createTradeareaUseCase.handler.mockResolvedValue(created as any);

      const result = await controller.create(mockReq, dto);

      expect(createTradeareaUseCase.handler).toHaveBeenCalledWith(dto, mockReq.user.id);
      expect(result).toEqual({
        message: 'Trade area created successfully',
        data: created,
      });
    });
  });

  describe('update', () => {
    it('should merge id into payload and call update usecase', async () => {
      const updateDto = { name: 'x' } as any;
      const mockRes = { success: true };
      updateTradeareaUseCase.handler.mockResolvedValue(mockRes as any);

      const result = await controller.update(55, updateDto);

      expect(updateTradeareaUseCase.handler).toHaveBeenCalledWith({
        ...updateDto,
        id: 55,
      });
      expect(result).toBe(mockRes);
    });
  });

  describe('submitApproval', () => {
    it('should call submitApproval usecase with tradearea id and user id', async () => {
      const mockRes = { success: true };
      submitApprovalUseCase.handler.mockResolvedValue(mockRes as any);

      const result = await controller.submitApproval(mockReq, 77);

      expect(submitApprovalUseCase.handler).toHaveBeenCalledWith(77, mockReq.user.id);
      expect(result).toBe(mockRes);
    });
  });

  describe('getTradeareaByPoiId', () => {
    it('should call findPoiTradearea usecase and wrap response', async () => {
      const mockRes = { id: 9, poiId: 11 };
      findPoiTradeareaUseCase.handler.mockResolvedValue(mockRes as any);

      const result = await controller.getTradeareaByPoiId(11);

      expect(findPoiTradeareaUseCase.handler).toHaveBeenCalledWith(11);
      expect(result).toEqual({ data: mockRes });
    });
  });

  describe('getByPoi', () => {
    it('should return tradearea by poi id wrapped in data', async () => {
      const mockResult = [{ id: 1 }, { id: 2 }];
      getTradeareaByPoiUseCase.handler.mockResolvedValue(mockResult as any);

      const result = await controller.getByPoi(5);

      expect(getTradeareaByPoiUseCase.handler).toHaveBeenCalledWith(5);
      expect(result).toEqual({ data: mockResult });
    });
  });

  describe('createChild', () => {
    it('should call createChild usecase with id, dto, and userId', async () => {
      const dto = { name: 'child' } as any;
      const mockRes = { id: 99 };
      createChildTradeareaUseCase.handler.mockResolvedValue(mockRes as any);

      const result = await controller.createChild(mockReq, 10, dto);

      expect(createChildTradeareaUseCase.handler).toHaveBeenCalledWith(
        10,
        dto,
        mockReq.user.id,
      );
      expect(result).toBe(mockRes);
    });
  });

  describe('updateApprove', () => {
    it('should call approve usecase with correct args', async () => {
      const body = { action: 'APPROVE', remark: 'ok' } as any;
      const mockRes = { success: true };
      updateTradeareaApproveUseCase.handler.mockResolvedValue(mockRes as any);

      const result = await controller.updateApprove(mockReq, 101, body);

      expect(updateTradeareaApproveUseCase.handler).toHaveBeenCalledWith(
        101,
        body.action,
        mockReq.user.id,
        body.remark,
      );
      expect(result).toBe(mockRes);
    });
  });
});
