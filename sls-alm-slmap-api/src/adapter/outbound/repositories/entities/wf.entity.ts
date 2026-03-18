import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('wf')
export class WfEntity {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'wf_name' })
  wfName: string;

  @Column({ name: 'wf_name_th' })
  wfNameTH: string;

  @Column({ name: 'wf_name_en' })
  wfNameEN: string;

  @Column({ name: 'wf_name_kh' })
  wfNameKH: string;

  @Column({ name: 'wf_name_la' })
  wfNameLA: string;

  @Column({ name: 'first_step_id' })
  firstStepId: number;

  @Column({ name: 'first_status_id' })
  firstStatusId: number;

  @Column({ name: 'first_action_id' })
  firstActionId: number;

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
}
