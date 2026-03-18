import { TradeareaEntity } from '../entities/tradearea.entity';
import { Tradearea } from '../../../../domain/tradearea';

export class TradeareaMapper {
  static toDomain(entity: TradeareaEntity | null): Tradearea | null {
    if (!entity) {
      return null;
    }

    let geom = null;
    if (entity.poi?.shape) {
      try {
        geom =
          typeof entity.poi.shape === 'string'
            ? JSON.parse(entity.poi.shape)
            : entity.poi.shape;
      } catch {
        geom = null;
      }
    }

    return {
      id: entity.id,
      refStoreCode: entity.refStoreCode,
      zoneCode: entity.zoneCode || entity.poi?.zoneCode || undefined,
      subzoneCode: entity.subzoneCode || entity.poi?.subzoneCode || undefined,
      storeName: entity.poi?.sevenElevenStores?.[0]?.storename || undefined,
      storeCode: entity.poi?.sevenElevenStores?.[0]?.storecode || undefined,
      status: entity.status,
      effectiveDate: entity.effectiveDate,
      shape: typeof entity.shape === 'string' ? JSON.parse(entity.shape) : entity.shape,
      areaColor: entity.areaColor,
      comment: entity.comment,
      warning: entity.warning,
      globalId: entity.globalId,
      createdAt: entity.createdAt,
      createUser: entity.createUser,
      updatedAt: entity.updatedAt,
      updateUser: entity.updateUser,
      deletedAt: entity.deletedAt,
      deleteUser: entity.deleteUser,
      refPointX: entity.refPointX,
      refPointY: entity.refPointY,
      wfTransactionId: entity.wfTransactionId,
      locationT: entity.poi?.locationT || undefined,
      lat: (typeof entity.poi?.shape === 'string'
        ? JSON.parse(entity.poi.shape)
        : entity.poi?.shape
      )?.coordinates?.[1],
      lng: (typeof entity.poi?.shape === 'string'
        ? JSON.parse(entity.poi.shape)
        : entity.poi?.shape
      )?.coordinates?.[0],
      poiId: entity.poiId,
      poiGeom: geom,
      tradeareaTypeId: entity.tradeareaType?.id,
      tradeareaTypeName: entity.tradeareaType?.name,
      wfId: entity.workflowTransaction?.wfId,
      parentId: entity.parentId,
    } as Tradearea;
  }

  static toDomains(entities: TradeareaEntity[]): Tradearea[] {
    return entities.map((entity) => this.toDomain(entity)!);
  }
}
