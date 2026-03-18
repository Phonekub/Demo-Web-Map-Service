import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UserRoleEntity } from './userrole.entity';
import { RoleEntity } from './role.entity';

@Entity('department')
export class DepartmentEntity {
  @PrimaryGeneratedColumn({ name: 'dept_id' })
  deptId: number;

  @Column({ name: 'dept_name' })
  deptName: string;

  @Column({ name: 'is_active' })
  isActive: string;

  @OneToMany(() => UserRoleEntity, (userRole) => userRole.department)
  userRoles?: UserRoleEntity[];

  @OneToMany(() => RoleEntity, (role) => role.department)
  roles?: RoleEntity[];
}
