export class MailTemplateResponseRaw {
  templateId: number;
  mailTemplateName: string;
  mailSubject: string;
  mailContent: string;
  mailTo: string | null;
  mailCC: string | null;
  isActive: string;
  wfId: number;
  mailType: 'TO' | 'CC';
  userId: number | null;
  fullName: string | null;
  email: string | null;
  zones: string | null;
}

export class MailTemplateUser {
  userId: number;
  fullName: string;
  email: string;
  zones: string;
}

export class MailTemplateResponse {
  templateId: number;
  mailTemplateName: string;
  mailSubject: string;
  mailContent: string;
  mailTo: string | null;
  mailCC: string | null;
  isActive: string;
  wfId: number;

  otherMailTo: MailTemplateUser[];
  otherMailCC: MailTemplateUser[];
}

export class SaveMailTemplateRequest {
  templateId: number;
  mailTemplateName: string;
  mailSubject: string;
  mailContent: string;
  mailTo: string;
  mailCC: string;

  otherMailTo: MailTemplateUser[];
  otherMailCC: MailTemplateUser[];
}

export class SaveMailTemplateResponse {
  success: boolean;
  error?: {
    code: string;
    message?: string;
  };
}
