import { Inject, Injectable } from '@nestjs/common';
import { MasterRepositoryPort } from '../../ports/master.repository';
import { Dropdown } from '../../../domain/dropdown';
import { Language } from '../../../common/enums/language.enum';

@Injectable()
export class GetCommonCodeUseCase {
  constructor(
    @Inject('MasterRepository')
    private readonly masterRepository: MasterRepositoryPort,
  ) {}

  async handler(codeType: string, language: Language): Promise<Dropdown[]> {
    return await this.masterRepository.getCommonCode(codeType, language);
  }
}
