import { WfRouteEntity } from 'src/adapter/outbound/repositories/entities/wfRoute.entity';
import { UserEntity } from '../../adapter/outbound/repositories/entities/user.entity';
import { CurrentWorkflowStep } from '../../domain/currentWorkflowStep';
import { WorkflowHistory } from '../../domain/workflowHistory';

export interface WorkflowRepositoryPort {
  getCurrentWorkflowStep(
    refId: number,
    wfId: number[],
    userId: number,
    language?: string,
  ): Promise<CurrentWorkflowStep | null>;
  getWorkflowHistory(
    refId: number,
    wfId?: number,
    language?: string,
  ): Promise<WorkflowHistory | null>;
  getWorkflowTransactionById(wfTransactionId: number): Promise<{
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
    createDate: Date;
    updateBy: string;
    updateDate: Date;
    versionNo: number;
    wfName: string;
    wfNameTH: string;
    wfNameEN: string;
    wfNameKH: string;
    wfNameLA: string;
  } | null>;

  //CreateWorkflowTransactionUseCase
  checkWfTransactionExists(wfId: number, refId: number): Promise<boolean>;

  getWorkflowById(wfId: number): Promise<{
    id: number;
    firstStepId: number;
    firstStatusId: number;
    firstActionId: number;
    isActive: string;
  } | null>;

  getWorkflowStepById(wfStepId: number): Promise<{
    id: number;
    wfId: number;
    wfStepName: string;
    stepOwnerType: string;
    stepOwnerRole: string;
    stepOwnerUser: string | null;
    isActive: string;
  } | null>;

  checkUserPermission(userId: number, stepOwnerRole: string): Promise<boolean>;

  createWfTransaction(data: {
    wfId: number;
    refId: number;
    wfStepId: number;
    wfStatusId: number;
    approveBy: string;
    approveType: string;
    lastApproveRemark: string;
    isActive: string;
    createBy: number;
    updateBy: number;
  }): Promise<number>;

  createWfStepHistory(data: {
    wfTransactionId: number;
    refId: number;
    wfStepId: number;
    wfStatusId: number;
    wfActionId: number;
    remark: string;
    isActive: string;
    userId: number;
  }): Promise<void>;
  //End CreateWorkflowTransactionUseCase

  //WorkflowApprovalUseCase
  getWfIdByTransactionId(wfTransactionId: number): Promise<{
    wfId: number;
    refId: number;
  } | null>;

  getRouteByStepActionAndParameter(
    wfStepId: number,
    approvalAction: string,
    wfParameters?: Record<string, any>,
  ): Promise<WfRouteEntity>;

  findUserIdByStepOwnerRole(
    stepOwnerRole: string,
    zone?: string,
    subZone?: string,
  ): Promise<string | null>;

  updateWfTransaction(
    wfTransactionId: number,
    data: {
      wfStepId: number;
      wfStatusId: number;
      approveBy: string;
      approveType: string;
      lastApproveRemark: string | null;
      updateBy: number;
      wfId: number;
    },
  ): Promise<void>;
  //End WorkflowApprovalUseCase

  //WorkflowSendMailUseCase
  getUserById(userId: number): Promise<{
    userId: number;
    username: string;
    firstName: string;
    lastName: string;
  } | null>;

  getEmailDetailById(emailDetailId: number): Promise<{
    id: number;
    wfEmailTemplateId: number;
    mailTo: string;
    mailCC: string;
    otherMailTo: string;
    otherMailCC: string;
  } | null>;

  getEmailTemplateById(templateId: number): Promise<{
    id: number;
    mailSubject: string;
    mailContent: string;
  } | null>;

  //NEXT_STEP
  getEmailsFromTransaction(wfTransactionId: number): Promise<{
    approveType: string;
    approveBy: string;
  } | null>;

  getEmailsByUserIds(userIds: number[]): Promise<UserEntity[]>;

  filterUserIdsByZone(
    userIds: number[],
    zone?: string,
    subZone?: string,
  ): Promise<number[]>;

  getUserIdsByRoleIds(
    roleIds: number[],
    zone?: string,
    subZone?: string,
  ): Promise<number[]>;

  //FIRST_STEP
  getFirstStepCreatorEmail(wfTransactionId: number, isCc: boolean): Promise<UserEntity>;

  //ALL
  getAllStepCreatorsEmails(wfTransactionId: number): Promise<UserEntity[]>;

  //End WorkflowSendMailUseCase

  // Get workflow statuses
  findWorkflowStatusesByWfId(wfId: number): Promise<
    {
      wfStatusId: number;
      wfStatusNameTh: string;
      wfStatusNameEn: string;
    }[]
  >;

  // Get workflow steps
  findWorkflowStepsByWfId(wfId: number): Promise<
    {
      id: number;
      wfStepNameTH: string;
      wfStepNameEN: string;
      wfStepNameKH: string;
      stepOwnerType: string;
      stepOwnerRole: string;
      stepOwnerUser: string;
    }[]
  >;

  // Update step owner config
  updateWfStepOwner(
    stepId: number,
    stepOwnerType: string,
    stepOwnerRole: string,
    stepOwnerUser: string,
    updatedBy: number,
  ): Promise<void>;
}
