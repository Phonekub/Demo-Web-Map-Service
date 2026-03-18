import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PermissionGroupEntity } from './permissionGroup.entity';

@Entity('permission')
export class PermissionEntity {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'group_id' })
  groupId: number;

  @Column({ name: 'code', length: 200, nullable: true })
  code: string;

  @Column({ name: 'name', length: 1000, nullable: true })
  name: string;

  @Column({ name: 'name_th', length: 1000, nullable: true })
  nameTh: string;

  @Column({ name: 'name_en', length: 1000, nullable: true })
  nameEn: string;

  @Column({ name: 'name_kh', length: 1000, nullable: true })
  nameKh: string;

  @Column({ name: 'name_la', length: 1000, nullable: true })
  nameLa: string;

  @Column({ name: 'parent_id', nullable: true })
  parentId: number;

  @Column({ name: 'is_active', length: 1, default: 'Y' })
  isActive: string;

  @Column({ name: 'create_by', nullable: true })
  createBy: number;

  @CreateDateColumn({ name: 'create_date', type: 'timestamptz' })
  createDate: Date;

  @Column({ name: 'update_by', nullable: true })
  updateBy: number;

  @UpdateDateColumn({ name: 'update_date', type: 'timestamptz' })
  updateDate: Date;

  @ManyToOne(() => PermissionGroupEntity, (group) => group.permissions)
  @JoinColumn({ name: 'group_id' })
  permissionGroup: PermissionGroupEntity;
}
