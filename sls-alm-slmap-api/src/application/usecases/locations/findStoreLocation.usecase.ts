import { Inject, Injectable } from '@nestjs/common';
import { PoiRepositoryPort } from '../../ports/poi.repository';

@Injectable()
export class FindStoreLocationUseCase {
  constructor(
    @Inject('PoiRepository') private readonly poiRepository: PoiRepositoryPort,
  ) {}

  async handler(query: string) {
    return await this.poiRepository.findPoiLocationByQuery(query);
  }
}
