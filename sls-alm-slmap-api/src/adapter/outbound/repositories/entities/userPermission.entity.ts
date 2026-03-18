import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ schema: 'allmap', name: 'user_permission' })
export class UserPermissionEntity {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'permission_code' })
  permissionCode: string;

  @Column({ name: 'created_date', type: 'timestamp', nullable: true })
  createdDate: Date;

  @Column({ name: 'created_by', nullable: true })
  createdBy: number;

  @Column({ name: 'updated_date', type: 'timestamp', nullable: true })
  updatedDate: Date;
}
