import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { DownloadFileDetailEntity } from './downloadFileDetail.entity';

@Entity({ name: 'download_file_role' })
export class DownloadFileRoleEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => DownloadFileDetailEntity, detail => detail.roles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'file_id' })
  file: DownloadFileDetailEntity;

  @Column({ name: 'bs_role_id', type: 'int', nullable: true })
  bs_role_id: number;

  @Column({ name: 'bs_dept_id', type: 'int', nullable: true })
  bs_dept_id: number;

  @Column({ name: 'bs_level_id', type: 'int', nullable: true })
  bs_level_id: number;
}
