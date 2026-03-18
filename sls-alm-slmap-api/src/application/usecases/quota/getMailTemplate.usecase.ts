import { Inject, Injectable } from '@nestjs/common';
import {
  MailTemplateResponse,
  MailTemplateResponseRaw,
  MailTemplateUser,
} from '../../../domain/quotaMailTemplate';
import { QuotaMailTemplateRepositoryPort } from '../../ports/quotaMailTemplate.repository';
import { Language } from '../../../common/enums/language.enum';

@Injectable()
export class GetMailTemplateUseCase {
  constructor(
    @Inject('QuotaMailTemplateRepository')
    private readonly quotaMailTemplateRepository: QuotaMailTemplateRepositoryPort,
  ) {}

  async execute(wfId: number, language: Language): Promise<MailTemplateResponse[]> {
    const rows = await this.quotaMailTemplateRepository.getMailTemplate(wfId, language);

    if (!rows.length) return [];

    const templateMap = new Map<number, MailTemplateResponse>();

    rows.forEach((row: MailTemplateResponseRaw) => {
      if (!templateMap.has(row.templateId)) {
        templateMap.set(row.templateId, {
          templateId: row.templateId,
          mailTemplateName: row.mailTemplateName,
          mailSubject: row.mailSubject,
          mailContent: row.mailContent,
          mailTo: row.mailTo,
          mailCC: row.mailCC,
          isActive: row.isActive,
          wfId: row.wfId,
          otherMailTo: [],
          otherMailCC: [],
        });
      }

      if (!row.userId) return;

      const user: MailTemplateUser = {
        userId: row.userId,
        fullName: row.fullName!,
        email: row.email!,
        zones: row.zones!,
      };

      if (row.mailType === 'TO') {
        templateMap.get(row.templateId)!.otherMailTo.push(user);
      } else if (row.mailType === 'CC') {
        templateMap.get(row.templateId)!.otherMailCC.push(user);
      }
    });

    return Array.from(templateMap.values());
  }
}
