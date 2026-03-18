import { Injectable, Inject, Logger } from '@nestjs/common';
import { PoiRepositoryPort } from '../../ports/poi.repository';
import { UserRepositoryPort } from '../../ports/user.repository';
import { BackupProfileRepositoryPort } from '../../ports/backupProfile.repository';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { PotentialStatus } from '@common/enums/potential.enum';

export interface CreateRentalFormLocPayload {
  poiId: number;
  updateUserId: number;
  approvalAction: string;
}

export interface RentalFormLocRequest {
  zone: string;
  zoneArea: string;
  processType: string;
  updateUser: string;
  nameThai: string;
  objectId: string;
  backupType: string;
  backupTypeName: string;
  approveStatus: string;
  locationType: string;
  locationTypeCode: string; // Required for workflow lookup
  wfId?: string;
  wfVersionId?: string;
  statusId?: string;
  roleDept: string;
  wfStepDisable: string;
  statusDisable: string;
  provCode: string;
  ampCode: string;
  tamNamT: string;
  tradeArea: string;
  buildingType: string;
  globalId: string;
  populationProvince: number;
  populationTambol: number;
  populationAmphur: number;
  maleProvince: number;
  femaleProvince: number;
  maleAmphur: number;
  femaleAmphur: number;
  maleTambol: number;
  femaleTambol: number;
  latitude: string;
  longitude: string;
  cigaretteIndicator: string;
  alcoholIndicator: string;
  addrSubDistrict: string;
  addrDistrict: string;
  addrProvinceId: string;
  nation: string;
  locationName: string;
  zoneCode: string;
  areaCode: string;
  createUser: string;
  populationTambon: number;
  femaleTambon: number;
  maleTambon: number;
  elementList: Array<{
    elementType: string;
    elementName: string;
    branchId: string;
    branchName: string;
    flowStatus: string;
    globalId: string;
    lineup: string;
  }>;
  profileLocation: string;
  storePttNumber?: string; // Optional PTT store number
}

@Injectable()
export class CreateRentalFormLocUseCase {
  private readonly logger = new Logger(CreateRentalFormLocUseCase.name);
  private readonly rentalApiUrl: string;

  constructor(
    @Inject('PoiRepository')
    private readonly poiRepository: PoiRepositoryPort,
    @Inject('UserRepository')
    private readonly userRepository: UserRepositoryPort,
    @Inject('BackupProfileRepository')
    private readonly backupProfileRepository: BackupProfileRepositoryPort,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.rentalApiUrl = this.configService.get<string>(
      'RENTAL_API_URL',
      'https://sertsaptt01.cpall.co.th:8443/rental',
    );
  }

