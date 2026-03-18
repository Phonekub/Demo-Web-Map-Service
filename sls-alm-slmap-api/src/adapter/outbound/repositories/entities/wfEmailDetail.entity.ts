import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { WfRouteEntity } from './wfRoute.entity';

@Entity('wf_email_detail')
export class WfEmailDetailEntity {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'wf_email_template_id' })
  wfEmailTemplateId: number;

  @Column({ name: 'mail_to' })
  mailTo: string;

  @Column({ name: 'mail_cc' })
  mailCC: string;

  @Column({ name: 'other_mail_to' })
  otherMailTo: string;

  @Column({ name: 'other_mail_cc' })
  otherMailCC: string;

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

  @OneToMany(() => WfRouteEntity, (wfRoute) => wfRoute.wfEmailDetail)
  wfRoute: WfRouteEntity[];
}
