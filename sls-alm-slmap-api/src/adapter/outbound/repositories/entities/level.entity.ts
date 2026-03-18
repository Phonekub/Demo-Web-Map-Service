import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UserRoleEntity } from './userrole.entity';
import { RoleEntity } from './role.entity';

@Entity('level')
export class LevelEntity {
  @PrimaryGeneratedColumn({ name: 'level_id' })
  levelId: number;

  @Column({ name: 'level_name' })
  levelName: string;

  @Column({ name: 'is_active' })
  isActive: string;

  @OneToMany(() => UserRoleEntity, (userRole) => userRole.level)
  userRoles?: UserRoleEntity[];

  @OneToMany(() => RoleEntity, (role) => role.level)
  roles?: RoleEntity[];
}
