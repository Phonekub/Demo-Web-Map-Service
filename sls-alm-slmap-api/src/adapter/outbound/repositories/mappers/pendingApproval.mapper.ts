import { Builder } from 'builder-pattern';
import { TradeareaPendingApproval } from '../../../../domain/tradearea';
import { TradeareaEntity } from '../entities/tradearea.entity';

export interface PendingApprovalEntity {
  tradeareaId: number;
  refStoreCode: string;
  storeName: string;
  wfTransactionId: number;
  wfStatusId: number;
  statusNameTh: string;
  wfId: number;
  wfName: string;
  createDate: Date;
}

export class PendingApprovalMapper {
  static toDomain(entity: TradeareaEntity): TradeareaPendingApproval {
    return Builder(TradeareaPendingApproval)
      .tradeareaId(entity.id)
      .poiId(entity.poiId)
      .storeCode(entity.poi?.sevenElevenStores[0]?.storecode)
      .storeName(entity.poi?.sevenElevenStores[0]?.storename)
      .wfTransactionId(entity.wfTransactionId)
      .wfStatusId(entity.workflowTransaction.wfStatusId)
      .statusNameTh(entity.workflowTransaction.workflowStatus.statusNameTh)
      .wfId(entity.workflowTransaction.wfId)
      .wfName(entity.workflowTransaction.workflow.wfName)
      .createDate(entity.createdAt)
      .build();
  }

  static toDomains(entities: TradeareaEntity[]): TradeareaPendingApproval[] {
    return entities.map((entity) => this.toDomain(entity));
  }
}
