import { Injectable, Logger } from '@nestjs/common';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { mailGatewayPort } from '../../../application/ports/mailGateway.repository';

@Injectable()
export class MailGateway implements mailGatewayPort {
  private readonly logger = new Logger(MailGateway.name);
  private readonly sesClient: SESClient;

  constructor() {
    this.sesClient = new SESClient({
      region: process.env.AWS_SES_REGION || 'ap-southeast-1',
    });
  }

  async sendEmail(
    mailTo: Map<string, string>,
    mailCc: string[],
    mailSubject: string,
    mailBody: string,
  ): Promise<void> {
    const params = {
      Source: process.env.AWS_SES_MAIL_FROM || 'storelocation@gosoft.co.th',
      Destination: {
        ToAddresses: Array.from(mailTo.keys()),
        CcAddresses: mailCc.length > 0 ? mailCc : undefined,
      },
      Message: {
        Subject: {
          Data: mailSubject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: mailBody,
            Charset: 'UTF-8',
          },
        },
      },
      ReplyToAddresses: [],
    };
    try {
      const command = new SendEmailCommand(params);
      const response = await this.sesClient.send(command);
      this.logger.log(`✅ Email sent successfully: ${response.MessageId}`);
    } catch (error) {
      this.logger.error(`❌ Error sending email: ${error.message}`, error.stack);
      throw error;
    }
  }
}
