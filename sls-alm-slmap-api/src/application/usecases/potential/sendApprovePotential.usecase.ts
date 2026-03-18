import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { BackupProfileRepositoryPort } from '../../ports/backupProfile.repository';
import { PoiRepositoryPort } from '../../ports/poi.repository';
import { CreateWorkflowTransactionUseCase } from '../workflow/createWorkflowTransaction.usecase';
import { Builder } from 'builder-pattern';
import { Potential } from 'src/domain/potential';
import { ApproveStatus, PotentialStatus } from '@common/enums/potential.enum';
import { WorkflowApprovalUseCase } from '../workflow/workflowApproval.usecase';
import { WorkflowAction } from '@common/enums/action.enum';
import {
  WorkflowSendMailUseCase,
  WorkflowSendMailUseCasePayload,
} from '../workflow/workflowSendMail.usecase';

export interface SendApprovePotentialResult {
  success: boolean;
  message: string;
}

@Injectable()
export class SendApprovePotentialUseCase {
  constructor(
    @Inject('BackupProfileRepository')
    private readonly backupProfileRepository: BackupProfileRepositoryPort,
    @Inject('PoiRepository')
    private readonly poiRepository: PoiRepositoryPort,
    private readonly createWorkflowTransactionUseCase: CreateWorkflowTransactionUseCase,
    private readonly workflowApprovalUseCase: WorkflowApprovalUseCase,
    private readonly workflowSendMailUseCase: WorkflowSendMailUseCase,
  ) {}

  async handler(poiId: number, userId: number): Promise<SendApprovePotentialResult> {
    // Validate input
    if (!poiId || poiId <= 0) {
      throw new BadRequestException('Invalid POI ID');
    }

    if (!userId || userId <= 0) {
      throw new BadRequestException('Invalid User ID');
    }

    // 2.1 Check if backup profile exists
    const backupProfile = await this.backupProfileRepository.findByPoiId(poiId);

    // 2.2 If not found, throw bad request
    if (!backupProfile) {
      throw new BadRequestException(`Backup profile not found for POI ID: ${poiId}`);
    }

    // Get potential store details
    const poiDetail = await this.poiRepository.findPoiDetailById(poiId);

    if (!poiDetail || !poiDetail.potentialStore) {
      throw new NotFoundException(`Potential store not found for POI ID: ${poiId}`);
    }

    const potentialStoreId = poiDetail.potentialStore.id;

    const workflowSendApproval = await this.workflowApprovalUseCase.handler({
      refId: potentialStoreId,
      wfTransactionId: poiDetail.potentialStore.wfTransactionId,
      approvalAction: WorkflowAction.SEND_APPROVE,
      userId: userId,
    });

    if (!workflowSendApproval.success) {
      throw new BadRequestException(
        `Failed to create workflow transaction: ${workflowSendApproval.error?.message}`,
      );
    }

    const wfTransactionId = workflowSendApproval.data?.wfTransactionId;
    if (!wfTransactionId) {
      throw new BadRequestException(
        'Workflow transaction ID not returned from workflow service',
      );
    }

    if (!workflowSendApproval.route?.wfEmailDetailId) {
      throw new BadRequestException(
        'Workflow email detail ID not returned from workflow service',
      );
    }

    const shape = poiDetail.poi?.shape as { type: string; coordinates: number[] };
    const [longitude, latitude] = shape.coordinates;
    const link = `poiId=${poiId}&store=${poiDetail.poi.namt}&lat=${latitude}&longitude=${longitude}`;
    const template = {
      LAYER_NAME: 'Potential Store',
      STEP_NAME: workflowSendApproval.route.wfStep?.wfStepNameTH || 'ส่งคำขออนุมัติ',
      LOG_REMARK: '-',
      POI_ID: poiId.toString(),
      ZONE: poiDetail.poi?.zoneCode || '-',
      SUB_ZONE: poiDetail.poi?.subzoneCode || '-',
      KEY_FIELD: `ชื่อสถานที่: ${poiDetail.poi?.namt || '-'}`,
      STORE_NAME: poiDetail.poi?.namt || '-',
      POTENTIAL_ID: potentialStoreId.toString(),
      LINK: `${process.env.BASE_URL_WEB}/maps?${link}`,
    };

    const sendMailPayload = Builder<WorkflowSendMailUseCasePayload>()
      .wfTransactionId(poiDetail.potentialStore.wfTransactionId)
      .emailDetailId(workflowSendApproval.route.wfEmailDetailId)
      .approvalAction(WorkflowAction.SEND_APPROVE)
      .userId(userId)
      .templateData(template)
      .build();

    await this.workflowSendMailUseCase.handler(sendMailPayload);

    const potentialData = Builder<Potential>()
      .status(PotentialStatus.WAITING_APPROVE)
      .approveStatus(ApproveStatus.WAITING_APPROVE)
      .build();
    await this.poiRepository.updatePotentialStore(potentialStoreId, potentialData);

    return {
      success: true,
      message: 'Successfully sent potential for approval',
    };
  }
}
