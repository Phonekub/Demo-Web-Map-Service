import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { DepartmentEntity } from './department.entity';
import { LevelEntity } from './level.entity';

@Entity('role')
export class RoleEntity {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'department_id' })
  departmentId: number;

  @Column({ name: 'level_id' })
  levelId: number;

  @Column({ name: 'permission_type', nullable: true })
  permissionType: string;

  @Column({ name: 'created_date', type: 'timestamp', nullable: true })
  createdDate: Date;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @OneToMany(() => UserEntity, (user) => user.role)
  users?: UserEntity[];

  @ManyToOne(() => DepartmentEntity, (department) => department.roles)
  @JoinColumn({ name: 'department_id' })
  department: DepartmentEntity;

  @ManyToOne(() => LevelEntity, (level) => level.roles)
  @JoinColumn({ name: 'level_id' })
  level: LevelEntity;
}
