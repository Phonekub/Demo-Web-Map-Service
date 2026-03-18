import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DynamicFormRepositoryPort } from '../../ports/dynamicForm.repository';

@Injectable()
export class GetDynamicFormUseCase {
  constructor(
    @Inject('DynamicFormRepository')
    private readonly dynamicFormRepository: DynamicFormRepositoryPort,
  ) {}

  async handler(formId: number): Promise<any> {
    const form = await this.dynamicFormRepository.getDynamicForm(formId);

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
