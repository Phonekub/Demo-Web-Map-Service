export enum AreaShape {
  Polygon = 'polygon',
  Circle = 'circle',
}

export class Poi {
  id: number;
  uid: string;
  name?: string;
  namt?: string;
  branchName: string;
  branchCode: string;
  location: string;
  layerId?: number;
  layerName?: string;
  layerProperties?: string[];
  layerTh?: string;
  layerEn?: string;
  layerKh?: string;
  geom: {
    type: string;
    coordinates: number[];
  };
  area: {
    id: number;
    coordinates: number[][];
    shape: AreaShape;
  };
  totalCompetitor?: number;
  formLocNumber?: string;
  sevenType?: number;
  sevenTypeName?: string;
  grade?: string;
  distance?: number;
  saleAverage?: number;
  openTime?: string;
  closeTime?: string;
  competitorType?: number;
  competitorTypeName?: string;
  competitorTypeNameTh?: string;
  competitorTypeNameEn?: string;
  competitorTypeNameKh?: string;
  competitorTypeSeqNo?: number;
  competitorTypeCodeMapping?: string;
  competitorLayerId?: number;
  subCode?: string;
  storeType?: string;
  personAmount?: number;
  parkingAmount?: number;
  workingDay?: string;
  goodsType?: string;
  profileSubCategoryId?: number;
  formConfigId?: number;
  populationAmount?: string;
  percentPredictCustomer?: string;
  provCode?: string;
  ampCode?: string;
  tamCode?: string;
  provGrade?: string;
  provCategory?: number;
  layer: {
    id: number;
    symbol: string;
  };
  status: string;
}
