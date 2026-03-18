import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GetStorePlanStandardUseCase } from './getStorePlanStandard.usecase';
import { GetKnowledgeUseCase } from './getKnowledge.usecase';
import { S3GatewayPort } from '../../ports/s3.gateway';

@Injectable()
export class DownloadFileUseCase {
  constructor(
    private readonly getStorePlanStandardUseCase: GetStorePlanStandardUseCase,
    private readonly getKnowledgeUseCase: GetKnowledgeUseCase,
    @Inject('S3GatewayPort')
    private readonly s3Gateway: S3GatewayPort,
    private readonly configService: ConfigService,
  ) {}

  async execute(type: string, id: number) {
    const map: Record<string, () => Promise<any>> = {
      'store-plan-standard': async () =>
        await this.getStorePlanStandardUseCase.findById(id),
      knowledge: async () => await this.getKnowledgeUseCase.findById(id),
    };
    const entity = await map[type]?.();
    if (!entity) throw new NotFoundException('File not found');

    // mapping property name type
    const filePath = type === 'store-plan-standard' ? entity.filepath : entity.file_path;
    const fileName = type === 'store-plan-standard' ? entity.filename : entity.file_name;
    if (!filePath) throw new NotFoundException('File not found');
    const bucket = this.configService.get<string>('S3_BUCKET');
    const signedUrlResult = await this.s3Gateway.getSignedDownloadUrl({
      destination: `${bucket}/${filePath}`,
      durationSeconds: 180 * 10,
      filename: fileName || undefined,
    });
    return { url: signedUrlResult.url };
  }
}
