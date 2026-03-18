import { Injectable } from '@nestjs/common';
import { WorkflowRepositoryPort } from '../../../application/ports/workflow.repository';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { WfEntity } from './entities/wf.entity';
import { WfTransactionEntity } from './entities/wfTransaction.entity';
import { WfStepEntity } from './entities/wfStep.entity';
import { WfStatusEntity } from './entities/wfStatus.entity';
import { WfRouteEntity } from './entities/wfRoute.entity';
import { WfActionEntity } from './entities/wfAction.entity';
import { WfParameterEntity } from './entities/wfParameter.entity';
import { UserRoleEntity } from './entities/userrole.entity';
import { WfStepHistoryEntity } from './entities/wfStepHistory.entity';
import { UserEntity } from './entities/user.entity';
import { WfEmailDetailEntity } from './entities/wfEmailDetail.entity';
import { WfEmailTemplateEntity } from './entities/wfEmailTemplate.entity';
import { Repository, In, IsNull, Not, Equal } from 'typeorm';
import { CurrentWorkflowStep } from '../../../domain/currentWorkflowStep';
import { WorkflowHistory } from '../../../domain/workflowHistory';
import { CurrentWorkflowStepMapper } from './mappers/currentWorkflowStep.mapper';
import { WorkflowHistoryMapper } from './mappers/workflowHistory.mapper';
import { RoleEntity } from './entities/role.entity';
import { UserRoleWithRole } from '../interfaces/repositories/workflow.repository';
import { WorkflowCompleteStatus } from '@common/enums/workflow.enum';

@Injectable()
export class WorkflowRepository implements WorkflowRepositoryPort {
  constructor(
    @InjectRepository(WfEntity)
    private readonly wfModel: Repository<WfEntity>,
    @InjectRepository(WfTransactionEntity)
    private readonly wfTransactionModel: Repository<WfTransactionEntity>,
    @InjectRepository(WfStepEntity)
    private readonly wfStepModel: Repository<WfStepEntity>,
    @InjectRepository(WfStatusEntity)
    private readonly wfStatusModel: Repository<WfStatusEntity>,
    @InjectRepository(WfRouteEntity)
    private readonly wfRouteModel: Repository<WfRouteEntity>,
    @InjectRepository(WfActionEntity)
    private readonly wfActionModel: Repository<WfActionEntity>,
    @InjectRepository(UserRoleEntity)
    private readonly userRoleModel: Repository<UserRoleEntity>,
    @InjectRepository(WfStepHistoryEntity)
    private readonly wfStepHistoryModel: Repository<WfStepHistoryEntity>,
    @InjectRepository(UserEntity)
    private readonly userModel: Repository<UserEntity>,
    @InjectRepository(WfEmailDetailEntity)
    private readonly wfEmailDetailModel: Repository<WfEmailDetailEntity>,
    @InjectRepository(WfEmailTemplateEntity)
    private readonly wfEmailTemplateModel: Repository<WfEmailTemplateEntity>,
  ) {}

