export class PoiTradearea {
  tradeareaId: number;
  poiId: number;
  storeCode: string;
  storeName: string;
  poiGeom: {
    type: string;
    coordinates: number[];
  };
  areaGeom: {
    type: string;
    coordinates: number[][][];
  };
}
