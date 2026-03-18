export class WorkflowHistoryItem {
  id: number;
  wfTransactionId: number;
  wfStepId: number;
  wfStepName: string;
  wfStatusId: number;
  wfStatusName: string;
  wfActionId: number;
  wfActionName: string;
  remark: string;
  createBy: number;
  createByName: string;
  createDate: Date;
}

export class WorkflowHistory {
  refId: number;
  histories: WorkflowHistoryItem[];
}
