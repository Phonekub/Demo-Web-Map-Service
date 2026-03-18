export class User {
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

  isUserActive(): boolean {
    return this.isActive === '1' || this.isActive === 'Y';
  }
}
