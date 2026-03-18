
export type S3Destination = string; // "bucket/key"

export interface UploadToS3Request {
  destination: S3Destination;
  body: Buffer;

  /**
   * Optional HTTP Content-Type to store with the object (recommended).
   * Example: "image/png"
   */
  contentType?: string;

  /**
   * Optional metadata stored alongside the object.
   * Values must be strings for S3 user-defined metadata.
   */
  metadata?: Record<string, string>;

  /**
   * Optional cache control header (e.g. "max-age=31536000, immutable")
   */
  cacheControl?: string;
}

export interface UploadToS3Result {
  bucket: string;
  key: string;

  /**
   * ETag returned by the provider (S3 typically returns a quoted string).
   * Not guaranteed to be present in all cases.
   */
  eTag?: string;

  contentType?: string;
}

export interface GetSignedDownloadUrlRequest {
  destination: S3Destination;

  /**
   * Signed URL validity duration in seconds.
   */
  durationSeconds: number;

  /**
   * Optional filename hint for clients (Content-Disposition).
   * Adapters may choose to implement this via response-content-disposition.
   */
  filename?: string;
}

export interface GetSignedDownloadUrlResult {
  bucket: string;
  key: string;
  url: string;
  expiresInSeconds: number;
}

export interface S3GatewayPort {
  upload(request: UploadToS3Request): Promise<UploadToS3Result>;

  getSignedDownloadUrl(
    request: GetSignedDownloadUrlRequest,
  ): Promise<GetSignedDownloadUrlResult>;
}
