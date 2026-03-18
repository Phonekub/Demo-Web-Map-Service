import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DynamicFormRepositoryPort } from '../../ports/dynamicForm.repository';

@Injectable()
export class GetBlankDynamicFormBySubcodeUseCase {
  constructor(
    @Inject('DynamicFormRepository')
    private readonly dynamicFormRepository: DynamicFormRepositoryPort,
  ) {}

  async handler(subCode: string, formVersionId?: number): Promise<any> {
    // Get form_config_id from subcode
    const formConfigId =
      await this.dynamicFormRepository.getFormConfigIdBySubcode(subCode);

    if (!formConfigId) {
      throw new NotFoundException(
        JSON.stringify({
          code: 'NOT_FOUND',
          message: `ไม่พบ Form Config สำหรับ subcode: ${subCode}`,
        }),
      );
    }

    let versionId = formVersionId;

    // If versionId not provided, find the latest active version
    if (!versionId) {
      const activeVersion =
        await this.dynamicFormRepository.getActiveFormVersionByConfig(formConfigId);

      if (!activeVersion) {
        throw new NotFoundException(
          JSON.stringify({
            code: 'NOT_FOUND',
            message: 'ไม่พบ Version ที่ใช้งานได้',
          }),
        );
      }

      versionId = activeVersion.formVersionId;
    }

    const form = await this.dynamicFormRepository.getBlankForm(formConfigId, versionId);

    if (!form) {
      throw new NotFoundException(
        JSON.stringify({
          code: 'NOT_FOUND',
          message: 'ไม่พบ Form ที่ค้นหา',
        }),
      );
    }

    return form;
  }
}
