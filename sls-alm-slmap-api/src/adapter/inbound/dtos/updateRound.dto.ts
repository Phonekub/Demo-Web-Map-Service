import { AllocationDto, RoundDataDto } from './createRound.dto';

export class UpdateRoundDto {
  round: RoundDataDto;
  allocations: AllocationDto[];
}