  async getCurrentWorkflowStep(
    refId: number,
    wfId: number[],
    userId: number,
    language?: string,
  ): Promise<CurrentWorkflowStep | null> {
    const wfTransactionResult = await this.wfTransactionModel
      .createQueryBuilder('transaction')
      .leftJoin(WfStepEntity, 'step', 'step.id = transaction.wf_step_id')
      .leftJoin(WfStatusEntity, 'status', 'status.id = transaction.wf_status_id')
      .select([
        'transaction.id AS transaction_id',
        'transaction.wf_step_id AS transaction_wf_step_id',
        'transaction.wf_status_id AS transaction_wf_status_id',
        'transaction.approve_by AS transaction_approve_by',
        'transaction.approve_type AS transaction_approve_type',

        'step.wf_step_name AS step_wf_step_name',
        'step.wf_step_name_th AS step_wf_step_name_th',
        'step.wf_step_name_en AS step_wf_step_name_en',
        'step.wf_step_name_kh AS step_wf_step_name_kh',
        'step.wf_step_name_la AS step_wf_step_name_la',

        'status.status_name AS status_status_name',
        'status.status_name_th AS status_status_name_th',
        'status.status_name_en AS status_status_name_en',
        'status.status_name_kh AS status_status_name_kh',
        'status.status_name_la AS status_status_name_la',
        'status.wf_complete AS status_wf_complete',
      ])
      .where('transaction.ref_id = :refId', { refId })
      .andWhere('transaction.wf_id IN (:...wfId)', { wfId })
      .orderBy('transaction.create_date', 'DESC')
      .limit(1)
      .getRawOne();

    if (!wfTransactionResult) {
      return null;
    }

    const workflowComplete: WorkflowCompleteStatus[] = [
      WorkflowCompleteStatus.CANCELLED,
      WorkflowCompleteStatus.COMPLETE,
      WorkflowCompleteStatus.INCOMPLETE,
    ];
    let actionsResult = [];
    let canAction = false;
    if (!workflowComplete.includes(wfTransactionResult.status_wf_complete)) {
      const query = this.userRoleModel
        .createQueryBuilder('userRole')
        .select('role.id', 'roleId')
        .where('userRole.userId = :userId', { userId })
        .innerJoin(
          RoleEntity,
          'role',
          'userRole.levelId = role.levelId AND userRole.deptId = role.departmentId',
        );

      const userRole = await query.getRawOne<UserRoleWithRole>();
      const approveBy = String(wfTransactionResult.transaction_approve_by ?? '');
      const approveType = String(wfTransactionResult.transaction_approve_type ?? '');

      if (approveType === 'USER') {
        // approveBy อาจมีหลายค่าคั่นด้วย comma เช่น "1,2,3"
        const allowedUserIds = approveBy
          .split(',')
          .map((id) => id.trim())
          .filter((id) => id !== '');
        canAction = allowedUserIds.includes(String(userId));
      } else if (approveType === 'ROLE') {
        const allowedRoleIds = approveBy
          .split(',')
          .map((id) => id.trim())
          .filter((id) => id !== '');

        canAction = allowedRoleIds.includes(String(userRole.roleId));
      }

      if (canAction) {
        actionsResult = await this.wfRouteModel
          .createQueryBuilder('route')
          .leftJoin(WfActionEntity, 'action', 'action.id = route.wf_action_id')
          .select([
            'action.action_code AS action_action_code',
            'action.action_name AS action_action_name',
            'action.action_name_th AS action_action_name_th',
            'action.action_name_en AS action_action_name_en',
            'action.action_name_kh AS action_action_name_kh',
            'action.action_name_la AS action_action_name_la',
            'action.require_remark AS action_require_remark',
            'route.is_owner AS route_is_owner',
          ])
          .distinct(true)
          .where('route.wf_step_id = :wfStepId', {
            wfStepId: wfTransactionResult.transaction_wf_step_id,
          })
          .andWhere('route.is_active = :isActive', { isActive: 'Y' })
          .getRawMany();
      }
    }

    return CurrentWorkflowStepMapper.toDomain(
      wfTransactionResult,
      actionsResult,
      canAction,
      language,
    );
  }

  async getWorkflowHistory(
    refId: number,
    wfId?: number,
    language?: string,
  ): Promise<WorkflowHistory | null> {
    const queryBuilder = this.wfStepHistoryModel
      .createQueryBuilder('history')
      .innerJoin(
        WfTransactionEntity,
        'transaction',
        'transaction.id = history.wf_transaction_id',
      )
      .leftJoin(WfStepEntity, 'step', 'step.id = history.wf_step_id')
      .leftJoin(WfStatusEntity, 'status', 'status.id = history.wf_status_id')
      .leftJoin(WfActionEntity, 'action', 'action.id = history.wf_action_id')
      .leftJoin(UserEntity, 'user', 'user.ID = history.create_by')
      .select([
        'history.id AS history_id',
        'history.wf_transaction_id AS history_wf_transaction_id',
        'history.ref_id AS history_ref_id',
        'history.wf_step_id AS history_wf_step_id',
        'history.wf_status_id AS history_wf_status_id',
        'history.wf_action_id AS history_wf_action_id',
        'history.remark AS history_remark',
        'history.create_by AS history_create_by',
        'history.create_date AS history_create_date',
        'step.wf_step_name AS step_wf_step_name',
        'step.wf_step_name_th AS step_wf_step_name_th',
        'step.wf_step_name_en AS step_wf_step_name_en',
        'step.wf_step_name_kh AS step_wf_step_name_kh',
        'step.wf_step_name_la AS step_wf_step_name_la',
        'status.status_name AS status_status_name',
        'status.status_name_th AS status_status_name_th',
        'status.status_name_en AS status_status_name_en',
        'status.status_name_kh AS status_status_name_kh',
        'status.status_name_la AS status_status_name_la',
        'action.action_name AS action_action_name',
        'action.action_name_th AS action_action_name_th',
        'action.action_name_en AS action_action_name_en',
        'action.action_name_kh AS action_action_name_kh',
        'action.action_name_la AS action_action_name_la',
        'user.FIRST_NAME AS user_first_name',
        'user.LAST_NAME AS user_last_name',
      ])
      .where('transaction.ref_id = :refId', { refId })
      .andWhere('history.is_active = :isActive', { isActive: 'Y' });

    if (wfId !== undefined && wfId !== null) {
      queryBuilder.andWhere('transaction.wf_id = :wfId', { wfId });
    }

    const historyResult = await queryBuilder
      .orderBy('history.create_date', 'DESC')
      .getRawMany();

    if (!historyResult || historyResult.length === 0) {
      return null;
    }

    return WorkflowHistoryMapper.toDomain(historyResult, language);
  }

