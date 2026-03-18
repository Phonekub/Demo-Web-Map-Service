export class MasterCpallZone {
  id: number;
  zone: string;
  subzone: string;
  shape: {
    type: string;
    coordinates: number[] | number[][] | number[][][];
  };
}
