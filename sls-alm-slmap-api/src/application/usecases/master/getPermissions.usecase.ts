import { Inject, Injectable } from '@nestjs/common';
import { MasterRepositoryPort } from '../../ports/master.repository';
import { Language } from '../../../common/enums/language.enum';

@Injectable()
export class GetPermissionsUseCase {
  constructor(
    @Inject('MasterRepository')
    private readonly masterRepository: MasterRepositoryPort,
  ) {}

  async handler(language?: Language) {
    return await this.masterRepository.getCommonCode('PERMISSION', language);
  }
}