  async getWorkflowTransactionById(wfTransactionId: number): Promise<{
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
  } | null> {
    const result = await this.wfTransactionModel
      .createQueryBuilder('transaction')
      .leftJoin(WfEntity, 'wf', 'wf.id = transaction.wf_id')
      .select([
        'transaction.id AS transaction_id',
        'transaction.wf_id AS transaction_wf_id',
        'transaction.ref_id AS transaction_ref_id',
        'transaction.wf_step_id AS transaction_wf_step_id',
        'transaction.wf_status_id AS transaction_wf_status_id',
        'transaction.approve_by AS transaction_approve_by',
        'transaction.approve_type AS transaction_approve_type',
        'transaction.last_approve_remark AS transaction_last_approve_remark',
        'transaction.is_active AS transaction_is_active',
        'transaction.create_by AS transaction_create_by',
        'transaction.create_date AS transaction_create_date',
        'transaction.update_by AS transaction_update_by',
        'transaction.update_date AS transaction_update_date',
        'transaction.version_no AS transaction_version_no',
        'wf.wf_name AS wf_wf_name',
        'wf.wf_name_th AS wf_wf_name_th',
        'wf.wf_name_en AS wf_wf_name_en',
        'wf.wf_name_kh AS wf_wf_name_kh',
        'wf.wf_name_la AS wf_wf_name_la',
      ])
      .where('transaction.id = :wfTransactionId', { wfTransactionId })
      .andWhere('transaction.is_active = :isActive', { isActive: 'Y' })
      .getRawOne();

    if (!result) {
      return null;
    }

    return {
      id: result.transaction_id,
      wfId: result.transaction_wf_id,
      refId: result.transaction_ref_id,
      wfStepId: result.transaction_wf_step_id,
      wfStatusId: result.transaction_wf_status_id,
      approveBy: result.transaction_approve_by,
      approveType: result.transaction_approve_type,
      lastApproveRemark: result.transaction_last_approve_remark,
      isActive: result.transaction_is_active,
      createBy: result.transaction_create_by,
      createDate: result.transaction_create_date,
      updateBy: result.transaction_update_by,
      updateDate: result.transaction_update_date,
      versionNo: result.transaction_version_no,
      wfName: result.wf_wf_name,
      wfNameTH: result.wf_wf_name_th,
      wfNameEN: result.wf_wf_name_en,
      wfNameKH: result.wf_wf_name_kh,
      wfNameLA: result.wf_wf_name_la,
    };
  }

  //CreateWorkflowTransactionUseCase
  async checkWfTransactionExists(wfId: number, refId: number): Promise<boolean> {
    const existingTransaction = await this.wfTransactionModel.findOne({
      where: {
        wfId: wfId,
        refId: refId,
        isActive: 'Y',
      },
    });

    return existingTransaction !== null;
  }

  async getWorkflowById(wfId: number): Promise<{
    id: number;
    firstStepId: number;
    firstStatusId: number;
    firstActionId: number;
    isActive: string;
  } | null> {
    const workflow = await this.wfModel.findOne({
      where: {
        id: wfId,
        isActive: 'Y',
      },
      select: ['id', 'firstStepId', 'firstStatusId', 'firstActionId', 'isActive'],
    });

    if (!workflow) {
      return null;
    }

    return {
      id: workflow.id,
      firstStepId: workflow.firstStepId,
      firstStatusId: workflow.firstStatusId,
      firstActionId: workflow.firstActionId,
      isActive: workflow.isActive,
    };
  }

