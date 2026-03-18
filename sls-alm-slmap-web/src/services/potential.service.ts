import { get, post } from './httpBase.service';

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

export interface CurrentWorkflowStepResponse {
  success: boolean;
  data?: CurrentWorkflowStepData;
  error?: {
    code: string;
    message: unknown;
  };
}

export interface SendApprovePotentialResult {
  success: boolean;
  message: string;
}

export const getPotentialStatus = async (
  poiId: number
): Promise<CurrentWorkflowStepResponse> => {
  return await get<CurrentWorkflowStepResponse>(`/potentials/${poiId}/status`);
};

export const updatePotentialApprove = async (
  poiId: number,
  status: string,
  remark?: string
) => {
  return await post(`potentials/${poiId}/approve`, {
    status,
    remark,
  });
};

export const sendApprove = async (poiId: number) => {
  return await post<SendApprovePotentialResult>(`potentials/send-approve`, {
    poiId,
  });
};
