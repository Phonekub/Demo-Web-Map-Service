import { Inject, Injectable } from '@nestjs/common';
import { QuotaMailParametersRepositoryPort } from '../../ports/quotaMailParameters.repository';
import { MailParametersResponse } from '../../../domain/quotaMailParameters';
import { Language } from '../../../common/enums/language.enum';

@Injectable()
export class GetMailParametersUseCase {
  constructor(
    @Inject('QuotaMailParametersRepository')
    private readonly quotaMailParametersRepository: QuotaMailParametersRepositoryPort,
  ) { }

  async execute(language: Language): Promise<MailParametersResponse[]> {

    return await this.quotaMailParametersRepository.getMailParameters(language);
  }
}