  async getWorkflowStepById(wfStepId: number): Promise<{
    id: number;
    wfId: number;
    wfStepName: string;
    stepOwnerType: string;
    stepOwnerRole: string;
    stepOwnerUser: string | null;
    isActive: string;
  } | null> {
    const step = await this.wfStepModel.findOne({
      where: {
        id: wfStepId,
        isActive: 'Y',
      },
      select: [
        'id',
        'wfId',
        'wfStepName',
        'stepOwnerType',
        'stepOwnerRole',
        'stepOwnerUser',
        'isActive',
      ],
    });

    if (!step) {
      return null;
    }

    return {
      id: step.id,
      wfId: step.wfId,
      wfStepName: step.wfStepName,
      stepOwnerType: step.stepOwnerType,
      stepOwnerRole: step.stepOwnerRole,
      stepOwnerUser: step.stepOwnerUser ?? null,
      isActive: step.isActive,
    };
  }

  async checkUserPermission(userId: number, stepOwnerRole: string): Promise<boolean> {
    if (!stepOwnerRole) {
      return false;
    }

    const trimmed = stepOwnerRole.trim();
    const numericListRegex = /^\d+(,\d+)*$/;

    if (!numericListRegex.test(trimmed)) {
      return false;
    }

    const allowedRoles = trimmed
      .split(',')
      .map((role) => role.trim())
      .filter((role) => role !== '');

    if (allowedRoles.length === 0) {
      return false;
    }

    const userRole = await this.userRoleModel
      .createQueryBuilder('userRole')
      .where('userRole.userId = :userId', { userId })
      .andWhere('userRole.isActive = :isActive', { isActive: 'Y' })
      .innerJoin(
        RoleEntity,
        'role',
        'userRole.levelId = role.levelId AND userRole.deptId = role.departmentId AND role.id IN (:...allowedRoles)',
        { allowedRoles },
      )
      .getOne();

    return userRole !== null;
  }

  async createWfTransaction(data: {
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
  }): Promise<number> {
    const now = new Date();

    const newTransaction = this.wfTransactionModel.create({
      wfId: data.wfId,
      refId: data.refId,
      wfStepId: data.wfStepId,
      wfStatusId: data.wfStatusId,
      approveBy: data.approveBy,
      approveType: data.approveType,
      lastApproveRemark: data.lastApproveRemark ?? null,
      isActive: data.isActive,
      createBy: data.createBy,
      createDate: now,
      updateBy: data.updateBy,
      updateDate: now,
      versionNo: '1.00',
    });

    const savedTransaction = await this.wfTransactionModel.save(newTransaction);

    return savedTransaction.id;
  }

  async createWfStepHistory(data: {
    wfTransactionId: number;
    refId: number;
    wfStepId: number;
    wfStatusId: number;
    wfActionId: number;
    remark: string;
    isActive: string;
    userId: number;
  }): Promise<void> {
    const newHistory = this.wfStepHistoryModel.create({
      wfTransactionId: data.wfTransactionId,
      refId: data.refId,
      wfStepId: data.wfStepId,
      wfStatusId: data.wfStatusId,
      wfActionId: data.wfActionId,
      remark: data.remark ?? null,
      isActive: data.isActive,
      createBy: data.userId,
      updateBy: data.userId,
    });

    await this.wfStepHistoryModel.insert({
      wfTransactionId: data.wfTransactionId,
      refId: data.refId,
      wfStepId: data.wfStepId,
      wfStatusId: data.wfStatusId,
      wfActionId: data.wfActionId,
      remark: data.remark ?? null,
      isActive: data.isActive,
      createBy: data.userId,
      updateBy: data.userId,
    });
  }

  async getWfIdByTransactionId(wfTransactionId: number): Promise<{
    wfId: number;
    refId: number;
  } | null> {
    const transaction = await this.wfTransactionModel.findOne({
      where: {
        id: wfTransactionId,
        isActive: 'Y',
      },
      select: ['wfId', 'refId'],
    });

    if (!transaction) {
      return null;
    }

    return {
      wfId: transaction.wfId,
      refId: transaction.refId,
    };
  }

