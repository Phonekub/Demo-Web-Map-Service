export interface Tradearea {
  id: number;
  refStoreCode?: string;
  zoneCode?: string;
  subzoneCode?: string;

  // ✅ เพิ่ม fields ใหม่
  storeCode?: string;
  storeName?: string;
  locationT?: string;
  lat?: number;
  lng?: number;

  shape?: {
    type: string;
    coordinates: number[][][];
  };
  status?: string;
  isActive?: string;
  createdAt?: Date;
  updatedAt?: Date;
  effectiveDate?: string;
  areaColor?: string;
  comment?: string;
  warning?: string;
  globalId?: string;
  createUser?: string;
  updateUser?: string;
  deletedAt?: Date;
  deleteUser?: string;
  refPointX?: number;
  refPointY?: number;
  wfTransactionId?: number;
  poiId?: number;
  poiGeom?: {
    type: string;
    coordinates: number[];
  };

  // ✅ เพิ่ม nested objects (optional)
  poi?: {
    zoneCode?: string;
    subzoneCode?: string;
  };

  sevenElevenStore?: {
    storeCode: string;
    storeName: string;
  };
  tradeareaTypeId?: number;
  tradeareaTypeName?: string;
  wfId?: number;
  parentId?: number;
}

export class TradeareaPendingApproval {
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
