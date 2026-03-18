import { Inject, Injectable } from '@nestjs/common';
import {
  SaveMailTemplateRequest,
  SaveMailTemplateResponse,
} from '../../../domain/quotaMailTemplate';
import { QuotaMailTemplateRepositoryPort } from '../../ports/quotaMailTemplate.repository';

@Injectable()
export class SaveMailTemplateUseCase {
  constructor(
    @Inject('QuotaMailTemplateRepository')
    private readonly quotaMailTemplateRepository: QuotaMailTemplateRepositoryPort,
  ) {}

  async execute(
    request: SaveMailTemplateRequest,
    userId: number,
  ): Promise<SaveMailTemplateResponse> {
    try {
      await this.quotaMailTemplateRepository.saveMailTemplate(request, userId);

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: error.code || 'MAIL_TEMPLATE_UPDATE_FAILED',
          message: error.message,
        },
      };
    }
  }
}
