import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Res,
  Delete,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { CustomRequest } from '../interfaces/requests/customRequest';
import { ApprovePotentialDto, SendApprovePotentialDto } from '../dtos/potential.dto';
import { FindPotentialStatusUsecase } from '../../../application/usecases/potential/findPotentialStatus.usecase';
import { GetPendingApprovalPotentialsUseCase } from '../../../application/usecases/potential/getPendingApprovalPotentials.usecase';
import { GetPotentialDetailUseCase } from '../../../application/usecases/potential/getPotentialDetail.usecase';
import { CreateRentalFormLocUseCase } from '../../../application/usecases/potential/createRentalFormLoc.usecase';
import { SendApprovePotentialUseCase } from '../../../application/usecases/potential/sendApprovePotential.usecase';
import { ApprovePotentialUsecase } from '../../../application/usecases/potential/approvePotential.usecase';
import { UploadPoiImagesUsecase } from '../../../application/usecases/potential/uploadPoiImages.usecase';
import { GetPoiImagesUsecase } from '../../../application/usecases/potential/getPoiImages.usecase';
import { Response } from 'express';
import { join } from 'path';
import { existsSync } from 'fs';
import { DeletePoiImagesUsecase } from '../../../application/usecases/potential/deletePoiImages.usecase';

@UseGuards(JwtAuthGuard)
@Controller('potentials')
export class PotentialController {
  constructor(
    private readonly approvePotentialUsecase: ApprovePotentialUsecase,
    private readonly getPotentialDetailUseCase: GetPotentialDetailUseCase,
    private readonly findPotentialStatusUsecase: FindPotentialStatusUsecase,
    private readonly getPendingApprovalPotentialsUseCase: GetPendingApprovalPotentialsUseCase,
    private readonly createRentalFormLocUseCase: CreateRentalFormLocUseCase,
    private readonly sendApprovePotentialUseCase: SendApprovePotentialUseCase,
    private readonly uploadPoiImagesUsecase: UploadPoiImagesUsecase,
    private readonly getPoiImagesUsecase: GetPoiImagesUsecase,
    private readonly deletePoiImagesUsecase: DeletePoiImagesUsecase,
  ) {}

  @Get('pending-approval')
  async getPendingApproval(
    @Req() req: CustomRequest,
    @Query('wfId') wfId?: number,
    @Query('poiId') poiId?: number,
  ) {
    const result = await this.getPendingApprovalPotentialsUseCase.handler(
      wfId,
      req.user.id,
      poiId,
    );
    return {
      data: result,
    };
  }

  @Get(':id/detail')
  async getDetail(@Param('id') id: number) {
    const result = await this.getPotentialDetailUseCase.handler(id);
    return {
      data: result,
    };
  }

  @Get(':id/status')
  async getPotentialStatus(@Req() req: CustomRequest, @Param('id') id: number) {
    return await this.findPotentialStatusUsecase.handler(id, req.user.id);
  }

  @Post('send-approve')
  async sendApprove(@Req() req: CustomRequest, @Body() body: SendApprovePotentialDto) {
    try {
      const result = await this.sendApprovePotentialUseCase.handler(
        body.poiId,
        req.user.id,
      );
      return result;
    } catch (err) {
      return {
        success: false,
        message: err.message || 'An error occurred',
      };
    }
  }

  @Post(':id/approve')
  async approvePotential(
    @Req() req: CustomRequest,
    @Param('id') id: number,
    @Body() body: ApprovePotentialDto,
  ) {
    const result = await this.approvePotentialUsecase.handler({
      poiId: id,
      approvalAction: body.status,
      userId: req.user.id,
      remark: body.remark,
    });

    return result;
  }

  @Get('poi/:id')
  async getPotentialByPoiId(@Param('id', ParseIntPipe) id: number) {
    const result = await this.getPotentialDetailUseCase.handler(id);
    return {
      data: result,
    };
  }

  @Post('images/:poiId')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadImages(
    @Param('poiId', ParseIntPipe) poiId: number,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: CustomRequest,
  ) {
    const result = await this.uploadPoiImagesUsecase.handler(poiId, files, req.user.id);
    return result;
  }

  @Get('images/:poiId')
  async getImages(@Param('poiId', ParseIntPipe) poiId: number) {
    const images = await this.getPoiImagesUsecase.handler(poiId);

    return {
      data: images,
    };
  }

  @Post('images/:imageId/delete')
  async deleteImage(
    @Param('imageId', ParseIntPipe) imageId: number,
    @Req() req: CustomRequest,
  ) {
    const result = await this.deletePoiImagesUsecase.handler(imageId, req.user.id);
    return result;
  }

  // @Get('mock-images/:name')
  // getImage(@Param('name') name: string, @Res() res: Response) {
  //   const filePath = join(process.cwd(), 'mock-images', name);

  //   if (!existsSync(filePath)) {
  //     return res.status(404).send('Image not found');
  //   }

  //   return res.sendFile(filePath);
  // }
}
