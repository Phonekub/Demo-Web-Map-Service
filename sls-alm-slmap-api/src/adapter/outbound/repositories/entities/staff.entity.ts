import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { RoleStaffEntity } from './roleStaff.entity';

@Entity({
  name: 'staff',
})
export class StaffEntity {
  @PrimaryGeneratedColumn({
    name: 'staff_id',
  })
  id: number;

  @Column({
    name: 'firstname',
  })
  firstName: string;

  @Column({
    name: 'lastname',
  })
  lastName: string;

  @Column()
  username: string;

  @Column()
  password: string;

  @Column({
    name: 'staff_num',
  })
  number: string;

  @Column()
  source: string;

  @Column()
  role: string;

  @Column()
  session: string;

  @Column({
    name: 'session_refresh',
  })
  sessionRefresh: string;

  @Column({
    name: 'team_id',
  })
  teamId: number;

  @Column({
    name: 'im_supplier_id',
  })
  supplierId: number;

  @Column({
    name: 'is_clock_in',
  })
  isClockIn: number;

  @OneToMany(() => RoleStaffEntity, (roleStaff) => roleStaff.staff)
  roleStaff: RoleStaffEntity[];
}
