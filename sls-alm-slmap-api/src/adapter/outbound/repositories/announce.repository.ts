import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnnounceEntity } from './entities/announce.entity';

@Injectable()
export class AnnounceRepository {
  constructor(
    @InjectRepository(AnnounceEntity)
    private readonly announceRepository: Repository<AnnounceEntity>,
  ) {}

  public getRepo(): Repository<AnnounceEntity> {
    return this.announceRepository;
  }

  async findAll(): Promise<AnnounceEntity[]> {
    return await this.announceRepository.find();
  }
}
