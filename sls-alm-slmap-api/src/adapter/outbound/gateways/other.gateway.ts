import { Injectable } from '@nestjs/common';
import { MapGateway, StoreLocation } from '../interfaces/gateways/map.gateway';

@Injectable()
export class OtherMapGateway implements MapGateway {
  async getAllStoreLocationMarker(): Promise<StoreLocation[]> {
    return [
      {
        id: 6,
        position: [100.6067, 13.5991],
        name: 'Samutprakan',
        description: 'Province near Bangkok, known for Ancient City and Erawan Museum',
      },
      {
        id: 7,
        position: [99.5328, 14.0228],
        name: 'Kanchanaburi',
        description: 'Western province famous for the Bridge over the River Kwai',
      },
      {
        id: 8,
        position: [103.1217, 14.9942],
        name: 'Buriram',
        description: 'Northeastern province known for Phanom Rung Historical Park',
      },
    ];
  }
}
