// import { Injectable } from '@nestjs/common';
// import { ApproveRepositoryPort } from '../../../application/ports/approve.repository';
// import { In, Repository } from 'typeorm';
// import { RequestApproveEntity } from './entities/requestApprove.entity';

// @Injectable()
// export default class ApproveRepositoryMysql implements ApproveRepositoryPort {
//   constructor(
//     @InjectRepository(RequestApproveEntity)
//     private readonly approveModel: Repository<RequestApproveEntity>,
//   ) {}

//   async findById(id: number): Promise<Approve> {
//     const result = await this.approveModel.findOne({ where: { id: id } });
//     return !_.isNull(result) ? ApproveMapper.toDomain(result) : undefined;
//   }
// }
