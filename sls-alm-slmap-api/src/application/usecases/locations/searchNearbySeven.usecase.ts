import { Inject, Injectable } from '@nestjs/common';
import { PoiRepositoryPort } from '../../ports/poi.repository';
import { NearbySearchQuery } from '../../../adapter/inbound/dtos/search.dto';
import { Poi } from '../../../domain/poi';

@Injectable()
export class SearchNearbySevenUseCase {
  constructor(
    @Inject('PoiRepository') private readonly poiRepository: PoiRepositoryPort,
  ) {}

  async handler(query: NearbySearchQuery): Promise<[Poi[], number]> {
    // Search without zone/subzone filtering
    const boundaryArea: [string, string][] = [];

    const [results, total] = await this.poiRepository.findSevenElevenNearby(
      query.lat,
      query.long,
      query.distance,
      boundaryArea,
      100,
      0,
    );

    return [results, total];
  }
}
