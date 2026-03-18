import { HttpException, HttpStatus } from '@nestjs/common';

export class SapBadRequestFormatException extends HttpException {
  constructor(type: string, message: string) {
    const error = {
      type,
      message,
    };

    super(error, HttpStatus.BAD_REQUEST);
  }
}
