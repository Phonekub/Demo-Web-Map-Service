import { Injectable, NotFoundException, Logger, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

// Mock data for development
const mockRentalLocationData = {
  formLocNumber: 'FL67025677',
  branchId: '23001',
  branchName: null,
  locationName: 'เทพสถิตชัยภูมิ',
  zoneCode: 'NEL',
  areaCode: '05',
  formLocType: '1',
  surveyName: 'ชญานิศวร์ วณิชเสฏฐภัทร์',
  surveyDate: '2024-04-03 00:00:00.0',
  surveyTel: '0910046878',
  locationType: '1',
  locationTypeCode: null,
  storeStatus: null,
  storeStatusType: null,
  relocateType: null,
  relocateFrom: null,
  businessType: null,
  businessSubType1: '0',
  businessSubType2: '0',
  businessSubType3: '0',
  businessSubType4: '0',
  locTarget: null,
  deedNumber: null,
  deedPropNo: null,
  deedFrontSurvey: null,
  addrNo: null,
  addrMoo: null,
  addrSoi: null,
  addrRoad: 'ทล.2354',
  addrSubDistrict: 'วะตะแบก',
  addrDistrict: '09',
  addrProvinceId: '36',
  addrPostCode: '36230',
  isBuilding: '1',
  bldFloor: '1',
  bldBlock: '6',
  bldWidth: '24',
  bldDepth: '16',
  bldTotalArea: '384',
  bldAreaUnit: '1',
  bldBack: '0',
  bldBackWidth: null,
  bldBackDepth: null,
  isLand: '0',
  landWidth: null,
  landDepth: null,
  landTotalArea: null,
  landAreaUnit: null,
  earningRate: '3',
  statusId: '190',
  commentSiteStatus: '290',
  waterStatus: '2',
  storeDesignAllow: 'Y',
  checkDiffFlag: 'N',
  createUser: 'ANUSITPIL',
  createDate: 1718354504000,
  updateUser: null,
  updateDate: 1748598316000,
  deleteFlag: 'N',
  deleteUser: null,
  deleteDate: null,
  offerLocNumber: null,
  storePttNumber: null,
  commentSiteNumber: 'CS2567-15061',
  formLocTypeInitial: '2',
  oldBusiness: null,
  wfVersionId: '1',
  ctsNumber: null,
  wfId: '1',
  appr1AvgCust: null,
  appr1AvgSale: '0',
  appr1AvgHead: null,
  responseUsername: null,
  waterNoteNumber: null,
  businessCode: null,
  latitude: '15.388682210915363',
  longitude: '101.44162778809203',
  forbidProductDetail: null,
  forbidType: '1',
  cigaretteIndicator: null,
  alcoholIndicator: null,
  formLocNumberMergeRef: null,
  deepNumber: null,
  deepPropNo: null,
  deepFrontSurvey: null,
  zoneName: null,
  areaName: null,
  zoneArea: null,
  canDelete: null,
  updateUserDesc: null,
  rentPeriod: null,
  rentRate: null,
  cashOther: null,
  utilityDetail: null,
  taxDetail: null,
  insuranceDetail: null,
  otherDetail: null,
  openDate: null,
  provinceName: 'ชัยภูมิ',
  districtName: 'เทพสถิต',
  createSystem: null,
  profileLocation: '2',
  profileLocationName: null,
  profileLocationType: null,
  username: null,
  populationProvince: '1137357',
  populationTambon: null,
  populationAmphur: '70497',
  maleProvince: '562900',
  maleTambon: null,
  maleAmphur: '35604',
  femaleProvince: '574457',
  femaleTambon: null,
  femaleAmphur: '34893',
  globalId: null,
  elementList: null,
  locationTypeName: null,
};

@Injectable()
export class GetLocationFromRentalUseCase {
  private readonly logger = new Logger(GetLocationFromRentalUseCase.name);
  private readonly rentalApiUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.rentalApiUrl = this.configService.get<string>(
      'RENTAL_API_URL',
      'https://sertsaptt01.cpall.co.th:8443/rental',
    );
  }

  async handler(fl: string): Promise<any> {
    if (!fl) {
      throw new NotFoundException('Form Location Number is required');
    }

    if (!this.rentalApiUrl) {
      throw new Error('RENTAL_API_URL is not configured');
    }

    try {
      const url = `${this.rentalApiUrl}/RentalService/rest/formloc/${encodeURIComponent(fl)}`;
      this.logger.log(`Fetching rental location from: ${url}`);
      const response = await this.httpService.get(url, { timeout: 30000 }).toPromise();
      const apiResponse = response.data;
      const data = apiResponse.result || {};
      this.logger.log(`Rental API response: ${JSON.stringify(apiResponse)}`);
      // Map the API 'result' property to the mock format (fallback to empty/null if missing)
      return data;
    } catch (error) {
      this.logger.error(`Failed to fetch rental location: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to fetch rental location: ${error.message}`);
    }
  }
}
