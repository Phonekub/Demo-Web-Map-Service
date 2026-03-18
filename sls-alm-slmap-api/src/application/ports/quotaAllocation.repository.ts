import {
  QuotaAllocationDetailResponse,
  SaveLocationSelectionRequest,
  GetItemHistoryResponse,
} from '../../domain/quotaAllocation';

export interface QuotaAllocation {
  id: number;
  zone: string;
  locationType: string;
  year: number;
  roundName: string;
  startMonth: string;
  endMonth: string;
  dueDate: Date;
  isCompleted: boolean;
}

export interface QuotaAllocationRepositoryPort {
  findByIdWithZoneAndWorkflowStatus(id: number): Promise<QuotaAllocation | null>;
  getAllocationDetail(allocationId: number): Promise<QuotaAllocationDetailResponse>;
  saveLocationSelection(
    request: SaveLocationSelectionRequest,
    userId: number,
  ): Promise<void>;
  getItemHistory(itemId: number): Promise<GetItemHistoryResponse>;
  getQuotaRoundIdByAllocationId(allocationId: number): Promise<number | null>;
  getQuotaAllocationsForRoundStatusCheck(quotaRoundId: number): Promise<
    Array<{
      id: number;
      wfTransactionId: number | null;
      wfComplete: string | null;
      quotaAssign: number;
      annualTarget: number | null;
    }>
  >;
  updateQuotaRoundStatus(quotaRoundId: number, statusId: number): Promise<void>;
  isLocationUsedInHistory(poiId: number): Promise<boolean>;
}
