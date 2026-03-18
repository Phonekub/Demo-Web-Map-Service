import { Injectable, Inject } from '@nestjs/common';
import { QuotaRoundRepositoryPort } from 'src/application/ports/quotaRound.repository';
import { QuotaConfig } from 'src/domain/quotaConfig';
import { Language } from '../../../common/enums/language.enum';

@Injectable()
export class GetQuotaConfigUseCase {
  constructor(
    @Inject('QuotaRoundRepository')
    private readonly quotaRoundRepository: QuotaRoundRepositoryPort,
  ) {}

  async handler(
    year: number,
    locationType: string,
    quotaType: string,
    language?: Language,
  ): Promise<QuotaConfig | null> {
    return await this.quotaRoundRepository.getQuotaConfig(
      year,
      locationType,
      quotaType,
      language,
    );
  }
}
