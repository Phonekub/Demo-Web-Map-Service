import { Injectable, Inject } from '@nestjs/common';
import { QuotaAllocationRepositoryPort } from '../../ports/quotaAllocation.repository';

@Injectable()
export class CheckLocationHistoryUseCase {
  constructor(
    @Inject('QuotaAllocationRepositoryPort')
    private readonly quotaAllocationRepo: QuotaAllocationRepositoryPort,
  ) {}

  async execute(poiId: number): Promise<{ success: boolean; isUsed: boolean }> {
    try {
      // ✅ ต้องเรียกผ่าน quotaAllocationRepo ที่ฉีดเข้ามา
      // ❌ ไม่ใช่เรียก this.itemRepository เพราะ UseCase ไม่รู้จักไอเทมนี้โดยตรง
      const isUsed = await this.quotaAllocationRepo.isLocationUsedInHistory(poiId);

      return { success: true, isUsed };
    } catch (error) {
      console.error('DEBUG Error:', error);
      return { success: false, isUsed: false };
    }
  }
}