  async getRouteByStepActionAndParameter(
    wfStepId: number,
    approvalAction: string,
    wfParameters?: Record<string, any>,
  ): Promise<WfRouteEntity> {
    const queryBuilder = this.wfRouteModel
      .createQueryBuilder('route')
      .innerJoin('route.wfAction', 'action')
      .leftJoinAndSelect('route.wfParameter', 'param')
      .select([
        'route.id',
        'route.wfId',
        'route.wfStepId',
        'route.wfActionId',
        'route.wfToStepId',
        'route.wfToStatusId',
        'route.wfEmailDetailId',
        'route.wfParameterId',
        'route.parameterValue',
        'route.isActive',
        'param.id',
        'param.code',
      ])
      // .addSelect('step')
      .innerJoinAndSelect('route.wfStep', 'step')
      .where('route.wfStepId = :wfStepId', { wfStepId })
      .andWhere('action.actionCode = :approvalAction', { approvalAction })
      .andWhere('route.isActive = :isActive', { isActive: 'Y' });

    const routes = await queryBuilder.getMany();

    if (!routes || routes.length === 0) {
      return null;
    }

    // If no parameters provided, return route without parameter constraint
    if (!wfParameters) {
      const routeWithoutParam = routes.find((r) => !r.wfParameterId);
      return routeWithoutParam || null;
    }

    // Find matching route based on parameters
    for (const route of routes) {
      if (!route.wfParameterId) {
        continue;
      }

      const paramCode = route.wfParameter?.code;
      const expectedValue = route.parameterValue;

      if (
        paramCode &&
        wfParameters[paramCode] !== undefined &&
        String(wfParameters[paramCode]) === expectedValue
      ) {
        return route;
      }
    }
    const routeWithoutParam = routes.find((r) => !r.wfParameterId);
    return routeWithoutParam || null;
  }

  async findUserIdByStepOwnerRole(
    stepOwnerRole: string,
    zone?: string,
    subZone?: string,
  ): Promise<string | null> {
    if (!stepOwnerRole) {
      return null;
    }

    const trimmed = stepOwnerRole.trim();
    const numericListRegex = /^\d+(,\d+)*$/;

    if (!numericListRegex.test(trimmed)) {
      return null;
    }

    const roleIds = trimmed
      .split(',')
      .map((role) => role.trim())
      .filter((role) => role !== '');

    if (roleIds.length === 0) {
      return null;
    }

    const queryBuilder = this.userModel
      .createQueryBuilder('user')
      .select(['user.id'])
      .innerJoin('user.userRoles', 'userRole')
      .andWhere('userRole.isActive = :isActive', { isActive: 'Y' })
      .innerJoin(
        RoleEntity,
        'role',
        'userRole.levelId = role.levelId AND userRole.deptId = role.departmentId AND role.id IN (:...roleIds)',
        { roleIds },
      );

    if (zone || subZone) {
      queryBuilder.innerJoin('user.userZones', 'userZone');
      if (zone) {
        queryBuilder.andWhere('userZone.zoneCode = :zone', { zone });
      }
      if (subZone) {
        queryBuilder.andWhere('userZone.subzoneCode = :subZone', { subZone });
      }
    }

    const users = await queryBuilder.getMany();

    if (users.length === 0) {
      return null;
    }

    return users.map((u) => u.id).join(',');
  }

  async updateWfTransaction(
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
  ): Promise<void> {
    await this.wfTransactionModel.update(
      { id: wfTransactionId },
      {
        wfStepId: data.wfStepId,
        wfStatusId: data.wfStatusId,
        approveBy: data.approveBy,
        approveType: data.approveType,
        lastApproveRemark: data.lastApproveRemark,
        updateBy: data.updateBy,
        updateDate: new Date(),
        wfId: data.wfId,
      },
    );
  }
  //End WorkflowApprovalUseCase

  //WorkflowSendMailUseCase
  async getUserById(userId: number): Promise<{
    userId: number;
    username: string;
    firstName: string;
    lastName: string;
  } | null> {
    const user = await this.userModel.findOne({
      where: {
        id: userId,
        isActive: 'Y',
      },
      select: ['id', 'username', 'firstName', 'lastName'],
    });

    if (!user) {
      return null;
    }

    return {
      userId: user.id,
      username: user.username || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
    };
  }

