import { Controller, Get, Query, Body, Req, UseGuards, Param, Put } from '@nestjs/common';
import { FindAllUserUseCase } from '../../../application/usecases/users/findAllUser.usecase';
import { UpdateUserUseCase } from '../../../application/usecases/users/updateUser.usecase';
import { GetUserRoleUseCase } from '../../../application/usecases/users/getUserRole.usecase';
import { GetUserZonesUseCase } from '../../../application/usecases/users/getUserZones.usecase';
import { GetUserSubZonesUseCase } from '../../../application/usecases/users/getUserSubZones.usecase';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { CustomRequest } from '../interfaces/requests/customRequest';
import { FindAllUserWithZonesUseCase } from '../../../application/usecases/users/findAllUserWithZones.usecase';
import { PermissionsGuard } from '../guards/permissions.guard';
import { Permissions } from '../decorators/permissions.decorator';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(
    private readonly findAllUserUseCase: FindAllUserUseCase,
    private readonly findAllUserWithZonesUseCase: FindAllUserWithZonesUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly getUserRoleUseCase: GetUserRoleUseCase,
    private readonly getUserZonesUseCase: GetUserZonesUseCase,
    private readonly getUserSubZonesUseCase: GetUserSubZonesUseCase,
  ) {}

  @UseGuards(PermissionsGuard)
  @Permissions(['USER_MANAGEMENT'])
  @Get()
  async findAll(@Query() query: { search?: string; page?: number; pageSize?: number }) {
    const { search, page, pageSize } = query;
    const result = await this.findAllUserUseCase.handler(search || '', page, pageSize);
    return result;
  }

  @Get('with-zones')
  async findAllUserWithZones(
    @Query() query: { search?: string; page?: number; pageSize?: number },
  ) {
    const { search, page, pageSize } = query;
    const result = await this.findAllUserWithZonesUseCase.handler(
      search || '',
      page,
      pageSize,
    );
    return result;
  }

  @Get('me')
  async getProfile(@Req() req: CustomRequest) {
    return {
      data: {
        id: req.user.id,
        employeeId: req.user.employeeId,
        fullName: req.user.fullName,
        permissions: req.user.permissions,
        roleId: req.user.roleId,
      },
    };
  }

  @Get('zones')
  async getUserZones(@Req() req: CustomRequest) {
    const userId = req.user.id;
    const result = await this.getUserZonesUseCase.handler(userId);
    return { data: result };
  }

  @Get('sub-zones')
  async getUserSubZones(@Req() req: CustomRequest, @Query('zone') zone: string) {
    const userId = req.user.id;
    const result = await this.getUserSubZonesUseCase.handler(userId, zone);
    return { data: result };
  }

  @Get(':user_id')
  async getUserRole(@Param('user_id') userId: number) {
    const result = await this.getUserRoleUseCase.handler(userId);
    return { data: result };
  }

  @UseGuards(PermissionsGuard)
  @Permissions(['USER_MANAGEMENT'])
  @Put(':user_id')
  async updateUser(@Param('user_id') userId: number, @Body() body: UpdateUserDto) {
    const result = await this.updateUserUseCase.handler(userId, body);
    return result;
  }
}
