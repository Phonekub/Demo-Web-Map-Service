import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { WfActionEntity } from './wfAction.entity';
import { WfStatusEntity } from './wfStatus.entity';
import { WfStepEntity } from './wfStep.entity';
import { WfParameterEntity } from './wfParameter.entity';
import { WfEmailDetailEntity } from './wfEmailDetail.entity';

@Entity('wf_route')
export class WfRouteEntity {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'wf_id' })
  wfId: number;

  @Column({ name: 'wf_step_id' })
  wfStepId: number;

  @Column({ name: 'wf_action_id' })
  wfActionId: number;

  @Column({ name: 'wf_to_step_id' })
  wfToStepId: number;

  @Column({ name: 'wf_to_status_id' })
  wfToStatusId: number;

  @Column({ name: 'wf_email_detail_id' })
  wfEmailDetailId: number;

  @Column({ name: 'wf_parameter_id', nullable: true })
  wfParameterId: number;

  @Column({ name: 'parameter_value', nullable: true })
  parameterValue: string;

  @Column({ name: 'is_active' })
  isActive: string;

  @Column({ name: 'is_owner', nullable: true })
  isOwner: string;

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

  @ManyToOne(() => WfActionEntity, (wfAction) => wfAction.wfRoutes)
  @JoinColumn({ name: 'wf_action_id' })
  wfAction: WfActionEntity;

  @ManyToOne(() => WfStatusEntity, (wfStatus) => wfStatus.wfRoutes)
  @JoinColumn({ name: 'wf_to_status_id' })
  wfStatus: WfStatusEntity;

  @ManyToOne(() => WfStepEntity, (wfStep) => wfStep.wfRoutes)
  @JoinColumn({ name: 'wf_to_step_id' })
  wfStep: WfStepEntity;

  @ManyToOne(() => WfParameterEntity)
  @JoinColumn({ name: 'wf_parameter_id' })
  wfParameter?: WfParameterEntity;

  @ManyToOne(() => WfEmailDetailEntity, (wfEmailDetail) => wfEmailDetail.wfRoute)
  @JoinColumn({ name: 'wf_email_detail_id' })
  wfEmailDetail: WfEmailDetailEntity;
}
