import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  GetSignedDownloadUrlRequest,
  GetSignedDownloadUrlResult,
  S3GatewayPort,
  UploadToS3Request,
  UploadToS3Result,
} from '../../../application/ports/s3.gateway';

type ParsedDestination = { bucket: string; key: string };

@Injectable()
export class S3Gateway implements S3GatewayPort {
  private readonly logger = new Logger(S3Gateway.name);
  private readonly s3Client: S3Client;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION');
    const env = this.configService.get<string>('NODE_ENV');
    const profile = this.configService.get<string>('AWS_PROFILE');

    this.s3Client = new S3Client({ region, ...(env === 'local' && { profile }) });
  }

  async upload(request: UploadToS3Request): Promise<UploadToS3Result> {
    const { destination, body, contentType, cacheControl, metadata } = request;

    const { bucket, key } = this.parseDestination(destination);

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: cacheControl,
      Metadata: metadata,
    });

    const res = await this.s3Client.send(command);

    return {
      bucket,
      key,
      eTag: res.ETag,
      contentType,
    };
  }

  async getSignedDownloadUrl(
    request: GetSignedDownloadUrlRequest,
  ): Promise<GetSignedDownloadUrlResult> {
    const { destination, durationSeconds, filename } = request;

    const { bucket, key } = this.parseDestination(destination);
    const expiresInSeconds = this.normalizeExpiresInSeconds(durationSeconds);

    const responseContentDisposition = filename
      ? this.buildContentDisposition(filename)
      : undefined;

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ...(responseContentDisposition
        ? { ResponseContentDisposition: responseContentDisposition }
        : {}),
    });

    const url = await getSignedUrl(this.s3Client, command, {
      expiresIn: expiresInSeconds,
    });

    this.logger.log(
      `Generated presigned download URL for s3://${bucket}/${key} (expiresIn=${expiresInSeconds}s)`,
    );

    return { bucket, key, url, expiresInSeconds };
  }

  private parseDestination(destination: string): ParsedDestination {
    const raw = (destination ?? '').trim();
    if (!raw) {
      throw new Error('S3 destination is required (format: "bucket/key")');
    }

    // Normalize leading slash
    const normalized = raw.replace(/^\/+/, '');
    const firstSlash = normalized.indexOf('/');
    if (firstSlash <= 0 || firstSlash === normalized.length - 1) {
      throw new Error(
        `Invalid S3 destination "${destination}". Expected format: "bucket/key"`,
      );
    }

    const bucket = normalized.slice(0, firstSlash).trim();
    const key = normalized.slice(firstSlash + 1);

    if (!bucket || !key) {
      throw new Error(
        `Invalid S3 destination "${destination}". Expected format: "bucket/key"`,
      );
    }

    // Basic hardening against path traversal-ish keys; S3 keys are flat strings,
    // but blocking ".." helps avoid ambiguous destinations.
    if (key.split('/').some((segment) => segment === '..')) {
      throw new Error(
        `Invalid S3 destination "${destination}". Key must not contain ".." segments`,
      );
    }

    return { bucket, key };
  }

  private normalizeExpiresInSeconds(durationSeconds: number): number {
    const value = Number(durationSeconds);

    if (!Number.isFinite(value)) {
      throw new Error('durationSeconds must be a finite number');
    }

    const intValue = Math.floor(value);
    if (intValue <= 0) {
      throw new Error('durationSeconds must be greater than 0');
    }

    // AWS presigned URL max is commonly 7 days (604800 seconds) for SigV4.
    // Clamp to avoid unexpected runtime errors.
    const maxSeconds = 60 * 60 * 24 * 7;
    return Math.min(intValue, maxSeconds);
  }

  private buildContentDisposition(filename: string): string {
    const safeAscii = filename.replace(/[/\\"]/g, '_').replace(/[^\x20-\x7E]/g, '_');

    const utf8 = encodeURIComponent(filename);

    return `attachment; filename="${safeAscii}"; filename*=UTF-8''${utf8}`;
  }
}
