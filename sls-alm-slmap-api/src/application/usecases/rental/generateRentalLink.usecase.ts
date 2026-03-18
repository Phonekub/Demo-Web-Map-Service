import { Inject, Injectable, Logger } from '@nestjs/common';
import { MasterRepositoryPort } from '../../ports/master.repository';
import { UserRepositoryPort } from '../../ports/user.repository';

export interface GenerateRentalLinkRequest {
  formLocNumber: string;
  userId: number;
  timestamp: number;
  nation?: string;
}

export interface GenerateRentalLinkResponse {
  url: string;
  formLocNumber: string;
  username: string;
  timestamp: number;
  nation: string;
}

@Injectable()
export class GenerateRentalLinkUseCase {
  private readonly logger = new Logger(GenerateRentalLinkUseCase.name);

  constructor(
    @Inject('MasterRepository')
    private readonly masterRepository: MasterRepositoryPort,
    @Inject('UserRepository')
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async handler(request: GenerateRentalLinkRequest): Promise<GenerateRentalLinkResponse> {
    const { formLocNumber, userId, timestamp, nation = 'TH' } = request;

    this.logger.log(`Generating rental link for formLocNumber: ${formLocNumber}, userId: ${userId}, nation: ${nation}`);

    // Get username from userId
    const user = await this.userRepository.findById(Number(userId));
    const username = user?.username || 'system';

    this.logger.log(`Resolved username: ${username} for userId: ${userId}`);

    // Get rental URL from COMMON_CODE table
    const rentalApiUrl = await this.masterRepository.getUrlByNation(
      'URL_LINK',
      'RENTAL_FORM_LOC',
      nation
    );

    if (!rentalApiUrl) {
      throw new Error(`Rental URL not found for nation: ${nation}`);
    }

    // Base64 encode formLocNumber and username
    const formLocNumberEncode = Buffer.from(formLocNumber).toString('base64');
    const usernameEncode = Buffer.from(username).toString('base64');

    // Build the complete URL
    const url = `${rentalApiUrl}?formLocNumber=${formLocNumberEncode}&username=${usernameEncode}&ts=${timestamp}`;

    return {
      url,
      formLocNumber,
      username,
      timestamp,
      nation,
    };
  }
}
