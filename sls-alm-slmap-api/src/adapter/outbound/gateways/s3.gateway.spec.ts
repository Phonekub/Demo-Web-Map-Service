import { ConfigService } from '@nestjs/config';
import { S3Gateway } from './s3.gateway';

describe('S3Gateway - private helpers', () => {
  const makeGateway = () => {
    const configService = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;

    return new S3Gateway(configService);
  };

  describe('parseDestination', () => {
    it('should throw when destination is empty/whitespace', () => {
      const gateway = makeGateway();

      expect(() => (gateway as any).parseDestination('')).toThrow(
        'S3 destination is required (format: "bucket/key")',
      );
      expect(() => (gateway as any).parseDestination('   ')).toThrow(
        'S3 destination is required (format: "bucket/key")',
      );
      expect(() => (gateway as any).parseDestination(undefined)).toThrow(
        'S3 destination is required (format: "bucket/key")',
      );
      expect(() => (gateway as any).parseDestination(null)).toThrow(
        'S3 destination is required (format: "bucket/key")',
      );
    });

    it('should throw when missing slash or bucket/key is incomplete', () => {
      const gateway = makeGateway();

      expect(() => (gateway as any).parseDestination('bucketOnly')).toThrow(
        'Expected format: "bucket/key"',
      );
      expect(() => (gateway as any).parseDestination('/bucketOnly')).toThrow(
        'Expected format: "bucket/key"',
      );
      expect(() => (gateway as any).parseDestination('bucket/')).toThrow(
        'Expected format: "bucket/key"',
      );
      expect(() => (gateway as any).parseDestination('/bucket/')).toThrow(
        'Expected format: "bucket/key"',
      );
      expect(() => (gateway as any).parseDestination('/')).toThrow(
        'Expected format: "bucket/key"',
      );
    });

    it('should normalize leading slashes and return bucket + key', () => {
      const gateway = makeGateway();

      expect((gateway as any).parseDestination('/my-bucket/path/to/file.txt')).toEqual({
        bucket: 'my-bucket',
        key: 'path/to/file.txt',
      });

      expect((gateway as any).parseDestination('///my-bucket/a/b/c.png')).toEqual({
        bucket: 'my-bucket',
        key: 'a/b/c.png',
      });
    });

    it('should trim bucket whitespace but preserve key as-is after the first slash', () => {
      const gateway = makeGateway();

      expect((gateway as any).parseDestination('  my-bucket  /path/to/file.txt')).toEqual({
        bucket: 'my-bucket',
        key: 'path/to/file.txt',
      });
    });

    it('should reject ".." segments in key', () => {
      const gateway = makeGateway();

      expect(() => (gateway as any).parseDestination('my-bucket/../secret.txt')).toThrow(
        'Key must not contain ".." segments',
      );

      expect(() =>
        (gateway as any).parseDestination('my-bucket/path/../../secret.txt'),
      ).toThrow('Key must not contain ".." segments');

      // A key containing ".." inside a segment is allowed (only exact segment ".." is blocked)
      expect((gateway as any).parseDestination('my-bucket/path..to/file.txt')).toEqual({
        bucket: 'my-bucket',
        key: 'path..to/file.txt',
      });
    });
  });

  describe('normalizeExpiresInSeconds', () => {
    it('should throw if durationSeconds is not finite', () => {
      const gateway = makeGateway();

      expect(() => (gateway as any).normalizeExpiresInSeconds(Number.NaN)).toThrow(
        'durationSeconds must be a finite number',
      );
      expect(() => (gateway as any).normalizeExpiresInSeconds(Number.POSITIVE_INFINITY)).toThrow(
        'durationSeconds must be a finite number',
      );
      expect(() => (gateway as any).normalizeExpiresInSeconds(Number.NEGATIVE_INFINITY)).toThrow(
        'durationSeconds must be a finite number',
      );
    });

    it('should throw if durationSeconds <= 0 after flooring', () => {
      const gateway = makeGateway();

      expect(() => (gateway as any).normalizeExpiresInSeconds(0)).toThrow(
        'durationSeconds must be greater than 0',
      );
      expect(() => (gateway as any).normalizeExpiresInSeconds(-1)).toThrow(
        'durationSeconds must be greater than 0',
      );
      expect(() => (gateway as any).normalizeExpiresInSeconds(0.1)).toThrow(
        'durationSeconds must be greater than 0',
      );
      expect(() => (gateway as any).normalizeExpiresInSeconds(-0.1)).toThrow(
        'durationSeconds must be greater than 0',
      );
    });

    it('should floor to an integer', () => {
      const gateway = makeGateway();

      expect((gateway as any).normalizeExpiresInSeconds(1.9)).toBe(1);
      expect((gateway as any).normalizeExpiresInSeconds(12.01)).toBe(12);
    });

    it('should clamp to 7 days (604800 seconds)', () => {
      const gateway = makeGateway();

      const sevenDays = 60 * 60 * 24 * 7;
      expect((gateway as any).normalizeExpiresInSeconds(sevenDays)).toBe(sevenDays);
      expect((gateway as any).normalizeExpiresInSeconds(sevenDays + 1)).toBe(sevenDays);
      expect((gateway as any).normalizeExpiresInSeconds(sevenDays * 10)).toBe(sevenDays);
    });
  });

  describe('buildContentDisposition', () => {
    it('should build attachment disposition with ascii-safe filename and utf-8 filename*', () => {
      const gateway = makeGateway();

      const result = (gateway as any).buildContentDisposition('report.pdf');

      expect(result).toBe(
        `attachment; filename="report.pdf"; filename*=UTF-8''report.pdf`,
      );
    });

    it('should replace unsafe characters in ascii filename and percent-encode utf-8 filename*', () => {
      const gateway = makeGateway();

      const filename = `weird/"name"\\thai-ทดสอบ.txt`;
      const result = (gateway as any).buildContentDisposition(filename);

      // ASCII part should replace /, \, " and non-ascii with _
      expect(result).toContain(`attachment; filename="weird__name__thai-_____.txt";`);

      // UTF-8 part should be encodeURIComponent(filename)
      expect(result).toContain(`filename*=UTF-8''${encodeURIComponent(filename)}`);
    });
  });
});