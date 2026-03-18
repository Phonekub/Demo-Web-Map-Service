import { Inject, Injectable, Logger } from '@nestjs/common';
import { WorkflowRepositoryPort } from '../../ports/workflow.repository';
import { mailGatewayPort } from '../../ports/mailGateway.repository';
import { UserEntity } from '../../../adapter/outbound/repositories/entities/user.entity';
import * as _ from 'lodash';
export interface WorkflowSendMailUseCasePayload {
  wfTransactionId: number;
  emailDetailId: number;
  approvalAction: string;
  userId: number;
  templateData?: Record<string, string | number | boolean>;
  remark?: string;
  connection?: {
    zone?: string;
    subZone?: string;
  };
}

export interface WorkflowSendMailUseCaseCondition {
  zone?: string;
  subZone?: string;
}

@Injectable()
export class WorkflowSendMailUseCase {
  private readonly logger = new Logger(WorkflowSendMailUseCase.name);

  constructor(
    @Inject('WorkflowRepository')
    private readonly workflowRepository: WorkflowRepositoryPort,
    @Inject('MailGateway')
    private readonly mailGateway: mailGatewayPort,
  ) {}

  async handler(payload: WorkflowSendMailUseCasePayload): Promise<{
    success: boolean;
    error?: {
      code: string;
      message: string;
    };
  }> {
    const { wfTransactionId, emailDetailId, userId, templateData, connection } = payload;

    try {
      const user = await this.workflowRepository.getUserById(userId);

      if (!user) {
        this.logger.warn(`User not found: ${userId}`);
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'ไม่พบข้อมูลผู้ใช้',
          },
        };
      }

      const emailDetail = await this.workflowRepository.getEmailDetailById(emailDetailId);

