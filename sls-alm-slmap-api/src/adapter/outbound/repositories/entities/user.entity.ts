import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { RoleEntity } from './role.entity';
import { UserRoleEntity } from './userrole.entity';
import { UserZoneEntity } from './userzone.entity';
import { WfStepHistoryEntity } from './wfStepHistory.entity';

@Entity({
  name: 'AUTH_USER',
})
export class UserEntity {
  @PrimaryGeneratedColumn({
    name: 'ID',
  })
  id: number;

  @Column({
    name: 'USERNAME',
    length: 100,
    nullable: false,
  })
  username: string;

  @Column({
    name: 'FIRST_NAME',
    length: 100,
    nullable: true,
  })
  firstName: string;

  @Column({
    name: 'LAST_NAME',
    length: 100,
    nullable: true,
  })
  lastName: string;

  @Column({
    name: 'EMPLOYEE_ID',
    length: 10,
    nullable: true,
  })
  employeeId: string;

  @Column({
    name: 'IS_EXTERNAL',
    length: 1,
    nullable: true,
  })
  isExternal: string;

  @Column({
    name: 'EMAIL',
    length: 100,
    nullable: true,
  })
  email: string;

  @Column({
    name: 'TEL',
    length: 1000,
    nullable: true,
  })
  tel: string;

  @Column({
    name: 'role_id',
    nullable: true,
  })
  roleId: number;

  @Column({
    name: 'IS_ACTIVE',
    length: 1,
    nullable: true,
  })
  isActive: string;

  @Column({
    name: 'CREATE_BY',
    length: 100,
    nullable: true,
  })
  createBy: string;

  @Column({
    name: 'CREATE_DATE',
    type: 'timestamp',
    nullable: true,
  })
  createDate: Date;

  @Column({
    name: 'UPDATE_BY',
    length: 100,
    nullable: true,
  })
  updateBy: string;

  @Column({
    name: 'UPDATE_DATE',
    type: 'timestamp',
    nullable: true,
  })
  updateDate: Date;

  @ManyToOne(() => RoleEntity, (role) => role.users)
  @JoinColumn({ name: 'role_id' })
  role: RoleEntity;

  @OneToOne(() => UserRoleEntity, (userRole) => userRole.user)
  @JoinColumn({ name: 'ID', referencedColumnName: 'userId' })
  userRoles: UserRoleEntity;

  @OneToMany(() => UserZoneEntity, (userZone) => userZone.user)
  userZones: UserZoneEntity[];

  @OneToMany(() => WfStepHistoryEntity, (wfStepHistory) => wfStepHistory.user)
  wfStepHistories: WfStepHistoryEntity[];
}
