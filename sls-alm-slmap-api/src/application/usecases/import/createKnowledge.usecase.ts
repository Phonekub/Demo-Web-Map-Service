import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { DownloadFileDetailRepository } from '../../../adapter/outbound/repositories/downloadFileDetail.repository';
import { DownloadFileDetailEntity } from '../../../adapter/outbound/repositories/entities/downloadFileDetail.entity';
import { CreateKnowledgeDto } from '../../../adapter/inbound/dtos/createKnowledge.dto';
import { DownloadFileRoleEntity } from '../../../adapter/outbound/repositories/entities/downloadFileRole.entity';
import { S3GatewayPort } from '../../ports/s3.gateway';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CreateKnowledgeUseCase {
  constructor(
    @Inject('DownloadFileDetailRepository')
    private readonly downloadFileDetailRepository: DownloadFileDetailRepository,
    private readonly configService: ConfigService,
    @Inject('S3GatewayPort')
    private readonly s3Gateway: S3GatewayPort,
  ) {}

  async handlerWithFile(
    body: CreateKnowledgeDto,
    file: Express.Multer.File,
  ): Promise<DownloadFileDetailEntity> {
    if (!file) throw new BadRequestException('No file uploaded');
    if (file.size === 0) throw new BadRequestException('Uploaded file is empty');
    // prepare S3 path
    const bucket = this.configService.get<string>('S3_BUCKET');
    const key = `knowledge/${file.originalname}`;
    const destination = `${bucket}/${key}`;

    // upload to S3
    await this.s3Gateway.upload({
      destination,
      body: file.buffer,
      contentType: file.mimetype,
    });

    // create entity and save to DB
    const data = new DownloadFileDetailEntity();
    data.file_name = file.originalname;
    data.file_path = key;
    data.file_type = file.mimetype;
    data.start_date = body.startDate ? new Date(body.startDate) : null;
    data.end_date = body.endDate ? new Date(body.endDate) : null;
    data.create_by = body.createBy;
    data.create_date = new Date();
    data.update_by = body.updateBy;
    data.update_date = new Date();
    // map fileRoles
    if (body.fileRoles && Array.isArray(body.fileRoles)) {
      data.roles = body.fileRoles.map((role) => {
        const r = new DownloadFileRoleEntity();
        r.bs_dept_id = role.department ? Number(role.department) : null;
        r.bs_level_id = role.level ? Number(role.level) : null;
        r.bs_role_id = role.role ? Number(role.role) : null;
        return r;
      });
    }
    return await this.downloadFileDetailRepository.getRepo().save(data);
  }
}
