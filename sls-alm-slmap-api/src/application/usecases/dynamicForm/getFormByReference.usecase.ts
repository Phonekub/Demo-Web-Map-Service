import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DynamicFormRepositoryPort } from '../../ports/dynamicForm.repository';

@Injectable()
export class GetFormByReferenceUseCase {
  constructor(
    @Inject('DynamicFormRepository')
    private readonly dynamicFormRepository: DynamicFormRepositoryPort,
  ) {}

  async handler(referenceObj: string, referenceKey: number): Promise<any> {
    const form = await this.dynamicFormRepository.getDynamicFormByReference(
      referenceObj,
      referenceKey,
    );

    if (!form) {
      throw new NotFoundException(
        JSON.stringify({
          code: 'NOT_FOUND',
          message: `ไม่พบ Form สำหรับ ${referenceObj}: ${referenceKey}`,
        }),
      );
    }

    return form;
  }
}
