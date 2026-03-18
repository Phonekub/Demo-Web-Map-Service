import { Injectable } from '@nestjs/common';
import { MapGateway, StoreLocation } from '../interfaces/gateways/map.gateway';

@Injectable()
export class ArcgisGateway implements MapGateway {
  async getAllStoreLocationMarker(): Promise<StoreLocation[]> {
    return [
      {
        id: 1,
        position: [100.5018, 13.7563],
        name: 'Bangkok',
        description: 'Capital of Thailand',
      },
      {
        id: 2,
        position: [98.9853, 18.7883],
        name: 'Chiang Mai',
        description: 'Northern city of Thailand',
      },
      {
        id: 3,
        position: [98.3923, 7.8804],
        name: 'Phuket',
        description: 'Famous island in Thailand',
      },
      {
        id: 4,
        position: [102.8359, 16.4419],
        name: 'Khon Kaen',
        description: 'City in northeastern Thailand',
      },
      {
        id: 5,
        position: [99.9436, 12.5657],
        name: 'Hua Hin',
        description: 'Beach town in Thailand',
      },
    ];
  }
}
