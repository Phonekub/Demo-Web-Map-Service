export class UserRole {
  userId: string;
  username: string;
  roleId: number;
  deptId: string;
  levelId: string;
  orgId: string;
  isActive: string;
  createBy: string;
  createDate: Date;
  updateBy: string;
  updateDate: Date;
  permissionType: string;

  isUserActive(): boolean {
    return this.isActive === '1' || this.isActive === 'Y';
  }
}
