import { Injectable, Inject } from '@nestjs/common';
import { PoiRepositoryPort } from '../../ports/poi.repository';
import { Poi } from '../../../domain/poi';
import { NearbySearchQuery } from '../../../adapter/inbound/dtos/search.dto';

@Injectable()
export class SearchNearbyEntertainmentAreaUseCase {
  constructor(
    @Inject('PoiRepository')
    private readonly poiRepository: PoiRepositoryPort,
  ) {}

  async handler(query: NearbySearchQuery): Promise<[Poi[], number]> {
    const boundaryArea: [string, string][] = [];

    const [data, total] = await this.poiRepository.findEntertainmentAreaNearby(
      query.lat,
      query.long,
      query.distance,
      boundaryArea,
      100,
      0,
    );

    return [data, total];
  }
}
