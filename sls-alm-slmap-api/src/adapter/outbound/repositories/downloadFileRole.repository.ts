import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DownloadFileRoleEntity } from './entities/downloadFileRole.entity';

@Injectable()
export class DownloadFileRoleRepository {
  constructor(
    @InjectRepository(DownloadFileRoleEntity)
    private readonly repo: Repository<DownloadFileRoleEntity>,
  ) {}

  async saveMany(roles: DownloadFileRoleEntity[]): Promise<DownloadFileRoleEntity[]> {
    return await this.repo.save(roles);
  }
}
