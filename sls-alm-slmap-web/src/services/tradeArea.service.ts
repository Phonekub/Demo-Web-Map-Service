import { del, get, post, put } from './httpBase.service';

export interface TradeAreaResponse<T> {
  data: T;
  total?: number;
  message?: string;
  status?: string;
}

export interface UpdateTradeAreaLocationRequest {
  id: number;
  body: Partial<TradeAreaDto>;
}

export interface TradeAreaDto {
  id?: string;
  refStoreCode?: string;
  zoneCode?: string;
  subzoneCode?: string;
  status?: string;
  effectiveDate?: string;
  shape?: {
    type: string;
    coordinates: number[][][];
  };
  storeCode?: string;
  storeName?: string;
  areaColor?: string;
  comment?: string;
  warning?: string;
  globalId?: string;
  createdAt?: string;
  createUser?: string;
  updatedAt?: string;
  updateUser?: string;
  refPointX?: number;
  refPointY?: number;
  wfId?: number;
  parentId?: number;
}

export interface CreateTradeAreaRequest {
  poiId?: number;
  zoneCode?: string;
  subzoneCode?: string;
  shape?: {
    type: string;
    coordinates: number[][][];
  };
  storeName?: string;
  areaColor?: string;
  comment?: string;
  warning?: string;
  status?: string;
  type?: string;
  effectiveDate?: string;
}

export interface PendingApprovalTradeArea {
  tradeareaId: number;
  poiId: number;
  storeCode: string;
  storeName: string;
  wfId: number;
  wfStatusId: number;
  wfStatusName: string;
  orgId: number;
  createDate: Date;
  statusNameTh: string;
  wfName: string;
  wfTransactionId: number;
}

export interface PendingApprovalResponse {
  success: boolean;
  data?: PendingApprovalTradeArea[];
  error?: {
    code: string;
    message: string;
  };
}

export interface PoiTradeArea {
  tradeareaId: number;
  poiId: number;
  storeCode: string;
  storeName: string;
  poiGeom: {
    type: string;
    coordinates: [number, number];
  };
  areaGeom: {
    type: string;
    coordinates: number[][][];
  };
}

export interface Tradearea {
  id: number;
  poiId: number;
  refStoreCode?: string;
  zoneCode?: string;
  subzoneCode?: string;

  status: string;

  effectiveDate?: Date | null;
  shape: object;
  storeCode?: string;
  storeName?: string;
  areaColor?: string;
  comment?: string;
  warning?: string;
  globalId?: string;

  createdAt: Date;
  createUser?: string;
  updatedAt?: Date;
  updateUser?: string;
  deletedAt?: Date | null;
  deleteUser?: string;

  refPointX?: number;
  refPointY?: number;

  wfTransactionId: number;
  tradeareaTypeId?: number;
}

export const getTradeAreaByStoreId = async (
  storeId: string,
  type: string
): Promise<TradeAreaResponse<TradeAreaDto[]>> => {
  return get<TradeAreaResponse<TradeAreaDto[]>>(
    `/tradearea/store/${storeId}?type=${type}`
  );
};

export const updateTradeAreaLocation = async (
  req: UpdateTradeAreaLocationRequest
): Promise<void> => {
  return put<void>(`tradearea/${req.id}`, req.body);
};

export const createChildArea = async (
  parentId: number,
  req: TradeAreaDto
): Promise<{ message: string; data: TradeAreaDto }> => {
  return post<{ message: string; data: TradeAreaDto }>(
    `tradearea/${parentId}/child`,
    req
  );
};

export const createTradeArea = async (
  req: CreateTradeAreaRequest
): Promise<{ message: string; data: TradeAreaDto }> => {
  return post<{ message: string; data: TradeAreaDto }>(`tradearea`, req);
};

export const sendForApprovalTradeArea = async (id: string): Promise<void> => {
  return post<void>(`tradearea/${id}/submit-approval`);
};

export const getPendingApprovalTradeAreas = async (
  wfId?: number
): Promise<PendingApprovalTradeArea[]> => {
  try {
    const params = new URLSearchParams();
    if (wfId) params.append('wfId', String(wfId));

    const queryString = params.toString() ? `?${params.toString()}` : '';

    const response = await get<PendingApprovalResponse>(
      `/tradearea/pending-approval${queryString}`
    );

    if (!response.data) {
      console.warn('getPendingApprovalTradeAreas:', response.error?.message);
      return [];
    }

    return response.data;
  } catch (error) {
    console.error('getPendingApprovalTradeAreas error:', error);
    return [];
  }
};

export const getPoiTradeArea = async (
  tradeareaId: number
): Promise<{ data: PoiTradeArea } | null> => {
  return get<{ data: PoiTradeArea } | null>(`/tradearea/${tradeareaId}/poi`);
};

export const updateTradeAreaApprove = async (
  tradeareaId: number,
  action: string,
  remark?: string
): Promise<void> => {
  return await post<void>(`tradearea/${tradeareaId}/approve`, {
    action,
    remark,
  });
};

export const findTradeareaTypes = async (): Promise<
  TradeAreaResponse<
    {
      id: number;
      name: string;
    }[]
  >
> => {
  return get<
    TradeAreaResponse<
      {
        id: number;
        name: string;
      }[]
    >
  >(`/tradearea/types`);
};

export const checkOverlapTradeArea = async (
  coordinates: number[][][],
  excludeId: number | undefined,
  typeName: string
): Promise<{ hasOverlap: boolean; overlappingAreas: Tradearea }> => {
  return post<{ hasOverlap: boolean; overlappingAreas: Tradearea }>(
    `tradearea/check-overlap`,
    {
      shape: {
        type: 'Polygon',
        coordinates: coordinates,
      },
      excludeId,
      tradeareaTypeName: typeName,
    }
  );
};

export const getTradeAreaById = async (
  id: string | number
): Promise<TradeAreaResponse<TradeAreaDto> | null> => {
  return get<TradeAreaResponse<TradeAreaDto> | null>(`/tradeArea/${id}`);
};

export const getHistoryTradeAreaById = async (tradeAreaId: string | number) => {
  return get<any>(`/workflow/${tradeAreaId}/history`);
};

export const deleteTradearea = (tradeareaId: number) => {
  return del(`tradearea/${tradeareaId}`);
};

export const getTradeareaByPoiId = (
  poiId: number
): Promise<TradeAreaResponse<TradeAreaDto> | null> => {
  return get<TradeAreaResponse<TradeAreaDto> | null>(`/tradeArea/poi/${poiId}`);
};
