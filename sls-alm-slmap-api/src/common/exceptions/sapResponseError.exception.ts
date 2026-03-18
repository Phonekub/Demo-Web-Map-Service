import { HttpException, HttpStatus } from '@nestjs/common';

export class SapResponseErrorException extends HttpException {
  sapMessage: string;
  sapNo: string[];

  constructor(message: string, data?: string[]) {
    const error = {
      message,
      data,
    };

    super(error, HttpStatus.BAD_REQUEST);

    // this.sapMessage = message;
    // this.sapNo = data;
  }
}
