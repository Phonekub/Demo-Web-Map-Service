import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { WfRouteEntity } from './wfRoute.entity';

@Entity('wf_status')
export class WfStatusEntity {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'wf_id' })
  wfId: number;

  @Column({ name: 'status_name' })
  statusName: string;

  @Column({ name: 'status_name_th' })
  statusNameTH: string;

  @Column({ name: 'status_name_en' })
  statusNameEN: string;

  @Column({ name: 'status_name_kh' })
  statusNameKH: string;

  @Column({ name: 'status_name_la' })
  statusNameLA: string;

  @Column({ name: 'wf_complete' })
  wfComplete: string;

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

  @OneToMany(() => WfRouteEntity, (wfRoute) => wfRoute.wfStatus)
  wfRoutes: WfRouteEntity[];
}
