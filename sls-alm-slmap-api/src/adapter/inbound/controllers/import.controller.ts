import { DownloadFileUseCase } from '../../../application/usecases/import/downloadFile.usecase';
import { DeleteAnnounceUseCase } from '../../../application/usecases/import/deleteAnnounce.usecase';
import { CreateStorePlanStandardDto } from '../dtos/createStorePlanStandard.dto';
import {
  Controller,
  Post,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Get,
  Body,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { ImportFileUseCase } from '../../../application/usecases/import/importFile.usecase';
import { CreateStorePlanStandardUseCase } from '../../../application/usecases/import/createStorePlanStandard.usecase';
import { ImportResponse } from '../dtos/import.dto';
import { GetStorePlanStandardUseCase } from '../../../application/usecases/import/getStorePlanStandard.usecase';
import { GetAnnounceUseCase } from '../../../application/usecases/import/getAnnounce.usecase';
import { CreateAnnounceUseCase } from '../../../application/usecases/import/createAnnounce.usecase';
import { CreateAnnounceDto } from '../dtos/createAnnounce.dto';
import { GetKnowledgeUseCase } from '../../../application/usecases/import/getKnowledge.usecase';
import { CreateKnowledgeUseCase } from '../../../application/usecases/import/createKnowledge.usecase';
import { CreateKnowledgeDto } from '../dtos/createKnowledge.dto';
import { UpdateCanLoadStorePlanStandardUseCase } from '../../../application/usecases/import/updateCanLoadStorePlanStandard.usecase';
import { DeleteStorePlanStandardUseCase } from '../../../application/usecases/import/deleteStorePlanStandard.usecase';
import { DeleteKnowledgeUseCase } from '../../../application/usecases/import/deleteKnowledge.usecase';
import { UpdateAnnounceIsShowUseCase } from '../../../application/usecases/import/updateAnnounceIsShow.usecase';
import { Inject } from '@nestjs/common';
import { S3GatewayPort } from '../../../application/ports/s3.gateway';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { Permissions } from '../decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('import')
export class ImportController {
  constructor(
    private readonly importFileUseCase: ImportFileUseCase,
    private readonly getStorePlanStandardUseCase: GetStorePlanStandardUseCase,
    private readonly getAnnounceUseCase: GetAnnounceUseCase,
    private readonly createAnnounceUseCase: CreateAnnounceUseCase,
    private readonly getKnowledgeUseCase: GetKnowledgeUseCase,
    private readonly createStorePlanStandardUseCase: CreateStorePlanStandardUseCase,
    private readonly createKnowledgeUseCase: CreateKnowledgeUseCase,
    private readonly updateCanLoadStorePlanStandardUseCase: UpdateCanLoadStorePlanStandardUseCase,
    private readonly deleteStorePlanStandardUseCase: DeleteStorePlanStandardUseCase,
    private readonly deleteKnowledgeUseCase: DeleteKnowledgeUseCase,
    private readonly deleteAnnounceUseCase: DeleteAnnounceUseCase,
    private readonly updateAnnounceIsShowUseCase: UpdateAnnounceIsShowUseCase,

    @Inject('S3GatewayPort')
    private readonly s3Gateway: S3GatewayPort,

    private readonly downloadFileUseCase: DownloadFileUseCase,
  ) {}

  @Permissions(['DATA_IMPORT'])
  @Get(':id/download')
  async downloadFile(@Param('id') id: number, @Query('type') type: string) {
    if (!type) {
      throw new BadRequestException('Query parameter "type" is required');
    }
    return await this.downloadFileUseCase.execute(type, id);
  }

  @Put('announce/:id/delete')
  async softDeleteAnnounce(@Param('id') id: number) {
    try {
      await this.deleteAnnounceUseCase.handler(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message || 'Soft delete announce failed' };
    }
  }

  @Permissions(['DATA_IMPORT'])
  @Post('upload/:id')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    }),
  )
  async uploadImportFile(
    @Param('id') importId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ImportResponse> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    ImportFileUseCase.validateFile(file);

    const result = await this.importFileUseCase.execute(importId, file);
    return { data: result };
  }

  @Post('store-plan-standard')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    }),
  )
  async createStorePlanStandard(
    @Body() body: CreateStorePlanStandardDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    try {
      const saved = await this.createStorePlanStandardUseCase.handlerWithFile(body, file);

      return {
        success: true,
        form: saved,
      };
    } catch (error) {
      console.error('CREATE ERROR:', error);
      return {
        success: false,
        error: error.message || 'An error occurred',
      };
    }
  }

  @Get('announce')
  async getAnnounce() {
    return await this.getAnnounceUseCase.handler();
  }
  @Get('store-plan-standard')
  async getStorePlanStandard() {
    return await this.getStorePlanStandardUseCase.handler();
  }
  @Get('knowledge')
  async getKnowledge() {
    return await this.getKnowledgeUseCase.handler();
  }

  @Get('knowledge/role/:roleId')
  async getKnowledgeByRole(@Param('roleId') roleId: string) {
    return await this.getKnowledgeUseCase.getByRoleId(roleId);
  }

  @Post('announce')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    }),
  )
  async createAnnounce(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateAnnounceDto,
  ) {
    try {
      const saved = await this.createAnnounceUseCase.handlerWithFile(body, file);
      return {
        success: true,
        knowledge: saved,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Create announce failed',
      };
    }
  }

  @Put('knowledge/:id/delete')
  async softDeleteKnowledge(@Param('id') id: number) {
    try {
      await this.deleteKnowledgeUseCase.handler(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message || 'Soft delete knowledge failed' };
    }
  }

  @Put('store-plan-standard/:id/can-load')
  async updateCanLoad(@Param('id') id: number, @Body() body: { can_load: string }) {
    try {
      const updated = await this.updateCanLoadStorePlanStandardUseCase.handler(
        id,
        body.can_load,
      );
      return { success: true, updated };
    } catch (error) {
      return { success: false, error: error.message || 'Update failed' };
    }
  }

  @Put('store-plan-standard/:id/delete')
  async softDeleteStorePlanStandard(@Param('id') id: number) {
    try {
      const result = await this.deleteStorePlanStandardUseCase.handler(id);
      return { success: true, ...result };
    } catch (error) {
      return { success: false, error: error.message || 'Soft delete failed' };
    }
  }

  @Put('announce/:id/is-show')
  async updateAnnounceIsShow(
    @Param('id') id: number,
    @Body() body: { is_show: string; updateBy: string },
  ) {
    try {
      const updated = await this.updateAnnounceIsShowUseCase.handler(
        id,
        body.is_show,
        body.updateBy,
      );
      return { success: true, updated };
    } catch (error) {
      return { success: false, error: error.message || 'Update is_show failed' };
    }
  }

  // for S3 integration
  @Post('knowledge')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  async uploadKnowledgeFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateKnowledgeDto,
  ) {
    try {
      const saved = await this.createKnowledgeUseCase.handlerWithFile(body, file);
      return {
        success: true,
        knowledge: saved,
      };
    } catch (error) {
      console.error('CREATE ERROR:', error);
      return {
        success: false,
        error: error.message || 'An error occurred',
      };
    }
  }
}
