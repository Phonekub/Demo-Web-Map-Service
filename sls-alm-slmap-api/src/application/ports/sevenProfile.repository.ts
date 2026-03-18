import { SevenProfile } from 'src/domain/sevenProfile';

export interface SevenProfileRepository {
  getByEmployeeId(employeeId: string): Promise<SevenProfile | null>;
  getZonesByEmployeeId(employeeId: string): Promise<string[]>;
}
