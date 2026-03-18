import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DownloadFileDetailEntity } from './entities/downloadFileDetail.entity';

@Injectable()
export class DownloadFileDetailRepository {
  constructor(
    @InjectRepository(DownloadFileDetailEntity)
    private readonly downloadFileDetailRepository: Repository<DownloadFileDetailEntity>,
  ) {}

  public getRepo(): Repository<DownloadFileDetailEntity> {
    return this.downloadFileDetailRepository;
  }

  async findAll(): Promise<DownloadFileDetailEntity[]> {
    return await this.downloadFileDetailRepository.find({ where: { is_deleted: 'N' } });
  }

  async findByRoleId(roleId: number): Promise<DownloadFileDetailEntity[]> {
    return await this.downloadFileDetailRepository
      .createQueryBuilder('file')
      .leftJoinAndSelect('file.roles', 'role')
      .where('file.is_deleted = :isDeleted', { isDeleted: 'N' })
      .andWhere('role.bs_role_id = :roleId', { roleId })
      .getMany();
  }
  
  async findById(id: number): Promise<DownloadFileDetailEntity | null> {
    return await this.downloadFileDetailRepository.findOne({
      where: { file_id: id, is_deleted: 'N' },
      relations: ['roles'],
    });
  }
}
