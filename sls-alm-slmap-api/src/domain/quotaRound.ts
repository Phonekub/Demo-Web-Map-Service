export class QuotaRound {
  id?: number;
  name: string;
  seq?: number;
  status?: RoundStatus;
  startMonth: string;
  endMonth: string;
  isReview?: string;
  dueDate: Date;
  allocations: QuotaAllocation[];
}

export class RoundStatus {
  id: number;
  name: string;
}

export class QuotaAllocation {
  allocationId?: number;
  quotaRoundId?: number;
  zoneId: number;
  zoneCode: string;
  assignedQuota: number;
  reservedQuota: number;

  wfStatus?: AllocationWorkflowStatus;
}

export class AllocationWorkflowStatus {
  id: number;
  name: string;
  wfComplete: string;
}