  async getEmailDetailById(emailDetailId: number): Promise<{
    id: number;
    wfEmailTemplateId: number;
    mailTo: string;
    mailCC: string;
    otherMailTo: string;
    otherMailCC: string;
  } | null> {
    const emailDetail = await this.wfEmailDetailModel.findOne({
      where: {
        id: emailDetailId,
        isActive: 'Y',
      },
    });

    if (!emailDetail) {
      return null;
    }

    return {
      id: emailDetail.id,
      wfEmailTemplateId: emailDetail.wfEmailTemplateId,
      mailTo: emailDetail.mailTo || '',
      mailCC: emailDetail.mailCC || '',
      otherMailTo: emailDetail.otherMailTo || '',
      otherMailCC: emailDetail.otherMailCC || '',
    };
  }

  async getEmailTemplateById(templateId: number): Promise<{
    id: number;
    mailSubject: string;
    mailContent: string;
  } | null> {
    const template = await this.wfEmailTemplateModel.findOne({
      where: {
        id: templateId,
        isActive: 'Y',
      },
    });

    if (!template) {
      return null;
    }

    return {
      id: template.id,
      mailSubject: template.mailSubject || '',
      mailContent: template.mailContent || '',
    };
  }

  async getEmailsFromTransaction(wfTransactionId: number): Promise<{
    approveType: string;
    approveBy: string;
  } | null> {
    const transaction = await this.wfTransactionModel.findOne({
      where: {
        id: wfTransactionId,
        isActive: 'Y',
      },
    });

    if (!transaction) {
      return null;
    }

    return {
      approveType: transaction.approveType || '',
      approveBy: transaction.approveBy || '',
    };
  }

  async getEmailsByUserIds(userIds: number[]): Promise<UserEntity[]> {
    if (!userIds || userIds.length === 0) {
      return null;
    }
    const allUsers = await this.userModel.find({
      where: {
        id: In(userIds),
        isActive: 'Y',
        email: Not(IsNull()),
        userRoles: {
          deptId: Not(0),
        },
      },
    });

    return allUsers;
  }

  async filterUserIdsByZone(
    userIds: number[],
    zone?: string,
    subZone?: string,
  ): Promise<number[]> {
    if (!userIds || userIds.length === 0) {
      return [];
    }

    // ถ้าไม่ระบุ zone/subZone ให้คืนค่า userIds ทั้งหมด
    if (!zone && !subZone) {
      return userIds;
    }

    const queryBuilder = this.userModel
      .createQueryBuilder('user')
      .select(['user.id'])
      .where('user.id IN (:...userIds)', { userIds })
      .andWhere('user.isActive = :isActive', { isActive: 'Y' })
      .innerJoin('user.userZones', 'userZone');

    if (zone) {
      queryBuilder.andWhere('userZone.zoneCode = :zone', { zone });
    }

    if (subZone) {
      queryBuilder.andWhere('userZone.subzoneCode = :subZone', { subZone });
    }

    const result = await queryBuilder.getMany();
    return result.map((u) => u.id);
  }

  async getUserIdsByRoleIds(
    roleIds: number[],
    zone?: string,
    subZone?: string,
  ): Promise<number[]> {
    if (!roleIds || roleIds.length === 0) {
      return [];
    }

    const queryBuilder = this.userModel
      .createQueryBuilder('user')
      .select(['user.id'])
      .innerJoin('user.userRoles', 'userRole')
      // .where('userRole.roleId IN (:...roleIds)', { roleIds })
      .andWhere('userRole.isActive = :isActive', { isActive: 'Y' })
      .innerJoin(
        RoleEntity,
        'role',
        'userRole.levelId = role.levelId AND userRole.deptId = role.departmentId AND role.id IN (:...roleIds)',
        { roleIds },
      );

    if (zone || subZone) {
      queryBuilder.innerJoin('user.userZones', 'userZone');

      if (zone) {
        queryBuilder.andWhere('userZone.zoneCode = :zone', { zone });
      }

      if (subZone) {
        queryBuilder.andWhere('userZone.subzoneCode = :subZone', { subZone });
      }
    }

    // const userRoles = await this.userRoleModel
    //   .createQueryBuilder('userRole')
    //   .where('userRole.roleId IN (:...roleIds)', { roleIds })
    //   .andWhere('userRole.isActive = :isActive', { isActive: 'Y' })
    //   .select(['userRole.userId'])
    //   .getMany();

    // const userIds = userRoles
    //   .map((ur) => parseInt(ur.userId, 10))
    //   .filter((id) => !isNaN(id));

    const result = await queryBuilder.getMany();

    return result.map((user) => user.id);
  }

