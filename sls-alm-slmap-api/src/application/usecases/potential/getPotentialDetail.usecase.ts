import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PoiRepositoryPort } from '../../ports/poi.repository';
import { PoiEntity } from '../../../adapter/outbound/repositories/entities/poi.entity';
import { PoiPotentialEntity } from '../../../adapter/outbound/repositories/entities/potential.entity';
import { ElementSevenElevenEntity } from '../../../adapter/outbound/repositories/entities/elementSevenEleven.entity';
import { ElementVendingMachineEntity } from '../../../adapter/outbound/repositories/entities/elementVendingMachine.entity';
import { MasterRepository } from '../../../adapter/outbound/repositories/master.repository';

export interface GetPoiDetailResult {
  poi: PoiEntity;
  potentialStore?: PoiPotentialEntity;
  sevenEleven?: ElementSevenElevenEntity;
  vendingMachine?: ElementVendingMachineEntity;
}

@Injectable()
export class GetPotentialDetailUseCase {
  constructor(
    @Inject('PoiRepository')
    private readonly poiRepository: PoiRepositoryPort,
    @Inject('MasterRepository')
    private readonly masterRepository: MasterRepository,
  ) {}

  async handler(poiId: number): Promise<GetPoiDetailResult> {
    // Validate POI ID
    if (!poiId || poiId <= 0) {
      throw new BadRequestException('Invalid POI ID');
    }

    // Get POI detail with all related entities
    const poiDetail = await this.poiRepository.findPoiDetailById(poiId);

    if (!poiDetail) {
      throw new NotFoundException(`POI with ID ${poiId} not found`);
    }

    if (poiDetail.potentialStore) {
      const potentialStatus =
        await this.masterRepository.getCommonCode('POTENTIAL_STATUS');
      const mapStatus =
        potentialStatus.find(
          (code) => Number(code.value) === Number(poiDetail.potentialStore.status),
        )?.text || poiDetail.potentialStore.status;

      const approveStatus = await this.masterRepository.getCommonCode(
        'POTENTIAL_APPROVE_STATUS',
      );
      const mapApproveStatus =
        approveStatus.find(
          (code) => Number(code.value) === Number(poiDetail.potentialStore.approveStatus),
        )?.text || poiDetail.potentialStore.approveStatus;

      poiDetail.potentialStore.status = mapStatus.toString();
      poiDetail.potentialStore.approveStatus = mapApproveStatus.toString();
    }

    return {
      poi: poiDetail.poi,
      potentialStore: poiDetail.potentialStore,
      sevenEleven: poiDetail.sevenEleven,
      vendingMachine: poiDetail.vendingMachine,
    };
  }
}
