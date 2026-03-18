import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { DownloadFileRoleEntity } from './downloadFileRole.entity';

@Entity({ name: 'download_file_detail' })
export class DownloadFileDetailEntity {
  @PrimaryGeneratedColumn({ name: 'file_id' })
  file_id: number;

  @Column({ name: 'file_name', type: 'varchar', length: 255 })
  file_name: string;

  @Column({ name: 'file_path', type: 'varchar', length: 255 })
  file_path: string;

  @Column({ name: 'file_type', type: 'varchar', length: 100 })
  file_type: string;

  @Column({ name: 'start_date', type: 'timestamp', nullable: true })
  start_date: Date;

  @Column({ name: 'end_date', type: 'timestamp', nullable: true })
  end_date: Date;

  @Column({ name: 'create_by', type: 'varchar', length: 100, nullable: true })
  create_by: string;

  @Column({ name: 'create_date', type: 'timestamp', nullable: true })
  create_date: Date;

  @Column({ name: 'update_by', type: 'varchar', length: 100, nullable: true })
  update_by: string;

  @Column({ name: 'update_date', type: 'timestamp', nullable: true })
  update_date: Date;
  
  @Column({ name: 'is_deleted', type: 'varchar', length: 1, default: 'N' })
  is_deleted: string;

  @OneToMany(() => DownloadFileRoleEntity, role => role.file, { cascade: true })
  roles: DownloadFileRoleEntity[];
}
