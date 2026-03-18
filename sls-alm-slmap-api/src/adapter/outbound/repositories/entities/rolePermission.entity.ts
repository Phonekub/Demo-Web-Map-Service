import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('role_default_permission')
export class RolePermissionEntity {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'role_id' })
  roleId: number;

  @Column({ name: 'permission_id' })
  permissionId: number;
}
