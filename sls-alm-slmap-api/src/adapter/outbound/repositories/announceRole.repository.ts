import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnnounceRoleEntity } from './entities/announceRole.entity';

@Injectable()
export class AnnounceRoleRepository {
  constructor(
    @InjectRepository(AnnounceRoleEntity)
    private readonly announceRoleRepository: Repository<AnnounceRoleEntity>,
  ) {}
  async saveMany(roles: AnnounceRoleEntity[]): Promise<AnnounceRoleEntity[]> {
    return await this.announceRoleRepository.save(roles);
  }
}