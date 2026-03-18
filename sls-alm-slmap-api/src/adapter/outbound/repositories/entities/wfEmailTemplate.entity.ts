import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('wf_email_template')
export class WfEmailTemplateEntity {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'mail_template_name' })
  mailTemplateName: string;

  @Column({ name: 'mail_template_name_th' })
  mailTemplateNameTH: string;

  @Column({ name: 'mail_template_name_en' })
  mailTemplateNameEN: string;

  @Column({ name: 'mail_template_name_kh' })
  mailTemplateNameKH: string;

  @Column({ name: 'mail_template_name_la' })
  mailTemplateNameLA: string;

  @Column({ name: 'mail_subject' })
  mailSubject: string;

  @Column({ name: 'mail_content' })
  mailContent: string;

  @Column({ name: 'is_active' })
  isActive: string;

  @Column({ name: 'create_by' })
  createBy: number;

  @Column({ name: 'create_date', type: 'timestamp' })
  createDate: Date;

  @Column({ name: 'update_by' })
  updateBy: number;

  @Column({ name: 'update_date', type: 'timestamp' })
  updateDate: Date;

  @Column({ name: 'version_no' })
  versionNo: string;

  @Column({ name: 'wf_id' })
  wfId: number;
}