      if (!emailDetail) {
        this.logger.warn(`Email detail not found: ${emailDetailId}`);
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'ไม่พบข้อมูลการแจ้งเตือน',
          },
        };
      }

      const template = await this.workflowRepository.getEmailTemplateById(
        emailDetail.wfEmailTemplateId,
      );

      if (!template) {
        this.logger.warn(`Email template not found: ${emailDetail.wfEmailTemplateId}`);
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'ไม่พบข้อมูลการแจ้งเตือน',
          },
        };
      }

      const mailResult = await this.resolveRecipients(
        emailDetail.mailTo,
        wfTransactionId,
        false,
        connection,
      );

      const mailToEmails: Map<string, string> = new Map();
      for (const u of mailResult) {
        if (!u?.email) {
          continue;
        }
        if (mailToEmails.has(u.email)) {
          continue;
        }
        mailToEmails.set(u.email, `${u.firstName} ${u.lastName}`);
      }

      if (emailDetail.otherMailTo && emailDetail.otherMailTo.trim() !== '') {
        const otherMailToList = this.parseEmails(emailDetail.otherMailTo);
        for (const email of otherMailToList) {
          if (mailToEmails.has(email)) {
            continue;
          }
          mailToEmails.set(email, '');
        }
      }

      if (mailToEmails.size === 0) {
        this.logger.warn(
          `No valid mail recipients found for emailDetailId: ${emailDetailId}`,
        );
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'ไม่พบผู้รับอีเมล',
          },
        };
      }

      const ccResult = await this.resolveRecipients(
        emailDetail.mailCC,
        wfTransactionId,
        true,
        connection,
      );

      const mailCcEmails: string[] = [];

      for (const m of ccResult) {
        if (m?.email) {
          mailCcEmails.push(m.email);
        }
      }

      if (emailDetail.otherMailCC && emailDetail.otherMailCC.trim() !== '') {
        const otherMailCcList = this.parseEmails(emailDetail.otherMailCC);
        mailCcEmails.push(...otherMailCcList);
      }

      const uniqueMailCc = this.removeDuplicateEmails(mailCcEmails);
      let mailSubject = template.mailSubject;
      let mailContent = template.mailContent;
      const approver = mailToEmails.entries().next().value;
      const content = {
        ...templateData,
        APPROVER: mailToEmails.size > 1 ? 'ท่านผู้เกี่ยวข้อง' : approver,
      };
      try {
        mailSubject = this.renderTemplate(mailSubject, templateData);
        mailContent = this.renderTemplate(mailContent, content);
      } catch (templateError) {
        this.logger.error(`Template rendering error: ${templateError.message}`);
        return {
          success: false,
          error: {
            code: 'TEMPLATE_ERROR',
            message: 'ไม่สามารถสร้างเนื้อหาอีเมลได้',
          },
        };
      }

      // sendMail
      try {
        await this.mailGateway.sendEmail(
          mailToEmails,
          uniqueMailCc,
          mailSubject,
          mailContent,
        );

        this.logger.log(
          `Email sent successfully for wfTransactionId: ${wfTransactionId}, emailDetailId: ${emailDetailId}`,
        );

        return {
          success: true,
        };
      } catch (sendError) {
        this.logger.error(`Email send error: ${sendError.message}`, sendError.stack);
        return {
          success: false,
          error: {
            code: 'SEND_FAIL',
            message: 'ไม่สามารถส่งอีเมลได้',
          },
        };
      }
    } catch (error) {
      this.logger.error(
        `Database error in WorkflowSendMailUseCase: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        error: {
          code: 'DB_ERROR',
          message: 'ไม่สามารถดำเนินการได้' + error.message,
        },
      };
    }
  }

  //เช็คเงื่อนไขผู้รับอีเมลตามประเภท (NEXT_STEP, FIRST_STEP, ALL)
  private async resolveRecipients(
    recipientType: string,
    wfTransactionId: number,
    isCc: boolean,
    connection?: WorkflowSendMailUseCaseCondition,
  ): Promise<UserEntity[]> {
    if (!recipientType || recipientType.trim() === '') {
      return [];
    }

    const type = recipientType.trim().toUpperCase();

    if (type === 'NEXT_STEP') {
      return (await this.resolveNextStepEmails(wfTransactionId, connection)) ?? [];
    } else if (type === 'FIRST_STEP') {
      return (await this.resolveFirstStepEmails(wfTransactionId, isCc)) ?? [];
    } else if (type === 'ALL') {
      return (await this.resolveAllStepsEmails(wfTransactionId)) ?? [];
    }

    return [];
  }

  //ดึง emails สำหรับเงื่อนไข NEXT_STEP
  private async resolveNextStepEmails(
    wfTransactionId: number,
    condition?: WorkflowSendMailUseCaseCondition,
  ): Promise<UserEntity[]> {
    const transaction =
      await this.workflowRepository.getEmailsFromTransaction(wfTransactionId);

    if (!transaction) {
      this.logger.warn(`Transaction not found: ${wfTransactionId}`);
      return [];
    }

    if (!transaction.approveType) {
      return [];
    }

    if (transaction.approveType === 'USER') {
      // approveBy อาจมีหลายค่าคั่นด้วย comma เช่น "1,2,3"
      const userIds = transaction.approveBy
        .split(',')
        .map((id) => parseInt(id.trim(), 10))
        .filter((id) => !isNaN(id));

      if (userIds.length === 0) {
        return [];
      }

      // กรณี approveBy มาจาก wf_transaction ซึ่งถูก filter zone แล้วตอน approve
      // แต่เพื่อความปลอดภัย ถ้ามี connection.zone ให้ filter อีกครั้ง
      let filteredUserIds = userIds;
      if (condition?.zone || condition?.subZone) {
        filteredUserIds = await this.workflowRepository.filterUserIdsByZone(
          userIds,
          condition?.zone,
          condition?.subZone,
        );
      }

      if (filteredUserIds.length === 0) {
        return [];
      }

      return await this.workflowRepository.getEmailsByUserIds(filteredUserIds);
    } else if (transaction.approveType === 'ROLE') {
      const roleIds = this.parseRoleIds(transaction.approveBy);

      if (roleIds.length === 0) {
        return [];
      }

      const userIds = await this.workflowRepository.getUserIdsByRoleIds(
        roleIds,
        condition?.zone,
        condition?.subZone,
      );

      if (userIds.length === 0) {
        return [];
      }

      return await this.workflowRepository.getEmailsByUserIds(userIds);
    }

    return [];
  }

  //ดึง emails สำหรับเงื่อนไข FIRST_STEP
  private async resolveFirstStepEmails(
    wfTransactionId: number,
    isCc: boolean,
  ): Promise<UserEntity[]> {
    const result = await this.workflowRepository.getFirstStepCreatorEmail(
      wfTransactionId,
      isCc,
    );
    return result ? [result] : [];
  }

  //ดึง emails สำหรับเงื่อนไข ALL
  private async resolveAllStepsEmails(wfTransactionId: number): Promise<UserEntity[]> {
    return (await this.workflowRepository.getAllStepCreatorsEmails(wfTransactionId)) ?? [];
  }

  private parseRoleIds(roleIdsStr: string): number[] {
    if (!roleIdsStr || roleIdsStr.trim() === '') {
      return [];
    }

    return roleIdsStr
      .split(',')
      .map((id) => parseInt(id.trim(), 10))
      .filter((id) => !isNaN(id));
  }

  private parseEmails(emailsStr: string): string[] {
    if (!emailsStr || emailsStr.trim() === '') {
      return [];
    }

    return emailsStr
      .split(',')
      .map((email) => email.trim())
      .filter((email) => email !== '' && this.isValidEmail(email));
  }

  private removeDuplicateEmails(emails: string[]): string[] {
    const normalizedEmails = emails
      .filter((email) => email != null && email !== '')
      .map((email) => email.toLowerCase());
    return [...new Set(normalizedEmails)];
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private renderTemplate(
    template: string,
    data: Record<string, string | number | boolean>,
  ): string {
    let result = template;

    Object.keys(data).forEach((key) => {
      const placeholder = `{{${key}}}`;
      const value =
        data[key] !== null && data[key] !== undefined ? String(data[key]) : '';
      result = result.replace(new RegExp(placeholder, 'g'), value);
    });

    return result;
  }
}
