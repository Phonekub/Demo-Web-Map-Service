import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { DepartmentEntity } from './department.entity';
import { LevelEntity } from './level.entity';

@Entity({
  name: 'user_role',
})
export class UserRoleEntity {
  @PrimaryGeneratedColumn({
    name: 'user_id',
  })
  userId: string;

  @Column({
    name: 'dept_id',
    nullable: true,
  })
  deptId: number;

  @Column({
    name: 'level_id',
    nullable: true,
  })
  levelId: number;

  @Column({
    name: 'org_id',
    length: 10,
    nullable: true,
  })
  orgId: string;

  @Column({
    name: 'is_active',
    length: 1,
    nullable: true,
  })
  isActive: string;

  @Column({
    name: 'create_by',
    length: 100,
    nullable: true,
  })
  createBy: string;

  @Column({
    name: 'create_date',
    type: 'timestamp',
    nullable: true,
  })
  createDate: Date;

  @Column({
    name: 'update_by',
    length: 100,
    nullable: true,
  })
  updateBy: string;

  @Column({
    name: 'update_date',
    type: 'timestamp',
    nullable: true,
  })
  updateDate: Date;

  @OneToOne(() => UserEntity, (user) => user.userRoles)
  user: UserEntity;

  @ManyToOne(() => DepartmentEntity, (department) => department.userRoles)
  @JoinColumn({ name: 'dept_id' })
  department: DepartmentEntity;

  @ManyToOne(() => LevelEntity, (level) => level.userRoles)
  @JoinColumn({ name: 'level_id' })
  level: LevelEntity;
}
