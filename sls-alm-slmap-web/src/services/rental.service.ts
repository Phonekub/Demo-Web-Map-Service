import { post } from './httpBase.service';

export interface GenerateRentalLinkRequest {
  formLocNumber: string;
  userId: number;
  timestamp: number;
  nation?: string;
}

export interface GenerateRentalLinkResponse {
  data: {
    url: string;
    formLocNumber: string;
    username: string;
    timestamp: number;
    nation: string;
  };
}

export const generateRentalLink = async (
  request: GenerateRentalLinkRequest
): Promise<GenerateRentalLinkResponse> => {
  return post<GenerateRentalLinkResponse, GenerateRentalLinkRequest>(
    'rental/generate-link',
    request
  );
};
