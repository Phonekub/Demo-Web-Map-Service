import { TradeareaTypeEntity } from '../../adapter/outbound/repositories/entities/tradeareaType.entity';
import { PoiTradearea } from '../../domain/poiTradearea';
import { Tradearea, TradeareaPendingApproval } from '../../domain/tradearea';
import { Polygon, Geometry } from 'geojson';

export interface TradeareaQuery {
  [key: string]: string | number | boolean | undefined;
}

export interface TradeareaRepositoryPort {
  findAll(
    search: string,
    page?: number,
    sortBy?: string,
    order?: 'asc' | 'desc',
    limit?: number,
    status?: string,
  ): Promise<{
    data: Record<string, unknown>[];
    total: number;
  }>;
  findById(id: number): Promise<Tradearea | null>;
  findByStoreCode(storeCode: string, tradeareaId: number): Promise<Tradearea[]>;
  findByZone(zoneCode: string): Promise<Tradearea[]>;
  findBySubzone(zoneCode: string, subzoneCode: string): Promise<Tradearea[]>;
  findByPoint(lng: number, lat: number): Promise<Tradearea | null>;
  findOverlapping(
    shape: Polygon | Geometry,
    excludeId?: number[],
    tradeareaTypeName?: string,
  ): Promise<Tradearea[]>;
  create(data: Partial<Tradearea>): Promise<Tradearea>;
  update(id: number, data: Partial<Tradearea>): Promise<Tradearea | null>;

  findTradeareasByPolygon(
    coordinates: [number, number][],
    boundaryArea: [string, string][],
    tradeAreaTypeId?: number,
    status?: string,
    limit?: number,
    offset?: number,
  ): Promise<[Tradearea[], number]>;
  insertTradeareaHistory(
    TradeareaId: number,
    userId: string,
    action: string,
    actionType: string,
  ): Promise<void>;
  findTradeareasPendingApproval(
    wfId?: number,
    roleId?: number,
  ): Promise<TradeareaPendingApproval[]>;
  findPoiTradeareaById(poiId: number): Promise<PoiTradearea | null>;
  findTradeareaTypes(): Promise<TradeareaTypeEntity[] | null>;
  findTradeareaTypeByName(name: string): Promise<TradeareaTypeEntity | null>;
  deleteTradearea(tradeareaId: number, userId: number): Promise<void>;
  findByPoi(poiId: number): Promise<Tradearea | null>;
  findTradeareasForSearch(
    params: {
      nation?: string;
      provCode?: string;
      ampCode?: string;
      tamCode?: string;
      status?: string;
      approvalType?: string;
      tradeAreaType?: string;
      storeCodeName?: string;
    },
    boundaryArea: [string, string][],
    limit: number,
    offset: number,
  ): Promise<[Tradearea[], number]>;
}
