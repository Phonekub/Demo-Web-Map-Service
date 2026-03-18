import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { TradeareaRepositoryPort } from '../../ports/tradearea.repository';
import { Tradearea } from '../../../domain/tradearea';
import { CreateTradeareaDto } from '../../../adapter/inbound/dtos/tradearea.dto';
import { CreateWorkflowTransactionUseCase } from '../workflow/createWorkflowTransaction.usecase';
import { UserRepositoryPort } from '../../ports/user.repository';
import { TradeareaStatus } from '../../../common/enums/tradearea.enum';
import { PoiRepositoryPort } from 'src/application/ports/poi.repository';
import { Poi } from 'src/domain/poi';

interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

@Injectable()
export class CreateTradeareaUseCase {
  constructor(
    @Inject('TradeareaRepository')
    private readonly TradeareaRepository: TradeareaRepositoryPort,
    @Inject('PoiRepository') private readonly poiRepository: PoiRepositoryPort,
    private readonly createWorkflowTransactionUseCase: CreateWorkflowTransactionUseCase,
  ) {}

  async handler(dto: CreateTradeareaDto, userId: number): Promise<Tradearea> {
    const poi = await this.poiRepository.findById(dto.poiId);

    if (!poi) {
      throw new BadRequestException('POI not found');
    }

    this.validatePolygon(poi, dto.shape as GeoJSONPolygon);

    const tradeareaType = await this.TradeareaRepository.findTradeareaTypeByName(
      dto.type,
    );
    // ✅ Create trade area
    const Tradearea = await this.TradeareaRepository.create({
      // refStoreCode: dto.refStoreCode,
      zoneCode: dto.zoneCode?.toUpperCase(),
      subzoneCode: dto.subzoneCode,
      shape: dto.shape,
      storeName: dto.storeName,
      areaColor: dto.areaColor,
      comment: dto.comment,
      warning: dto.warning,
      status: TradeareaStatus.DRAFT,
      poiId: dto.poiId,
      tradeareaTypeId: tradeareaType.id,
      effectiveDate: dto.effectiveDate ? dto.effectiveDate : undefined,
    });

    const workflowTransaction = await this.createWorkflowTransactionUseCase.handler(
      1,
      Tradearea.id,
      userId,
    );

    if (!workflowTransaction.success) {
      await this.TradeareaRepository.update(Tradearea.id, {
        deletedAt: new Date(),
        status: TradeareaStatus.INACTIVE,
      });
      throw new BadRequestException(workflowTransaction.error.message);
    }

    await this.TradeareaRepository.update(Tradearea.id, {
      wfTransactionId: workflowTransaction.data.wfTransactionId,
    });

    return Tradearea;
  }

  private validatePolygon(poi: Poi, shape: GeoJSONPolygon): void {
    if (shape.type !== 'Polygon') {
      throw new Error('Shape must be a Polygon');
    }

    if (!shape.coordinates || shape.coordinates.length === 0) {
      throw new Error('Polygon must have coordinates');
    }

    const radius = 600;
    const { geom } = poi;

    const centerLat = geom.coordinates[0];
    const centerLng = geom.coordinates[1];
    for (const arrCoord of shape.coordinates) {
      for (const coord of arrCoord) {
        // Calculate distance from center
        const dLng =
          (coord[1] - centerLng) * 111000 * Math.cos((centerLat * Math.PI) / 180);
        const dLat = (coord[0] - centerLat) * 111000;
        const distance = Math.sqrt(dLng * dLng + dLat * dLat);

        if (radius <= distance) throw new BadRequestException('วาดเกิน 600 เมตร');
      }
    }
  }
}