  async handler(payload: CreateRentalFormLocPayload): Promise<{
    success: boolean;
    message?: string;
    error?: any;
  }> {
    const { poiId, updateUserId, approvalAction } = payload;

    try {
      // Get username from user repository
      const user = await this.userRepository.findById(updateUserId);
      const username = user?.username || updateUserId.toString();

      // Get POI detail
      const poiDetail = await this.poiRepository.findPoiDetailById(poiId);

      if (!poiDetail || !poiDetail.potentialStore) {
        return {
          success: false,
          message: 'POI or Potential Store not found',
        };
      }

      const { poi, potentialStore, sevenEleven, vendingMachine } = poiDetail;

      // Get population data
      const populationData = await this.poiRepository.getPopulationByPoiId(poiId);

      // Extract coordinates from POINT format: "POINT (lng lat)"
      let longitude = 0;
      let latitude = 0;

      if (poi.shape && typeof poi.shape === 'object' && !Array.isArray(poi.shape)) {
        // If shape is GeoJSON format
        const shapeObj = poi.shape as any;
        if ('coordinates' in shapeObj && Array.isArray(shapeObj.coordinates)) {
          [longitude, latitude] = shapeObj.coordinates;
        }
      }

      // Map approval action to approveStatus
      const approveStatusMap: Record<string, string> = {
        APPROVE: '2',
        NOT_APPROVE: '3',
        REJECT: '4',
      };
      const approveStatus = approveStatusMap[approvalAction] || '2';

      // Build element list
      const elementList: RentalFormLocRequest['elementList'] = [];

      if (sevenEleven) {
        elementList.push({
          elementType: '7-11',
          elementName: sevenEleven.name || poi.namt || '',
          branchId: sevenEleven.storeCode || '00000',
          branchName: sevenEleven.name || '',
          flowStatus: '0',
          globalId: potentialStore.uid || '',
          lineup: '2',
        });
      }

      if (vendingMachine) {
        elementList.push({
          elementType: 'Vending',
          elementName: poi.namt || '',
          branchId: vendingMachine.storecode || '00000',
          branchName: '',
          flowStatus: '0',
          globalId: potentialStore.uid || '',
          lineup: '2',
        });
      }

      // Map locationType text to code (1-3)
      let locationTypeCode = '1'; // Default
      if (potentialStore.locationType) {
        const locationTypeMap: Record<string, string> = {
          ทำเลทั่วไป: '1',
          ทำเลพิเศษ: '2',
          ทำเลปั๊ม: '3',
        };
        locationTypeCode = locationTypeMap[potentialStore.locationType] || '1';
      }

      // Build rental request
      const rentalRequest: RentalFormLocRequest = {
        zone: poi.zoneCode || '',
        zoneArea: poi.subzoneCode || '',
        processType: '1',
        updateUser: username,
        nameThai: poi.namt || '',
        objectId: poi.poiId.toString(),
        backupType: '1',
        backupTypeName: 'เตรียมศักยภาพ',
        approveStatus: approveStatus,
        locationType: locationTypeCode,
        locationTypeCode: locationTypeCode, // Required for LOCATION_TYPE_WF lookup
        roleDept: 'Location',
        wfStepDisable: '105',
        statusDisable: '100',
        provCode: poi.provCode || '',
        ampCode: poi.ampCode || '',
        tamNamT: poi.tamCode || '',
        tradeArea: potentialStore.areaType || '3',
        buildingType: '2',
        globalId: potentialStore.uid || '',
        populationProvince: populationData?.populationProvince || 0,
        populationTambol: populationData?.populationTambol || 0,
        populationAmphur: populationData?.populationAmphur || 0,
        maleProvince: populationData?.maleProvince || 0,
        femaleProvince: populationData?.femaleProvince || 0,
        maleAmphur: populationData?.maleAmphur || 0,
        femaleAmphur: populationData?.femaleAmphur || 0,
        maleTambol: populationData?.maleTambol || 0,
        femaleTambol: populationData?.femaleTambol || 0,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        cigaretteIndicator: potentialStore.canSaleCigarette === 'Y' ? '1' : '2', // 1 = ขายได้, 2 = ไม่สามารถขาย
        alcoholIndicator: potentialStore.canSaleAlcohol === 'Y' ? '1' : '2', // 1 = ขายได้, 2 = ไม่สามารถขาย
        addrSubDistrict:
          populationData?.tamName || (poi.tamCode || '').replace(/^TH/i, ''),
        addrDistrict: (poi.ampCode || '').replace(/^TH/i, ''),
        addrProvinceId: (poi.provCode || '').replace(/^TH/i, ''),
        nation: poi.nation || 'TH',
        locationName: poi.namt || '',
        zoneCode: poi.zoneCode || '',
        areaCode: poi.subzoneCode || '',
        createUser: username,
        populationTambon: populationData?.populationTambol || 0,
        femaleTambon: populationData?.femaleTambol || 0,
        maleTambon: populationData?.maleTambol || 0,
        elementList: elementList,
        profileLocation: '2',
      };

      // Send to rental API
      this.logger.log(
        `Sending data to Rental API: ${this.rentalApiUrl}/RentalService/rest/formLoc/createFormLoc`,
      );
      this.logger.log(
        `POI ID: ${poiId}, Action: ${approvalAction}, Elements: ${elementList.length}`,
      );
      this.logger.log(
        `Request data summary: objectId=${rentalRequest.objectId}, globalId=${rentalRequest.globalId}, locationType=${rentalRequest.locationType}, locationTypeCode=${rentalRequest.locationTypeCode}`,
      );
      this.logger.log(
        `Population data: Province=${rentalRequest.populationProvince}, Amphur=${rentalRequest.populationAmphur}, Tambol=${rentalRequest.populationTambol}`,
      );
      this.logger.log(
        `Coordinates: lat=${rentalRequest.latitude}, lng=${rentalRequest.longitude}`,
      );
      this.logger.log(
        `Codes: zone=${rentalRequest.zone}, zoneArea=${rentalRequest.zoneArea}, prov=${rentalRequest.provCode}, amp=${rentalRequest.ampCode}, tam=${rentalRequest.tamNamT}`,
      );

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.rentalApiUrl}/RentalService/rest/formLoc/createFormLoc`,
          rentalRequest,
          {
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
            },
            timeout: 30000,
          },
        ),
      );

      this.logger.log(`Rental API response: ${JSON.stringify(response.data)}`);

      // Parse response and update formLocNumber if successful
      if (response.data?.code === '200' && response.data?.result) {
        try {
          const resultData = JSON.parse(response.data.result);
          if (resultData.formLocNumber) {
            this.logger.log(
              `Updating formLocNumber: ${resultData.formLocNumber} for POI ID: ${poiId}`,
            );
            await this.poiRepository.updatePotentialStoreFormLocNumber(
              poiId,
              PotentialStatus.APPROVED, // Update status to '03' (รออนุมัติ) when formLocNumber is assigned
              resultData.formLocNumber,
            );
            this.logger.log(`Successfully updated formLocNumber in potential_store`);

            // Update backup_location form_loc_number as well
            try {
              await this.backupProfileRepository.updateBackupLocationFormLocNumber(
                poiId,
                resultData.formLocNumber,
                updateUserId,
              );
              this.logger.log(`Successfully updated formLocNumber in backup_location`);
            } catch (backupError) {
              this.logger.warn(
                `Failed to update formLocNumber in backup_location: ${backupError.message}`,
              );
            }

            // Update element numbers if available
            if (
              resultData.elementList &&
              Array.isArray(resultData.elementList) &&
              potentialStore.id
            ) {
              for (const element of resultData.elementList) {
                if (element.elementNumber) {
                  if (element.elementType === '7-11' && sevenEleven) {
                    this.logger.log(
                      `Updating Seven-Eleven elementNumber: ${element.elementNumber}`,
                    );
                    await this.poiRepository.updateSevenElevenElementNumber(
                      potentialStore.id,
                      element.elementNumber,
                    );
                  } else if (element.elementType === 'Vending' && vendingMachine) {
                    this.logger.log(
                      `Updating Vending Machine elementNumber: ${element.elementNumber}`,
                    );
                    await this.poiRepository.updateVendingMachineElementNumber(
                      potentialStore.id,
                      element.elementNumber,
                    );
                  }
                }
              }
              this.logger.log(`Successfully updated element numbers`);
            }
          }
        } catch (parseError) {
          this.logger.warn(
            `Failed to parse rental API result or update formLocNumber: ${parseError.message}`,
          );
        }
      }

      return {
        success: true,
        message: 'Successfully sent data to Rental API',
      };
    } catch (error) {
      this.logger.error(`Failed to send data to Rental API: ${error.message}`);

      // Log detailed error information
      if (error.response) {
        this.logger.error(`Response status: ${error.response.status}`);
        this.logger.error(`Response data: ${JSON.stringify(error.response.data)}`);

        // Log specific error description if available
        if (error.response.data?.description) {
          this.logger.error(`Error description: ${error.response.data.description}`);
        }
        if (error.response.data?.code) {
          this.logger.error(`Error code: ${error.response.data.code}`);
        }
      }

      // Return detailed error information
      const errorData = error.response?.data;
      return {
        success: false,
        message:
          errorData?.description || error.message || 'Failed to send data to Rental API',
        error: errorData || error.message,
      };
    }
  }
}
