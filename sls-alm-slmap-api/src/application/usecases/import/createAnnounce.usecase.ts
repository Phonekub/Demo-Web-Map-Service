import { S3GatewayPort } from '../../ports/s3.gateway';
import { BadRequestException, Inject,Injectable } from '@nestjs/common';
import { AnnounceEntity } from '../../../adapter/outbound/repositories/entities/announce.entity';
import { AnnounceRoleEntity } from '../../../adapter/outbound/repositories/entities/announceRole.entity';
import { AnnounceRepository } from '../../../adapter/outbound/repositories/announce.repository';
// import { AnnounceRoleRepository } from '../../../adapter/outbound/repositories/announceRole.repository';
import { CreateAnnounceDto } from '../../../adapter/inbound/dtos/createAnnounce.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CreateAnnounceUseCase {
  constructor(
    @Inject('AnnounceRepository')
    private readonly announceRepo: AnnounceRepository,
    // @Inject('AnnounceRoleRepository')
    // private readonly announceRoleRepo: AnnounceRoleRepository,
    @Inject('S3GatewayPort')
    private readonly s3Gateway: S3GatewayPort,
    private readonly configService: ConfigService,
  ) {}
  async handlerWithFile(
    body: CreateAnnounceDto,
    file: Express.Multer.File,
  ): Promise<AnnounceEntity> {
    if (!file) throw new BadRequestException('No file uploaded');
    if (file.size === 0) throw new BadRequestException('Uploaded file is empty');
    // prepare S3 path
    const bucket = this.configService.get<string>('S3_BUCKET');
    const key = `announce/${file.originalname}`;
    const destination = `${bucket}/${key}`;
    // log S3 path to be saved in DB
    console.log('[Announce S3 Upload] S3 key:', key);
    // upload to S3
    await this.s3Gateway.upload({
      destination,
      body: file.buffer,
      contentType: file.mimetype,
    });
    // save entity
    const announce = new AnnounceEntity();
    announce.header = body.header;
    announce.detail = body.detail;
    announce.imagePath = key;
    announce.startDate = body.startDate ? new Date(body.startDate) : undefined;
    announce.endDate = body.endDate ? new Date(body.endDate) : undefined;
    announce.isHot = body.isHot ?? 'N';
    announce.isShow = body.isShow ?? 'N';
    announce.createBy = body.createBy;
    announce.createDate = new Date();
    announce.updateBy = body.updateBy;
    announce.updateDate = new Date();
    announce.cmId = body.cmId ?? null;
    announce.contentType = body.contentType ?? null;
    announce.roles = [];
    if (body.roles && Array.isArray(body.roles)) {
      announce.roles = body.roles.map((r) => {
        const role = new AnnounceRoleEntity();
        role.bs_role_id = r.role_id ? Number(r.role_id) : null;
        role.bs_dept_id = r.dept_id ? Number(r.dept_id) : null;
        role.bs_level_id = r.level_id ? Number(r.level_id) : null;
        return role;
      });
    }
    const saved = await this.announceRepo.getRepo().save(announce);
    return saved;
  }

}
