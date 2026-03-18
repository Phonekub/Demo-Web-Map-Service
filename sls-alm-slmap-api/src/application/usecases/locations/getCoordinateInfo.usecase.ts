import { Inject, Injectable } from '@nestjs/common';
import * as _ from 'lodash';
import { PoiRepositoryPort } from 'src/application/ports/poi.repository';
import { MasterRepositoryPort } from '../../ports/master.repository';
import { userZoneAndSubZoneAuthorization } from '../../../common/helpers/user.helper';

export interface GetCoordinateInfoResult {
  zoneAuthorized: boolean;
  zone: string;
  subzone: string;
  subDistrict: {
    text: string;
    code: string;
  };
  district: {
    text: string;
    code: string;
  };
  province: {
    text: string;
    code: string;
  };
}

@Injectable()
export class GetCoordinateInfoUseCase {
  constructor(
    @Inject('PoiRepository')
    private readonly poiRepository: PoiRepositoryPort,
    @Inject('MasterRepository')
    private readonly masterRepository: MasterRepositoryPort,
  ) {}

  async handler(
    userZoneCodes: Record<string, string[]>,
    latitude: number,
    longitude: number,
  ): Promise<GetCoordinateInfoResult | null> {
    const subDistrict = await this.masterRepository.getSubDistricts({
      coordinate: { latitude, longitude },
    });

    if (_.isEmpty(subDistrict)) {
      return null;
    }

    const subDistrictCode = subDistrict[0].value as string;

    const district = await this.masterRepository.getOneDistrict(
      subDistrictCode.slice(0, 6),
    );

    if (_.isNull(district)) {
      return null;
    }

    const province = await this.masterRepository.getOneProvince(
      subDistrictCode.slice(0, 4),
    );

    if (_.isNull(province)) {
      return null;
    }

    const poiZone = await this.poiRepository.findZoneAndSubZoneByCoordinate(
      latitude,
      longitude,
    );

    if (_.isNull(poiZone)) {
      return null;
    }

    const zoneAuthorized = userZoneAndSubZoneAuthorization(userZoneCodes, {
      zoneCode: poiZone.zone,
      subzoneCode: poiZone.subzone,
    });

    return {
      zoneAuthorized,
      zone: poiZone.zone,
      subzone: poiZone.subzone,
      subDistrict: {
        text: subDistrict[0].text,
        code: subDistrictCode,
      },
      district: {
        text: district.text,
        code: district.value as string,
      },
      province: {
        text: district.text,
        code: district.value as string,
      },
    };
  }
}
