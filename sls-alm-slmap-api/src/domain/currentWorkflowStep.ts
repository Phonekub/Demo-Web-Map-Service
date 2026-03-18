export interface WorkflowAction {
  actionCode: string;
  actionName: string;
  requireRemark: boolean;
  isOwner: boolean;
}

export class CurrentWorkflowStep {
  transactionId: number;
  wfStepId: number;
  stepName: string;
  wfStatusId: number;
  statusName: string;
  wfComplete: 'W' | 'D' | 'C' | 'N' | 'Y';
  approveBy: string;
  approveType: string;
  canAction: boolean;
  actions: WorkflowAction[];
}

export interface CurrentWorkflowStepData {
  wfTransactionId: number;
  wfStep: {
    wfStepId: number;
    wfStepName: string;
  };
  wfStatus: {
    wfStatusId: number;
    wfStatusName: string;
    wfComplete: 'W' | 'D' | 'C' | 'N' | 'Y';
  };
  canAction: boolean;
  availableActions: WorkflowAction[];
}

export interface CurrentWorkflowStepResponse {
  success: boolean;
  data?: CurrentWorkflowStepData;
  error?: {
    code: string;
    message: string;
  };
}
