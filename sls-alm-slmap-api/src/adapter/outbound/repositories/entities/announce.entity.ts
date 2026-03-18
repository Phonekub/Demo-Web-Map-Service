import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { AnnounceRoleEntity } from './announceRole.entity';

@Entity({ name: 'announce_detail' })
export class AnnounceEntity {
  @PrimaryGeneratedColumn({ name: 'announce_id' })
  announceId: number;
  
  @Column({ name: 'is_deleted', type: 'varchar', length: 1, default: 'N' })
  is_deleted: string;

  @Column({ name: 'header', type: 'varchar', length: 255 })
  header: string;

  @Column({ name: 'image_path', type: 'varchar', length: 255, nullable: true })
  imagePath: string;

  @Column({ name: 'start_date', type: 'timestamp', nullable: true })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamp', nullable: true })
  endDate: Date;

  @Column({ name: 'is_hot', type: 'varchar', length: 1 })
  isHot: string;

  @Column({ name: 'is_show', type: 'varchar', length: 1 })
  isShow: string;

  @Column({ name: 'create_by', type: 'varchar', length: 50 })
  createBy: string;

  @Column({ name: 'create_date', type: 'timestamp', nullable: true })
  createDate: Date;

  @Column({ name: 'update_by', type: 'varchar', length: 50, nullable: true })
  updateBy: string;

  @Column({ name: 'update_date', type: 'timestamp', nullable: true })
  updateDate: Date;

  @Column({ name: 'detail', type: 'text', nullable: true })
  detail: string;

  @Column({ name: 'cm_id', type: 'varchar', length: 50, nullable: true })
  cmId: string;

  @Column({ name: 'content_type', type: 'varchar', length: 50, nullable: true })
  contentType: string;

  @OneToMany(() => AnnounceRoleEntity, (role) => role.announce, { cascade: true })
  roles: AnnounceRoleEntity[];
}
