import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

@Entity('wf_status')
export class WorkflowStatusEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'wf_id', type: 'int' })
  wfId: number;

  @Column({ name: 'status_name', type: 'varchar', length: 255 })
  statusName: string;

  @Column({ name: 'status_name_th', type: 'varchar', length: 255 })
  statusNameTh: string;

  @Column({ name: 'status_name_en', type: 'varchar', length: 255 })
  statusNameEn: string;

  @Column({ name: 'status_name_kh', type: 'varchar', length: 255 })
  statusNameKh: string;

  @Column({ name: 'status_name_la', type: 'varchar', length: 255 })
  statusNameLa: string;

  @Column({ name: 'wf_complete', type: 'boolean', default: false })
  wfComplete: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'create_by', type: 'varchar', length: 100 })
  createBy: string;

  @CreateDateColumn({ name: 'create_date' })
  createDate: Date;

  @Column({ name: 'update_by', type: 'varchar', length: 100, nullable: true })
  updateBy: string;

  @UpdateDateColumn({ name: 'update_date' })
  updateDate: Date;

  @VersionColumn({ name: 'version_no' })
  versionNo: number;
}
