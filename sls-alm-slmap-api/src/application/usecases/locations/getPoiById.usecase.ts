import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PoiRepositoryPort } from '../../ports/poi.repository';
import { Poi } from '../../../domain/poi';

@Injectable()
export class GetPoiByIdUseCase {
  constructor(
    @Inject('PoiRepository')
    private readonly poiRepository: PoiRepositoryPort,
  ) {}

  async handler(poiId: number, accessArea: Record<string, string[]>): Promise<Poi> {
    // Validate POI ID
    if (!poiId || poiId <= 0) {
      throw new BadRequestException('Invalid POI ID');
    }

    const zoneCodes = Object.keys(accessArea);
    if (zoneCodes.length === 0) {
      return {} as Poi;
    }

    const boundaryArea: [string, string][] = zoneCodes.flatMap((zoneCode) =>
      accessArea[zoneCode].map((code) => [zoneCode, code] as [string, string]),
    );

    // Get POI with zone information
    const result = await this.poiRepository.findPoiById(poiId, boundaryArea);
    if (!result) {
      throw new NotFoundException(`POI with ID ${poiId} not found`);
    }

    return result;
  }
}
