export class SevenEleven {
  id: number;
  uid: string;
  poiId: number;
  storecode: string;
  storename: string;
  formLocNumber: string;
  sevenType: number;
  isActive: string;
  // POI related fields
  locationT: string;
  locationE: string;
  zoneCode: string;
  subzoneCode: string;
  provCode: string;
  ampCode: string;
  tamCode: string;
  shape: {
    type: string;
    coordinates: number[][][];
  };
}
