import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { GetBackupProfileUseCase } from '../../../application/usecases/backupProfile/getBackupProfile.usecase';
import { SaveBackupProfileUseCase } from '../../../application/usecases/backupProfile/saveBackupProfile.usecase';
import { GetBlankDynamicFormBySubcodeUseCase } from '../../../application/usecases/dynamicForm/getBlankDynamicFormBySubcode.usecase';
import {
  CreateBackupProfileDto,
  UpdateBackupProfileDto,
} from '../dtos/backupProfile.dto';

@UseGuards(JwtAuthGuard)
@Controller('backupprofile')
export class BackupProfileController {
  constructor(
    private readonly getBackupProfileUseCase: GetBackupProfileUseCase,
    private readonly saveBackupProfileUseCase: SaveBackupProfileUseCase,
    private readonly getBlankDynamicFormBySubcodeUseCase: GetBlankDynamicFormBySubcodeUseCase,
  ) {}

  @Get(':poiId')
  async getBackupProfile(@Param('poiId') poiId: string) {
    const profile = await this.getBackupProfileUseCase.handler(poiId);
    return { data: profile };
  }

  @Post()
  async createBackupProfile(@Body() body: CreateBackupProfileDto) {
    const result = await this.saveBackupProfileUseCase.handler(body);
    return { data: result };
  }

  @Put(':uid')
  async updateBackupProfile(
    @Param('uid') uid: string,
    @Body() body: UpdateBackupProfileDto,
  ) {
    const result = await this.saveBackupProfileUseCase.handler(body, uid);
    return { data: result };
  }

  @Get('getBlankForm/:subcode')
  async getBlankDynamicForm(@Param('subcode') subcode: string) {
    if (!subcode) {
      return {
        success: false,
        error: {
          code: 'PARAMETER_MISSING',
          message: 'กรุณาระบุ Subcode',
        },
      };
    }

    try {
      const form = await this.getBlankDynamicFormBySubcodeUseCase.handler(subcode);
      return {
        success: true,
        form,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message || 'เกิดข้อผิดพลาดในระบบ',
        },
      };
    }
  }

  @Get('getBlankForm/:subcode/version/:versionId')
  async getBlankDynamicFormWithVersion(
    @Param('subcode') subcode: string,
    @Param('versionId') versionId: string,
  ) {
    if (!subcode) {
      return {
        success: false,
        error: {
          code: 'PARAMETER_MISSING',
          message: 'กรุณาระบุ Subcode',
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
      const form = await this.getBlankDynamicFormBySubcodeUseCase.handler(
        subcode,
        formVersionId,
      );
      return {
        success: true,
        form,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message || 'เกิดข้อผิดพลาดในระบบ',
        },
      };
    }
  }
}
