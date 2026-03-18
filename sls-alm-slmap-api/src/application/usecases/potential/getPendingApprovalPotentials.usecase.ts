import { Injectable, Inject } from '@nestjs/common';
import { PoiRepositoryPort } from '../../ports/poi.repository';
import { PotentialPendingApproval } from '../../../domain/potentialPendingApproval';

@Injectable()
export class GetPendingApprovalPotentialsUseCase {
  constructor(
    @Inject('PoiRepository')
    private readonly poiRepository: PoiRepositoryPort,
  ) {}

  async handler(
    wfId?: number,
    userId?: number,
    poiId?: number,
  ): Promise<PotentialPendingApproval[]> {
    const result = await this.poiRepository.findPotentialsPendingApproval(
      wfId,
      userId,
      poiId,
    );
    return result;
  }
}
