import { QuotaRound } from '../../../../domain/quotaRound';
import { QuotaRoundEntity } from '../entities/quotaRound.entity';

export class RoundWithAllocationMapper {
  static toDomain(entity: QuotaRoundEntity): QuotaRound {
    return {
      id: entity.id,
      name: entity.name,
      seq: entity.seq,
      status: entity.quotaRoundStatus,
      startMonth: entity.startMonth,
      endMonth: entity.endMonth,
      dueDate: new Date(entity.dueDate),
      isReview: entity.isReview,
      allocations: entity.allocations
        ? entity.allocations.map((a) => ({
            allocationId: a.id,
            quotaRoundId: a.quotaRoundId,
            zoneId: a.zone.id,
            zoneCode: a.zone.zoneCode,
            assignedQuota: a.assignedQuota,
            reservedQuota: a.reservedQuota,
          }))
        : [],
    };
  }
  static toDomains(entities: QuotaRoundEntity[]): QuotaRound[] {
    return entities.map((entity) => this.toDomain(entity));
  }
}
