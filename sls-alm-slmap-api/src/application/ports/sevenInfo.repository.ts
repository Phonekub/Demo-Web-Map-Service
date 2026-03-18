import { SevenInfo } from '../../domain/sevenInfo';

export interface SevenInfoRepositoryPort {
  findByPoiId(poiId: number): Promise<SevenInfo | null>;
}
