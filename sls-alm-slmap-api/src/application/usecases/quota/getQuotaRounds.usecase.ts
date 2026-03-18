import { Injectable, Inject } from '@nestjs/common';
import { QuotaConfigRepositoryPort } from '../../ports/quotaConfig.repository';
import { DropdownOption } from '../workflow/getWorkflowStatuses.usecase';

@Injectable()
export class GetQuotaRoundsUseCase {
  constructor(
    @Inject('QuotaConfigRepository')
    private readonly quotaConfigRepository: QuotaConfigRepositoryPort,
  ) {}

  async execute(year: number): Promise<DropdownOption[]> {
    const rounds = await this.quotaConfigRepository.findDistinctRoundsByYear(year);

    return rounds.map((round) => ({
      value: round.roundName,
      text: round.roundName,
    }));
  }
}
