import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { DynamicFormRepositoryPort } from '../../ports/dynamicForm.repository';

@Injectable()
export class SaveDynamicFormUseCase {
  constructor(
    @Inject('DynamicFormRepository')
    private readonly dynamicFormRepository: DynamicFormRepositoryPort,
  ) {}

  async handler(data: any, formId?: number, isUpdate: boolean = false): Promise<any> {
    if (isUpdate) {
      if (!formId) {
        throw new BadRequestException('Form ID is required for update');
      }
      return await this.updateDynamicForm(data, formId);
    } else {
      return await this.createDynamicForm(data);
    }
  }

  private async createDynamicForm(data: any): Promise<any> {
    // Validate required fields
    if (!data.formVersionId) {
      throw new BadRequestException('Form Version ID is required');
    }

    if (!data.fields || !Array.isArray(data.fields) || data.fields.length === 0) {
      throw new BadRequestException('Fields data is required');
    }

    // Check if form with same referenceObj and referenceKey already exists
    if (data.referenceObj && data.referenceKey) {
      const existingForm = await this.dynamicFormRepository.getDynamicFormByReference(
        data.referenceObj,
        data.referenceKey,
      );
      if (existingForm) {
        throw new BadRequestException(
          JSON.stringify({
            code: 'DUPLICATE_REFERENCE',
            message: 'มีแบบฟอร์มสำหรับ reference นี้อยู่แล้ว',
          }),
        );
      }
    }

    // Generate new form ID
    const formId = await this.dynamicFormRepository.generateFormId();
    if (!formId) {
      throw new BadRequestException(
        JSON.stringify({
          code: 'ID_FULL',
          message: 'รหัสแบบฟอร์มเต็ม',
        }),
      );
    }

    try {
      const formData = {
        formId,
        formVersionId: data.formVersionId,
        referenceObj: data.referenceObj || null,
        referenceKey: data.referenceKey || null,
        createdUser: data.createdUser || 'system',
        lastEditedUser: data.lastEditedUser || data.createdUser || 'system',
        fields: data.fields,
      };

      const result =
        await this.dynamicFormRepository.createDynamicFormWithValues(formData);
      return result;
    } catch (error) {
      throw new BadRequestException(
        JSON.stringify({
          code: 'SAVE_FAIL',
          message: 'บันทึกข้อมูลไม่สำเร็จ',
        }),
      );
    }
  }

  private async updateDynamicForm(data: any, formId: number): Promise<any> {
    // Check if form exists
    const existingForm = await this.dynamicFormRepository.findByFormId(formId);
    if (!existingForm) {
      throw new BadRequestException(
        JSON.stringify({
          code: 'NOT_FOUND',
          message: 'ไม่พบแบบฟอร์ม',
        }),
      );
    }

    // Validate required fields
    if (!data.fields || !Array.isArray(data.fields) || data.fields.length === 0) {
      throw new BadRequestException('Fields data is required');
    }

    try {
      const updateData = {
        formVersionId: data.formVersionId,
        referenceObj: data.referenceObj || existingForm.referenceObj,
        referenceKey: data.referenceKey || existingForm.referenceKey,
        lastEditedUser: data.lastEditedUser || 'system',
        fields: data.fields,
      };

      const result = await this.dynamicFormRepository.updateDynamicFormWithValues(
        formId,
        updateData,
      );
      return result;
    } catch (error) {
      throw new BadRequestException(
        JSON.stringify({
          code: 'SAVE_FAIL',
          message: 'บันทึกข้อมูลไม่สำเร็จ',
        }),
      );
    }
  }
}
