import * as _ from 'lodash';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Builder } from 'builder-pattern';
import { JwtPayload } from '../../../common/interfaces/jwtPayload';
import { GenerateJwtTokenUseCase } from '../generateJwtToken.usecase';
import { UserRepositoryPort } from '../../ports/user.repository';
import { ADCognitoGatewayPort } from '../../ports/adCognitoGateway.repository';
import { PermissionType } from '@common/enums/permissions.enum';

export interface JWTToken {
  token: string;
  refreshToken?: string;
}

@Injectable()
export class OAuth2CallbackUseCase {
  constructor(
    @Inject('ADCognitoGateway')
    private readonly adCognitoGateway: ADCognitoGatewayPort,
    @Inject('UserRepository')
    private readonly userRepository: UserRepositoryPort,
    private readonly jwtService: JwtService,
    private readonly generateJwtTokenUseCase: GenerateJwtTokenUseCase,
  ) {}

  async handler(authorizationCode: string): Promise<JWTToken> {
    if (_.isNil(authorizationCode) || _.isEmpty(authorizationCode)) {
      throw new UnauthorizedException();
    }

    const result = await this.adCognitoGateway.getToken(authorizationCode);
    if (_.isNull(result.idToken)) {
      throw new UnauthorizedException();
    }

    // Fetch user info using the access token
    // const userInfo = await this.adCognitoGateway.getUserInfo(result.accessToken);

    const decodeToken = this.jwtService.decode(result.idToken);
    const employeeID = decodeToken['custom:EmployeeID'];
    if (_.isUndefined(employeeID)) {
      throw new UnauthorizedException('Decode token is invalid');
    }

    const user = await this.userRepository.findByNumber(String(employeeID));

    if (_.isUndefined(user)) {
      throw new UnauthorizedException();
    }

    const userRoles = await this.userRepository.getUserRole(user.userId);
    const userZones = await this.userRepository.getUserZone(user.userId);
    const userPermissions = await this.userRepository.getUserPermissions(user.userId);
    let storeCode = null;
    if (userRoles?.permissionType === PermissionType.STORE) {
      storeCode = [];
      const sevenProfile = await this.userRepository.getUserSevenProfile(user.employeeId);
      storeCode.push(...sevenProfile.map((profile) => profile.storecode));
    }

    // if (user.roles.length < 1) {
    //   throw new UnauthorizedException();
    // }

    const generateJwtCommand = Builder<JwtPayload>()
      .id(user.userId)
      .employeeId(user.employeeId)
      .fullName(`${user.firstName} ${user.lastName}`)
      .departmentId(userRoles?.deptId ?? '')
      .levelId(userRoles?.levelId ?? '')
      .roleId(userRoles?.roleId)
      .zoneCodes(
        userZones
          .map((zone) => {
            return { [zone.zoneCode]: zone.subZonesCode };
          })
          .reduce((acc, curr) => Object.assign(acc, curr), {}),
      )
      .permissions(userPermissions.map((perm) => perm.code))
      .storeCode(storeCode)
      .build();

    return { token: this.generateJwtTokenUseCase.handler(generateJwtCommand) };
  }
}
