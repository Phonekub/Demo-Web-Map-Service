export class UserWithZone {
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  isExternal: string;
  email: string;
  tel: string;
  isActive: string;
  createBy: string;
  createDate: Date;
  updateBy: string;
  updateDate: Date;
  zones: string;

  isUserActive(): boolean {
    return this.isActive === '1' || this.isActive === 'Y';
  }
}
