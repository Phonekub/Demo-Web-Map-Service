import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('wf_email_parameter')
export class WfEmailParameterEntity {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'wf_id' })
  wfId: number;

  @Column({ name: 'code', type: 'varchar', length: 100 })
  code: string;

  @Column({ name: 'name', type: 'varchar', length: 2000, nullable: true })
  name: string;

  @Column({ name: 'name_th', type: 'varchar', length: 2000, nullable: true })
  nameTH: string;

  @Column({ name: 'name_en', type: 'varchar', length: 2000, nullable: true })
  nameEN: string;

  @Column({ name: 'name_kh', type: 'varchar', length: 2000, nullable: true })
  nameKH: string;

  @Column({ name: 'name_la', type: 'varchar', length: 2000, nullable: true })
  nameLA: string;

  @Column({ name: 'is_active', type: 'varchar', length: 1 })
  isActive: string;

  @Column({ name: 'create_by', type: 'int' })
  createBy: number;

  @Column({ name: 'create_date', type: 'timestamp' })
  createDate: Date;

  @Column({ name: 'update_by', type: 'int' })
  updateBy: number;

  @Column({ name: 'update_date', type: 'timestamp' })
  updateDate: Date;

  @Column({ name: 'version_no', type: 'varchar', length: 10 })
  versionNo: string;
}