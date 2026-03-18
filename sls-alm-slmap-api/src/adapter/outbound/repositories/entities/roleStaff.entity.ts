import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { StaffEntity } from './staff.entity';

@Entity({
  name: 'role_staff',
})
export class RoleStaffEntity {
  @PrimaryGeneratedColumn({
    name: 'role_staff_id',
  })
  id: number;

  @Column({
    name: 'role_id',
  })
  roleId: number;

  @Column({
    name: 'staff_id',
  })
  staffId: number;

  @Column({
    name: 'role_code',
  })
  roleCode: string;

  @Column({
    name: 'customer_staff_id',
  })
  customerStaffId: number;

  @ManyToOne(() => StaffEntity, (staff) => staff.roleStaff)
  @JoinColumn({
    name: 'staff_id',
  })
  staff: StaffEntity;
}
