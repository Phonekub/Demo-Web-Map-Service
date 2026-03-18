import { Builder } from 'builder-pattern';
import { DepartmentEntity } from '../entities/department.entity';
import { Department } from '../../../../domain/department';

export class DepartmentMapper {
  static toDomain(entity: DepartmentEntity): Department {
    return Builder(Department).deptId(entity.deptId).deptName(entity.deptName).build();
  }
}
