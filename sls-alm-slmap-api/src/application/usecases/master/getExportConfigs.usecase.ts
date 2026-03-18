import { Inject, Injectable } from '@nestjs/common';
import { TradeareaRepositoryPort } from '../../ports/tradearea.repository';
import { Language } from '../../../common/enums/language.enum';
import { MasterRepositoryPort } from '../../ports/master.repository';

@Injectable()
export class GetTradeareaConfigsUseCase {
  constructor(
    @Inject('MasterRepository')
    private readonly masterRepository: MasterRepositoryPort,
  ) {}

  async handler(language: Language) {
    const result = await this.masterRepository.getExportConfigs(language);
    return result;
  }
}
