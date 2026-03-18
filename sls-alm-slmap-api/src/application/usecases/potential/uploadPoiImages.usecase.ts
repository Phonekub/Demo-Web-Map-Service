import {
  BadRequestException,
  InternalServerErrorException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { PoiRepositoryPort } from '../../ports/poi.repository';
import { S3GatewayPort } from '../../ports/s3.gateway';
import { extname } from 'path';
import { ConfigService } from '@nestjs/config';

export interface uploadImageResult {
  status: 'success' | 'error';
  message?: string;
  error?: any;
}

@Injectable()
export class UploadPoiImagesUsecase {
  constructor(
    @Inject('PoiRepository')
    private readonly poiRepository: PoiRepositoryPort,
    @Inject('S3GatewayPort')
    private readonly s3Gateway: S3GatewayPort,
    private readonly configService: ConfigService,
  ) {}

  async handler(
    poiId: number,
    files: Express.Multer.File[],
    userId: number,
  ): Promise<uploadImageResult> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    try {
      // Upload to S3
      const uploadedFileNames: string[] = [];

      for (const file of files) {
        const fileName = `${crypto.randomUUID()}${extname(file.originalname)}`;

        const bucketPath = `${this.configService.get('S3_BUCKET')}${this.configService.get('BUCKET_PATH_POI_IMAGE')}`;
        const destination = `${bucketPath}/${fileName}`;

        await this.s3Gateway.upload({
          destination,
          body: file.buffer,
          contentType: file.mimetype,
        });

        uploadedFileNames.push(fileName);
      }

      await this.poiRepository.saveImages(poiId, uploadedFileNames, userId);

      //Mock S3 upload
      // const fileNames = files.map((file) => file.originalname);
      // await this.poiRepository.saveImages(poiId, fileNames, userId);

      return {
        status: 'success',
        message: 'Image uploaded successfully',
      };
    } catch (error) {
      console.log('UploadPoiImagesUsecase error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(error.message);
    }
  }
}
