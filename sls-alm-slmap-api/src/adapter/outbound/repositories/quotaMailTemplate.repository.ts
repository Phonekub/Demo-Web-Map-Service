import { QuotaMailTemplateRepositoryPort } from '../../../application/ports/quotaMailTemplate.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { WfEmailTemplateEntity } from './entities/wfEmailTemplate.entity';
import { Repository } from 'typeorm/repository/Repository';
import {
  MailTemplateResponseRaw,
  SaveMailTemplateRequest,
} from '../../../domain/quotaMailTemplate';
import { DataAccessException } from '../../../common/exceptions/quota.exception';
import { Language } from '../../../common/enums/language.enum';
import { NotFoundException } from '@nestjs/common';
import { W } from 'typeorm';
import { WfEmailDetailEntity } from './entities/wfEmailDetail.entity';

export class QuotaMailTemplateRepository implements QuotaMailTemplateRepositoryPort {
  constructor(
    @InjectRepository(WfEmailTemplateEntity)
    private readonly wfEmailTemplateRepository: Repository<WfEmailTemplateEntity>,
    @InjectRepository(WfEmailDetailEntity)
    private readonly wfEmailDetailRepository: Repository<WfEmailDetailEntity>,
  ) {}

  async getMailTemplate(
    wfId: number,
    language?: Language,
  ): Promise<MailTemplateResponseRaw[]> {
    try {
      const mapping = {
        [Language.TH]: 'mail_template_name_th',
        [Language.EN]: 'mail_template_name_en',
        [Language.KM]: 'mail_template_name_kh',
        [Language.LA]: 'mail_template_name_la',
      };

      const nameColumn = mapping[language] || 'mail_template_name';

      const results = await this.wfEmailTemplateRepository.query(
        `
  SELECT
      t.id AS "templateId",
      COALESCE(t.${nameColumn}, t.mail_template_name) AS "mailTemplateName",
      t.mail_subject AS "mailSubject",
      t.mail_content AS "mailContent",
      t.is_active AS "isActive",
      t.wf_id AS "wfId",
      d.mail_to AS "mailTo",
      d.mail_cc AS "mailCC",
      m.mail_type AS "mailType",
      u."ID" AS "userId",
      CONCAT(u."FIRST_NAME", ' ', u."LAST_NAME") AS "fullName",
      u."EMAIL" AS "email",
      STRING_AGG(DISTINCT uz.zone_code, ',' ORDER BY uz.zone_code) AS "zones"
  FROM allmap.wf_email_template t
  LEFT JOIN allmap.wf_email_detail d ON d.wf_email_template_id = t.id
  LEFT JOIN LATERAL (
      SELECT
          mail_type,
          trim(value) AS email
      FROM (
          VALUES
              ('TO', d.other_mail_to),
              ('CC', d.other_mail_cc)
      ) AS x(mail_type, mail_list)
      CROSS JOIN LATERAL unnest(string_to_array(mail_list, ',')) AS value
  ) m ON TRUE
  LEFT JOIN allmap."AUTH_USER" u ON u."EMAIL" = m.email
  LEFT JOIN allmap.user_zone uz ON uz.user_id = u."ID"
  WHERE t.wf_id = $1
  GROUP BY
      t.id,
      t.${nameColumn},
      t.mail_template_name,
      t.mail_subject,
      t.mail_content,
      t.is_active,
      t.wf_id,
      d.mail_to,
      d.mail_cc,
      m.mail_type,
      u."ID",
      u."FIRST_NAME",
      u."LAST_NAME",
      u."EMAIL"
  `,
        [wfId],
      );
      return results;
    } catch (error) {
      throw new DataAccessException(`Failed to get mail template: ${error.message}`);
    }
  }

  async saveMailTemplate(
    request: SaveMailTemplateRequest,
    userId: number,
  ): Promise<void> {
    await this.wfEmailTemplateRepository.manager.transaction(async (manager) => {
      //1. Update Template
      const template = await manager.findOne(WfEmailTemplateEntity, {
        where: { id: request.templateId },
      });

      if (!template) {
        throw new NotFoundException('Mail template not found');
      }

      template.mailSubject = request.mailSubject;
      template.mailContent = request.mailContent;
      template.updateBy = userId;
      template.updateDate = new Date();

      await manager.save(template);

      // 2. Prepare email string
      const otherMailTo = request.otherMailTo?.length
        ? request.otherMailTo.map((u) => u.email).join(',')
        : null;

      const otherMailCC = request.otherMailCC?.length
        ? request.otherMailCC.map((u) => u.email).join(',')
        : null;

      // 3. Update ALL detail rows
      await manager.update(
        WfEmailDetailEntity,
        { wfEmailTemplateId: request.templateId },
        {
          mailTo: request.mailTo,
          mailCC: request.mailCC,
          otherMailTo: otherMailTo,
          otherMailCC: otherMailCC,
          updateBy: userId,
          updateDate: new Date(),
        },
      );
    });
  }
}
