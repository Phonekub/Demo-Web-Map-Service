import { Builder } from 'builder-pattern';
import { PotentialPendingApproval } from '../../../../domain/potentialPendingApproval';
import { PoiPotentialEntity } from '../entities/potential.entity';

export class PendingApprovalPotentialMapper {
  static toDomain(entity: PoiPotentialEntity): PotentialPendingApproval {
    return Builder(PotentialPendingApproval)
      .potentialId(entity.id)
      .poiId(entity.poiId)
      .uid(entity.uid)
      .namt(entity.poi?.namt || '')
      .locationT(entity.poi?.locationT || '')
      .wfTransactionId(entity.wfTransactionId)
      .wfStatusId(entity.workflowTransaction?.wfStatusId)
      .statusNameTh(entity.workflowTransaction?.workflowStatus?.statusNameTh || '')
      .wfId(entity.workflowTransaction?.wfId)
      .wfName(entity.workflowTransaction?.workflow?.wfName || '')
      .createDate(entity.createdDate)
      .build();
  }

  static toDomains(entities: PoiPotentialEntity[]): PotentialPendingApproval[] {
    return entities.map((entity) => this.toDomain(entity));
  }
}
