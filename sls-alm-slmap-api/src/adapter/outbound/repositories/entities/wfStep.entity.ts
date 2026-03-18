import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { WfRouteEntity } from './wfRoute.entity';

@Entity('wf_step')
export class WfStepEntity {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'wf_id' })
  wfId: number;

  @Column({ name: 'wf_step_name' })
  wfStepName: string;

  @Column({ name: 'wf_step_name_th' })
  wfStepNameTH: string;

  @Column({ name: 'wf_step_name_en' })
  wfStepNameEN: string;

  @Column({ name: 'wf_step_name_kh' })
  wfStepNameKH: string;

  @Column({ name: 'wf_step_name_la' })
  wfStepNameLA: string;

  @Column({ name: 'step_owner_type' })
  stepOwnerType: string;

  @Column({ name: 'step_owner_role' })
  stepOwnerRole: string;

  @Column({ name: 'step_owner_user', nullable: true })
  stepOwnerUser: string;

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

  @OneToMany(() => WfRouteEntity, (wfRoute) => wfRoute.wfStep)
  wfRoutes: WfRouteEntity[];
}
