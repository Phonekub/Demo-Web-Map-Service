import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  CreatePotentialPoiData,
  PoiRepositoryPort,
} from '../../../application/ports/poi.repository';
import { UpdatePoiDto } from '../../../adapter/inbound/dtos/updatePoi.dto';
import { PoiEntity } from '../../../adapter/outbound/repositories/entities/poi.entity';
import { PoiPotentialEntity } from '../../../adapter/outbound/repositories/entities/potential.entity';
import { ElementSevenElevenEntity } from '../../../adapter/outbound/repositories/entities/elementSevenEleven.entity';
import { ElementVendingMachineEntity } from '../../../adapter/outbound/repositories/entities/elementVendingMachine.entity';
import { PoiType } from '../../../common/enums/poi.enum';
import { Builder } from 'builder-pattern';
import { Potential } from '../../../domain/potential';

export interface UpdatePoiResult {
  type: PoiType;
  poi: PoiEntity;
  potentialStore?: PoiPotentialEntity;
  sevenEleven?: ElementSevenElevenEntity;
  vendingMachine?: ElementVendingMachineEntity;
}

export type UpdatePoiDtoWithPotential = Partial<
  CreatePotentialPoiData['seven'] & {
    potentialStoreId: number;
    isActive: string;
  }
>;

@Injectable()
export class UpdatePoiUseCase {
  constructor(
    @Inject('PoiRepository')
    private readonly poiRepository: PoiRepositoryPort,
  ) {}

  async handler(
    poiId: number,
    dto: UpdatePoiDto,
    userId?: number,
  ): Promise<UpdatePoiResult> {
    // Validate POI ID
    if (!poiId || poiId <= 0) {
      throw new BadRequestException('Invalid POI ID');
    }

    // Check if POI exists and get its details
    const existingPoi = await this.poiRepository.findPoiDetailById(poiId);
    if (!existingPoi) {
      throw new NotFoundException(`POI with ID ${poiId} not found`);
    }

    // Determine the type - use provided type or infer from existing data
    const poiType =
      dto.type || (existingPoi.potentialStore ? PoiType.POTENTIAL : PoiType.ENVIRONMENT);

    if (poiType === PoiType.ENVIRONMENT) {
      await this.updateEnvironmentPoi(poiId, dto, userId);
    } else if (poiType === PoiType.POTENTIAL) {
      await this.updatePotentialPoi(poiId, existingPoi.potentialStore.id, dto);
    } else {
      throw new BadRequestException(`Invalid POI type: ${poiType}`);
    }
    const updatedPoi = await this.poiRepository.findPoiDetailById(poiId);

    return {
      type: poiType,
      poi: updatedPoi.poi,
      potentialStore: updatedPoi.potentialStore,
      sevenEleven: updatedPoi.sevenEleven,
      vendingMachine: updatedPoi.vendingMachine,
    };
  }

  private async updateEnvironmentPoi(
    poiId: number,
    dto: UpdatePoiDto,
    userId?: number,
  ): Promise<void> {
    if (!dto.environment) {
      throw new BadRequestException(
        'Environment data is required for environment type POI',
      );
    }

    await this.poiRepository.updateEnvironmentPoi(poiId, {
      name: dto.environment.name,
      address: dto.environment.address,
      category: dto.environment.category,
      // subCategory: dto.environment.subCategory,
      createdBy: userId, // Consider adding updatedBy field
    });
  }

  private async updatePotentialPoi(
    poiId: number,
    potentialStoreId: number,
    dto: UpdatePoiDto,
  ): Promise<void> {
    const poi = Builder<PoiEntity>()
      .name(dto.potential.name)
      .locationT(dto.potential.address)
      .build();
    await this.poiRepository.update(poiId, poi);

    const potentialData = Builder(Potential)
      .locationType(dto.potential.locationType)
      .areaType(dto.potential.areaType)
      .canSaleAlcohol(dto.potential.alcoholSale === 1 ? 'Y' : 'N')
      .canSaleCigarette(dto.potential.cigaretteSale === 1 ? 'Y' : 'N')
      .grade(dto.potential.grade)
      .build();

    await this.poiRepository.updatePotentialStore(potentialStoreId, potentialData);

    if (dto.seven) {
      const updateSevenData = Builder<UpdatePoiDtoWithPotential>()
        .potentialStoreId(potentialStoreId)
        .standardLayout(dto.seven.standardLayout)
        .name(dto.seven.name)
        .storeCode(dto.seven.storeCode)
        .storeFranchise(
          dto.seven.investmentType ? Number(dto.seven.investmentType) : undefined,
        )
        .impactTypeSite(dto.seven.impactType ? Number(dto.seven.impactType) : undefined)
        .impactDetail(dto.seven.impactDetail)
        .estimateDateOpen(dto.seven.estimateDateOpen ?? dto.seven.openMonth)
        .storeWidth(
          dto.seven.dimension?.width ? Number(dto.seven.dimension.width) : undefined,
        )
        .storeLength(
          dto.seven.dimension?.length ? Number(dto.seven.dimension.length) : undefined,
        )
        .saleArea(
          dto.seven.dimension?.saleArea
            ? Number(dto.seven.dimension.saleArea)
            : undefined,
        )
        .stockArea(
          dto.seven.dimension?.stockArea
            ? Number(dto.seven.dimension.stockArea)
            : undefined,
        )
        .storeArea(
          dto.seven.dimension?.storeArea
            ? Number(dto.seven.dimension.storeArea)
            : undefined,
        )
        .parkingCount(dto.seven.parkingCount ? Number(dto.seven.parkingCount) : undefined)
        .storeBuildingType(
          dto.seven.storeBuildingType !== undefined
            ? Number(dto.seven.storeBuildingType)
            : undefined,
        )
        .build();

      await this.poiRepository.updateSevenElement(updateSevenData);
    }

    if (dto.vending) {
      const vendingData = Builder<CreatePotentialPoiData['vending']>()
        .storecode(dto.vending.parentBranchCode)
        .machineId(dto.vending.machineId)
        .name(dto.vending.name)
        .serialNumber(dto.vending.serialNumber)
        .vendingModel(dto.vending.model)
        .vendingType(
          dto.vending.vendingType !== undefined
            ? Number(dto.vending.vendingType)
            : Number((dto.vending as any).installationType),
        )
        .locationAddress(dto.vending.address ?? dto.vending.locationAddress)
        .contractStartDate(dto.vending.contractStartDate)
        .contractFinishDate(dto.vending.contractEndDate)
        .contractCancelDate(dto.vending.contractCancelDate)
        .openDate(dto.vending.serviceStartDate)
        .closeDate(dto.vending.serviceEndDate)
        .targetPoint(dto.vending.position ?? dto.vending.targetPoint)
        .businessTypeCode(dto.vending.businessTypeCode)
        .floor(parseInt(dto.vending.floor))
        .build();

      await this.poiRepository.updateVendingElement(potentialStoreId, vendingData);
    }
  }
}