  async getFirstStepCreatorEmail(
    wfTransactionId: number,
    isCc: boolean,
  ): Promise<UserEntity> {
    const query = this.userModel
      .createQueryBuilder('user')
      .innerJoin('user.wfStepHistories', 'history')
      .where('history.wf_transaction_id = :wfTransactionId', { wfTransactionId })
      .andWhere('history.is_active = :isActive', { isActive: 'Y' })
      .select('user')
      .addSelect('user.firstName', 'firstName')
      .addSelect('user.lastName', 'lastName')
      .innerJoin(
        'user.userRoles',
        'userRole',
        'userRole.deptId <> 0 AND userRole.isActive = :isActive',
        { isActive: 'Y' },
      )
      .innerJoin(
        WfRouteEntity,
        'route',
        'route.wfStepId = history.wf_step_id AND route.wfActionId = history.wfActionId',
      )
      .innerJoin('route.wfEmailDetail', 'emailDetail')
      .orderBy('history.create_date', 'DESC');

    if (!isCc) {
      query.andWhere('emailDetail.mailTo = :sendTo', { sendTo: 'FIRST_STEP' });
    } else {
      query.andWhere('emailDetail.mailCC = :sendTo', { sendTo: 'FIRST_STEP' });
    }

    const result = query.getOne();

    return result;
  }

  async getAllStepCreatorsEmails(wfTransactionId: number): Promise<UserEntity[]> {
    const histories = await this.wfStepHistoryModel
      .createQueryBuilder('user')
      .leftJoin('user.wfStepHistories', 'history')
      .where('history.wf_transaction_id = :wfTransactionId', { wfTransactionId })
      .andWhere('history.is_active = :isActive', { isActive: 'Y' })
      .innerJoin(
        'ususer.userRoles',
        'userRole',
        'userRole.deptId <> 0 AND userRole.isActive = :isActive',
        { isActive: 'Y' },
      )
      .select(['user.EMAIL AS email'])
      .getRawMany();

    return histories;
  }
  //End WorkflowSendMailUseCase

  async findWorkflowStatusesByWfId(wfId: number): Promise<
    {
      wfStatusId: number;
      wfStatusNameTh: string;
      wfStatusNameEn: string;
    }[]
  > {
    const statuses = await this.wfStatusModel
      .createQueryBuilder('status')
      .where('status.wf_id = :wfId', { wfId })
      .andWhere('status.is_active = :isActive', { isActive: 'Y' })
      .select([
        'status.id AS "wfStatusId"',
        'status.status_name_th AS "wfStatusNameTh"',
        'status.status_name_en AS "wfStatusNameEn"',
      ])
      .orderBy('status.id', 'ASC')
      .getRawMany();

    return statuses;
  }

  async findWorkflowStepsByWfId(wfId: number): Promise<
    {
      id: number;
      wfStepNameTH: string;
      wfStepNameEN: string;
      wfStepNameKH: string;
      stepOwnerType: string;
      stepOwnerRole: string;
      stepOwnerUser: string;
    }[]
  > {
    const steps = await this.wfStepModel.find({
      where: { wfId, isActive: 'Y' },
      select: ['id', 'wfStepNameTH', 'wfStepNameEN', 'wfStepNameKH', 'stepOwnerType', 'stepOwnerRole', 'stepOwnerUser'],
      order: { id: 'ASC' },
    });

    return steps.map((step) => ({
      id: step.id,
      wfStepNameTH: step.wfStepNameTH,
      wfStepNameEN: step.wfStepNameEN,
      wfStepNameKH: step.wfStepNameKH,
      stepOwnerType: step.stepOwnerType,
      stepOwnerRole: step.stepOwnerRole ?? '',
      stepOwnerUser: step.stepOwnerUser ?? '',
    }));
  }

  async updateWfStepOwner(
    stepId: number,
    stepOwnerType: string,
    stepOwnerRole: string,
    stepOwnerUser: string,
    updatedBy: number,
  ): Promise<void> {
    await this.wfStepModel.update(stepId, {
      stepOwnerType,
      stepOwnerRole: stepOwnerRole || null,
      stepOwnerUser: stepOwnerUser || null,
      updateBy: updatedBy,
    });
  }
}
