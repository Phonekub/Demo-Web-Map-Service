import { Language } from '../../common/enums/language.enum';
import { MailParametersResponse } from '../../domain/quotaMailParameters';


export interface QuotaMailParametersRepositoryPort {
  getMailParameters(language: Language): Promise<MailParametersResponse[]>;
}