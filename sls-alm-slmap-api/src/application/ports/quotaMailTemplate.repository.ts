import { Language } from '../../common/enums/language.enum';
import {
  MailTemplateResponseRaw,
  SaveMailTemplateRequest,
} from '../../domain/quotaMailTemplate';

export interface QuotaMailTemplateRepositoryPort {
  getMailTemplate(wfId: number, language: Language): Promise<MailTemplateResponseRaw[]>;
  saveMailTemplate(request: SaveMailTemplateRequest, userId: number): Promise<void>;
}
