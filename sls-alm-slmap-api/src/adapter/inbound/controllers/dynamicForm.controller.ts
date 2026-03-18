import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { GetDynamicFormUseCase } from '../../../application/usecases/dynamicForm/getDynamicForm.usecase';
import { GetFormByReferenceUseCase } from '../../../application/usecases/dynamicForm/getFormByReference.usecase';
import { GetBlankDynamicFormUseCase } from '../../../application/usecases/dynamicForm/getBlankDynamicForm.usecase';
import { SaveDynamicFormUseCase } from '../../../application/usecases/dynamicForm/saveDynamicForm.usecase';
import { JwtAuthGuard } from '../guards/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('dynamicform')
export class DynamicFormController {
  constructor(
    private readonly getDynamicFormUseCase: GetDynamicFormUseCase,
    private readonly getFormByReferenceUseCase: GetFormByReferenceUseCase,
    private readonly getBlankDynamicFormUseCase: GetBlankDynamicFormUseCase,
    private readonly saveDynamicFormUseCase: SaveDynamicFormUseCase,
  ) {}

  @Get('getForm/:id')
  async getDynamicForm(@Param('id') id: string) {
    if (!id) {
      return {
        success: false,
        error: {
          code: 'PARAMETER_MISSING',
          message: 'กรุณาระบุ Form ID',
        },
      };
    }

    const formId = parseInt(id, 10);
    if (isNaN(formId)) {
      return {
        success: false,
        error: {
          code: 'PARAMETER_INVALID',
          message: 'Form ID ต้องเป็นตัวเลข',
        },
      };
    }

    try {
      const form = await this.getDynamicFormUseCase.handler(formId);
      return {
        success: true,
        form,
      };
    } catch (error) {
      const errorData = this.parseError(error);
      return {
        success: false,
        error: errorData,
      };
    }
  }

  @Get('getForm/:obj/:key')
  async getFormByReference(@Param('obj') obj: string, @Param('key') key: string) {
    if (!obj || !key) {
      return {
        success: false,
        error: {
          code: 'PARAMETER_MISSING',
          message: 'กรุณาระบุ reference_obj และ reference_key',
        },
      };
    }

    const referenceKey = parseInt(key, 10);
    if (isNaN(referenceKey)) {
      return {
        success: false,
        error: {
          code: 'PARAMETER_INVALID',
          message: 'reference_key ต้องเป็นตัวเลข',
        },
      };
    }

    try {
      const form = await this.getFormByReferenceUseCase.handler(obj, referenceKey);
      return {
        success: true,
        form,
      };
    } catch (error) {
      const errorData = this.parseError(error);
      return {
        success: false,
        error: errorData,
      };
    }
  }

  @Get('getBlankForm/:formId')
  async getBlankDynamicForm(@Param('formId') formId: string) {
    if (!formId) {
      return {
        success: false,
        error: {
          code: 'PARAMETER_MISSING',
          message: 'กรุณาระบุ Form Config ID',
        },
      };
    }

    const formConfigId = parseInt(formId, 10);
    if (isNaN(formConfigId)) {
      return {
        success: false,
        error: {
          code: 'PARAMETER_INVALID',
          message: 'Form Config ID ต้องเป็นตัวเลข',
        },
      };
    }

    try {
      const form = await this.getBlankDynamicFormUseCase.handler(formConfigId);
      return {
        success: true,
        form,
      };
    } catch (error) {
      const errorData = this.parseError(error);
      return {
        success: false,
        error: errorData,
      };
    }
  }

  @Get('getBlankForm/:formId/version/:versionId')
  async getBlankDynamicFormWithVersion(
    @Param('formId') formId: string,
    @Param('versionId') versionId: string,
  ) {
    if (!formId) {
      return {
        success: false,
        error: {
          code: 'PARAMETER_MISSING',
          message: 'กรุณาระบุ Form Config ID',
        },
      };
    }

    const formConfigId = parseInt(formId, 10);
    if (isNaN(formConfigId)) {
      return {
        success: false,
        error: {
          code: 'PARAMETER_INVALID',
          message: 'Form Config ID ต้องเป็นตัวเลข',
        },
      };
    }

    const formVersionId = parseInt(versionId, 10);
    if (isNaN(formVersionId)) {
      return {
        success: false,
        error: {
          code: 'PARAMETER_INVALID',
          message: 'Form Version ID ต้องเป็นตัวเลข',
        },
      };
    }

    try {
      const form = await this.getBlankDynamicFormUseCase.handler(
        formConfigId,
        formVersionId,
      );
      return {
        success: true,
        form,
      };
    } catch (error) {
      const errorData = this.parseError(error);
      return {
        success: false,
        error: errorData,
      };
    }
  }

  @Post()
  async createDynamicForm(@Body() body: any) {
    try {
      const result = await this.saveDynamicFormUseCase.handler(body);
      return {
        success: true,
        form: result,
      };
    } catch (error) {
      const errorData = this.parseError(error);
      return {
        success: false,
        error: errorData,
      };
    }
  }

  @Put(':formId')
  async updateDynamicForm(
    @Param('formId', ParseIntPipe) formId: number,
    @Body() body: any,
  ) {
    try {
      const result = await this.saveDynamicFormUseCase.handler(body, formId, true);
      return {
        success: true,
        form: result,
      };
    } catch (error) {
      const errorData = this.parseError(error);
      return {
        success: false,
        error: errorData,
      };
    }
  }

  private parseError(error: any): { code: string; message: string } {
    try {
      // Try to parse JSON error message from NotFoundException
      const parsed = JSON.parse(error.message);
      if (parsed.code && parsed.message) {
        return parsed;
      }
    } catch (e) {
      // If not JSON, return generic error
    }

    return {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || 'เกิดข้อผิดพลาดในระบบ',
    };
  }
}
