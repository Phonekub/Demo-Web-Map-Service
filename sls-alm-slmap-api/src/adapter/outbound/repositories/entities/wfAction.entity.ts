import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { WfRouteEntity } from './wfRoute.entity';

@Entity('wf_action')
export class WfActionEntity {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'action_code' })
  actionCode: string;

  @Column({ name: 'action_name' })
  actionName: string;

  @Column({ name: 'action_name_th' })
  actionNameTH: string;

  @Column({ name: 'action_name_en' })
  actionNameEN: string;

  @Column({ name: 'action_name_kh' })
  actionNameKH: string;

  @Column({ name: 'action_name_la' })
  actionNameLA: string;

  @Column({ name: 'require_remark' })
  require_remark: string;

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

  @OneToMany(() => WfRouteEntity, (wfRoute) => wfRoute.wfAction)
  wfRoutes: WfRouteEntity[];
}
