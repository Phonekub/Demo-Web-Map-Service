export class QuotaAllocation {
  allocationId: number;
  quotaRoundId: number;
  zoneId: number;
  assignedQuota: number;
  reservedQuota: number;
  createBy?: number;
  createDate?: Date;
  updateBy?: number;
  updateDate?: Date;
}

export class QuotaAllocationItem {
  id: number;
  quotaAllocationId: number;
  seq: number;
  type: 'MAIN' | 'RESERVE';
  poiId: number;
  openType?: string;
  openMonth?: string;
  closedStorePoiId?: number;
  createBy?: number;
  createDate?: Date;
  updateBy?: number;
  updateDate?: Date;
}

// Response DTOs
export class QuotaAllocationDetailResponse {
  quota_allocation_id: number;
  year: string;
  location_type: {
    value: string;
    name: string;
  };
  quota_type: {
    value: string;
    name: string;
  };
  zone: {
    id: number;
    code: string;
    name: string;
  };
  round_allocations: RoundAllocationDetail[];
}

export class RoundAllocationDetail {
  quota_allocation_id: number;
  quota_round: {
    id: number;
    seq: number;
    name: string;
    start_month: string;
    end_month: string;
    due_date: string;
    is_review_mode: string;
  };
  assigned_quota: number;
  reserved_quota: number;
  assigned_items: AllocationItemDetail[];
  reserved_items: ReservedItemDetail[];
}

export class AllocationItemDetail {
  id: number;
  seq: number;
  poi: {
    id: number;
    form_no: string;
    name: string;
    zone_code: string;
    sub_zone: string;
  };
  open_type: string;
  open_month: string;
  closed_store: {
    poi_id: number;
    form_no: string;
    name: string;
  } | null;
}

export class ReservedItemDetail {
  id: number;
  seq: number;
  poi: {
    id: number;
    form_no: string;
    name: string;
    zone_code: string;
    sub_zone: string;
  };
}

// Save Location Selection DTOs
export class MainLocationToAdd {
  seq: number;
  poi_id: number;
  open_type: string;
  open_month: string;
  closed_store_poi_id?: number | null;
  item_id?: number; // กรณีเลือกจากสำรองมาเพิ่ม
}

export class MainLocationToUpdate {
  item_id: number;
  seq: number;
  poi_id: number;
  open_type: string;
  open_month: string;
  closed_store_poi_id?: number | null;
}

export class MainLocationToReplace {
  item_id: number;
  seq: number;
  poi_id: number;
  open_type: string;
  open_month: string;
  closed_store_poi_id?: number | null;
}

export class MainLocationOperations {
  to_add?: MainLocationToAdd[];
  to_update?: MainLocationToUpdate[];
  to_replace?: MainLocationToReplace[];
  to_delete?: number[];
}

export class AllocationData {
  allocation_id: number;
  main: MainLocationOperations;
}

export class ReserveLocationToAdd {
  seq: number;
  poi_id: number;
}

export class ReserveLocationToReplace {
  item_id: number;
  seq: number;
  poi_id: number;
}

export class ReserveLocationOperations {
  to_add?: ReserveLocationToAdd[];
  to_replace?: ReserveLocationToReplace[];
  to_delete?: number[];
}

export class SaveLocationSelectionRequest {
  allocations: AllocationData[];
  reserve?: ReserveLocationOperations;
}

export class SaveLocationSelectionResponse {
  success: boolean;
  message: string;
  error?: {
    code: string;
    message: string;
  };
}

// Item History DTOs
export class ItemHistoryLog {
  detail: string;
  remark: string | null;
  created_by_name: string;
  created_date: Date;
}

export class GetItemHistoryResponse {
  history: ItemHistoryLog[];
}
