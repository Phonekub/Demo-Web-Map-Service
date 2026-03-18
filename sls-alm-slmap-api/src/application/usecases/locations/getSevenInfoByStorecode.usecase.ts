import { Inject, Injectable } from '@nestjs/common';
import { SevenInfoRepositoryPort } from '../../ports/sevenInfo.repository';
import { SevenInfo } from '../../../domain/sevenInfo';

@Injectable()
export class GetSevenInfoByStorecodeUseCase {
  constructor(
    @Inject('SevenInfoRepository')
    private readonly sevenInfoRepository: SevenInfoRepositoryPort,
  ) {}

  async handler(poiId: number): Promise<SevenInfo | null> {
    return this.sevenInfoRepository.findByPoiId(poiId);
  }
}
