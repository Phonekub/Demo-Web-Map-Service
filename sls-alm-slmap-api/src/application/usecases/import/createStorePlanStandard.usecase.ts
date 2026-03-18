import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { StorePlanStandardRepository } from '../../../adapter/outbound/repositories/storePlanStandard.repository';
import { StorePlanStandardEntity } from '../../../adapter/outbound/repositories/entities/storePlanStandard.entity';
import { CreateStorePlanStandardDto } from '../../../adapter/inbound/dtos/createStorePlanStandard.dto';
import { S3GatewayPort } from '../../ports/s3.gateway';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CreateStorePlanStandardUseCase {
  constructor(
    @Inject('StorePlanStandardRepository')
    private readonly storePlanStandardRepository: StorePlanStandardRepository,
    @Inject('S3GatewayPort')
    private readonly s3Gateway: S3GatewayPort,
    private readonly configService: ConfigService,
  ) {}

  async handlerWithFile(
    body: CreateStorePlanStandardDto,
    file: Express.Multer.File,
  ): Promise<StorePlanStandardEntity> {
    if (!file) throw new BadRequestException('No file uploaded');
    if (file.size === 0) throw new BadRequestException('Uploaded file is empty');
    // prepare path S3
    const bucket = this.configService.get<string>('S3_BUCKET');
    const key = `basic-form/${file.originalname}`;
    const destination = `${bucket}/${key}`;

    // upload to S3
    await this.s3Gateway.upload({
      destination,
      body: file.buffer,
      contentType: file.mimetype,
      metadata: {
        filename: file.originalname,
        uploadedBy: body.upload_by || '',
      },
    });

    // save path S3 to DB
    const data = new StorePlanStandardEntity();
    data.filename = file.originalname;
    data.version = body.version;
    data.upload_date = body.upload_date ? new Date(body.upload_date) : new Date();
    data.upload_by = body.upload_by || '';
    data.filepath = key; 
    data.can_load = body.can_load || 'N';
    return await this.storePlanStandardRepository.create(data);
  }
}
