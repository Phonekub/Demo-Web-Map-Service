import { get, put } from './httpBase.service';

export interface WorkflowResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface WorkflowAction {
  actionCode: string;
  actionName: string;
  requireRemark: boolean;
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

export interface DropdownOption {
  value: string;
  text: string;
}

export const getCurrentWorkflow = async (refId: number, wfId: number) => {
  const response = await get<WorkflowResponse<CurrentWorkflowStepData>>(
    `/workflow/${refId}/${wfId}/current-step`
  );
  return response;
};

export interface WorkflowStatus {
  value: string;
  text: string;
}

export const fetchWorkflowStatuses = async (wfId: number): Promise<WorkflowStatus[]> => {
  const response = await get<{ data: WorkflowStatus[] }>(
    `/workflow/statuses?wfId=${wfId}`
  );
  return response.data;
};

export interface WorkflowStep {
  value: string;
  text: string;
  stepOwnerType: string;
  stepOwnerRole: string;
  stepOwnerUser: string;
}

export const fetchWorkflowSteps = async (wfId: number): Promise<WorkflowStep[]> => {
  const response = await get<{ data: WorkflowStep[] }>(
    `/workflow/steps?wfId=${wfId}`
  );
  return response.data;
};

export interface WorkflowTransactionData {
  id: number;
  wfId: number;
  refId: number;
  wfStepId: number;
  wfStatusId: number;
  approveBy: string;
  approveType: string;
  lastApproveRemark: string;
  isActive: boolean;
  createBy: string;
  createDate: string;
  updateBy: string;
  updateDate: string;
  versionNo: number;
  wfName: string;
  wfNameTH: string;
  wfNameEN: string;
  wfNameKH: string;
  wfNameLA: string;
}

export const getWorkflowTransaction = async (wfTransactionId: number) => {
  const response = await get<{ data: WorkflowTransactionData | null; message?: string }>(
    `/workflow/transaction/${wfTransactionId}`
  );
  return response;
};

export const updateWfStepOwner = async (
  stepId: number,
  stepOwnerType: string,
  stepOwnerRole: string,
  stepOwnerUser: string,
): Promise<void> => {
  await put<void, { stepId: number; stepOwnerType: string; stepOwnerRole: string; stepOwnerUser: string }>(
    'workflow/step-owner',
    { stepId, stepOwnerType, stepOwnerRole, stepOwnerUser },
  );
};
