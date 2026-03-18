import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('permission_group')
export class PermissionGroupEntity {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

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

  @OneToMany('PermissionEntity', 'permissionGroup')
  permissions: any[];
}
