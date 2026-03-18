import { Language } from "../../../common/enums/language.enum";
import { MailParametersResponse } from "../../../domain/quotaMailParameters";
import { WfEmailParameterEntity } from "./entities/wfEmailParameter.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { QuotaMailParametersRepositoryPort } from "../../../application/ports/quotaMailParameters.repository";
import { DataAccessException } from "../../../common/exceptions/quota.exception";


export class QuotaMailParametersRepository implements QuotaMailParametersRepositoryPort {
  constructor(
    @InjectRepository(WfEmailParameterEntity)
    private readonly repository: Repository<WfEmailParameterEntity>,
  ) { }

  async getMailParameters(language?: Language): Promise<MailParametersResponse[]> {
    try {
      const mapping = {
        [Language.TH]: 'mp.name_th',
        [Language.EN]: 'mp.name_en',
        [Language.KM]: 'mp.name_kh',
        [Language.LA]: 'mp.name_la',
      };

      const nameColumn = mapping[language] ? `COALESCE(${mapping[language]}, mp.name)` : 'mp.name';

      const results = await this.repository
        .createQueryBuilder('mp')
        .select([
          'mp.id AS id',
          'mp.wf_id AS "wfId"',
          'mp.code AS code',
          `${nameColumn} AS name`,
          'mp.is_active AS "isActive"',
        ])
        .where('mp.is_active = :active', { active: 'Y' })
        .orderBy('mp.id', 'ASC')
        .getRawMany();

      return results;
    } catch (error) {
      throw new DataAccessException(
        `Failed to get mail parameters: ${error.message}`,
      );
    }
  }
}