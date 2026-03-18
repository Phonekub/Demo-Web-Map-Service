export class VendingMachine {
  id: number;
  uid: string;
  poiId: number;
  mainStorecode: string;
  mainStorename: string;
  machineId: string;
  locationTypeCode: number;
  formLocNumber: string;
  serialNumber: string;
  type: string;
  model: string;
  flowStatus: string;
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
