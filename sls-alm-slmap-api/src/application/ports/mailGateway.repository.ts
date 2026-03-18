export interface mailGatewayPort {
  sendEmail(
    mailTo: Map<string, string>,
    mailCc: string[],
    mailSubject: string,
    mailBody: string,
  ): Promise<void>;
}
