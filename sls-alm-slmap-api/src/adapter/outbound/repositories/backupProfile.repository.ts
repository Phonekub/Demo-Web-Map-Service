import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BackupProfileRepositoryPort } from '../../../application/ports/backupProfile.repository';
import { BackupProfile } from '../../../domain/backupProfile';
import { BackupLocationEntity } from './entities/backupLocation.entity';
import { BackupLocationProfileEntity } from './entities/backupLocationProfile.entity';
import { BackupLocationProfilePoiEntity } from './entities/backupLocationProfilePoi.entity';
import { BackupLocationCompetitorEntity } from './entities/backupLocationCompetitor.entity';
import { BackupProfileMapper } from './mappers/backupProfile.mapper';

@Injectable()
export class BackupProfileRepository implements BackupProfileRepositoryPort {
  constructor(
    @InjectRepository(BackupLocationEntity)
    private readonly backupLocationModel: Repository<BackupLocationEntity>,

    @InjectRepository(BackupLocationProfileEntity)
    private readonly backupLocationProfileModel: Repository<BackupLocationProfileEntity>,

    @InjectRepository(BackupLocationProfilePoiEntity)
    private readonly backupLocationProfilePoiModel: Repository<BackupLocationProfilePoiEntity>,

    @InjectRepository(BackupLocationCompetitorEntity)
    private readonly backupLocationCompetitorModel: Repository<BackupLocationCompetitorEntity>,
  ) {}

  async getBackupProfileByPoiId(poiId: string): Promise<BackupProfile> {
    // Convert uid to poi_id first (assuming uid is from POI table)
    // Query main backup location by poi_id
    const poiIdNum = parseInt(poiId, 10);
    const backupLocation = await this.backupLocationModel
      .createQueryBuilder('bl')
      .where('bl.poi_id = :poiId', { poiId: poiIdNum })
      .getOne();

    if (!backupLocation) {
      throw new NotFoundException('ไม่พบ Backup Profile');
    }

    const backupLocationId = backupLocation.id;

    // 2. Query related profiles with profile layer name from profile_categories
    const profiles = await this.backupLocationProfileModel
      .createQueryBuilder('blp')
      .leftJoin('profile_categories', 'pc', 'pc.id = blp.profile_layer_id')
      .select([
        'blp.id as id',
        'blp.backup_location_id as "backupLocationId"',
        'blp.profile_layer_id as "profileLayerId"',
        'blp.backup_percentage as "backupPercentage"',
        'pc.category as "profileLayerName"',
      ])
      .where('blp.backup_location_id = :backupLocationId', { backupLocationId })
      .getRawMany();

    // 3. Query related profile POIs with POI name
    const profilePois = await this.backupLocationProfilePoiModel
      .createQueryBuilder('blpp')
      .leftJoin('poi', 'poi', 'poi.poi_id = blpp.poi_id')
      .select([
        'blpp.id as id',
        'blpp.backup_location_profile_id as "backupLocationProfileId"',
        'blpp.backup_location_id as "backupLocationId"',
        'blpp.poi_id as "poiId"',
        'blpp.profile_layer_id as "profileLayerId"',
        'blpp.distance as distance',
        'blpp.population_amount as "populationAmount"',
        'blpp.customer_amount as "customerAmount"',
        'blpp.percent_predict_customer as "percentPredictCustomer"',
        'poi.namt as "poiNamt"',
      ])
      .where('blpp.backup_location_id = :backupLocationId', { backupLocationId })
      .getRawMany();

    // 4. Query related competitors with competitor type name from common_code
    const competitors = await this.backupLocationCompetitorModel
      .createQueryBuilder('blc')
      .leftJoin(
        'common_code',
        'cc',
        "cc.code_type = 'COMPETITOR_TYPE' AND cc.code_mapping = CAST(blc.competitor_type AS VARCHAR)",
      )
      .leftJoin('poi_competitor', 'pc', 'pc.id = blc.competitor_id')
      .select([
        'blc.id as id',
        'blc.backup_location_id as "backupLocationId"',
        'blc.competitor_layer_id as "competitorLayerId"',
        'blc.competitor_id as "competitorId"',
        'blc.distance as distance',
        'blc.competitor_type as "competitorType"',
        'COALESCE(cc.code_name, CAST(blc.competitor_type AS VARCHAR)) as "competitorTypeName"',
        'pc.grade as grade',
        'pc.open_time as "openTime"',
        'pc.close_time as "closeTime"',
        'pc.sale_average as "saleAverage"',
      ])
      .where('blc.backup_location_id = :backupLocationId', { backupLocationId })
      .getRawMany();

    // 5. Map to domain
    return BackupProfileMapper.toDomain(
      backupLocation,
      profiles,
      profilePois,
      competitors,
    );
  }

  async findByUid(uid: string): Promise<BackupLocationEntity | null> {
    return await this.backupLocationModel
      .createQueryBuilder('bl')
      .where('bl.uid = :uid', { uid })
      .getOne();
  }

  async findByPoiId(poiId: number): Promise<BackupLocationEntity | null> {
    return await this.backupLocationModel
      .createQueryBuilder('bl')
      .where('bl.poi_id = :poiId', { poiId })
      .getOne();
  }

  async createBackupProfile(data: any): Promise<any> {
    // Build insert query with ST_GeomFromText for shape if provided
    let savedLocation: any;
    if (data.shape && data.shape !== null && data.shape !== 'null') {
      const result = await this.backupLocationModel
        .createQueryBuilder()
        .insert()
        .into(BackupLocationEntity)
        .values({
          poiLayerId: data.poiLayerId,
          poiId: data.poiId,
          formLocNumber: data.formLocNumber,
          zoneCode: data.zoneCode,
          backupColor: data.backupColor,
          backupColorLayer: data.backupColorLayer,
          isActive: data.isActive,
          mainProfile: data.mainProfile,
          subProfile: data.subProfile,
          areaSize: data.areaSize,
          backupRemark: data.backupRemark,
          strategicLocation: data.strategicLocation,
          strategicSupport: data.strategicSupport,
          strategicPlace: data.strategicPlace,
          strategicPlaceOther: data.strategicPlaceOther,
          strategicPlaceName: data.strategicPlaceName,
          strategicPlaceGuid: data.strategicPlaceGuid,
          strategicPosition: data.strategicPosition,
          strategicPositionOther: data.strategicPositionOther,
          strategicPositionName: data.strategicPositionName,
          strategicFloor: data.strategicFloor,
          strategicFloorOther: data.strategicFloorOther,
          strategicCustomerType: data.strategicCustomerType,
          strategicHousingType: data.strategicHousingType,
          strategicIndustrialEstateName: data.strategicIndustrialEstateName,
          streetFood: data.streetFood,
          createDate: data.createDate,
          createBy: data.createBy,
          shape: () => `ST_GeomFromText('${data.shape}', 4326)`,
        })
        .returning('*')
        .execute();
      savedLocation = result.raw[0];
    } else {
      const backupLocation = this.backupLocationModel.create({
        poiLayerId: data.poiLayerId,
        poiId: data.poiId,
        formLocNumber: data.formLocNumber,
        zoneCode: data.zoneCode,
        backupColor: data.backupColor,
        backupColorLayer: data.backupColorLayer,
        isActive: data.isActive,
        mainProfile: data.mainProfile,
        subProfile: data.subProfile,
        areaSize: data.areaSize,
        backupRemark: data.backupRemark,
        strategicLocation: data.strategicLocation,
        strategicSupport: data.strategicSupport,
        strategicPlace: data.strategicPlace,
        strategicPlaceOther: data.strategicPlaceOther,
        strategicPlaceName: data.strategicPlaceName,
        strategicPlaceGuid: data.strategicPlaceGuid,
        strategicPosition: data.strategicPosition,
        strategicPositionOther: data.strategicPositionOther,
        strategicPositionName: data.strategicPositionName,
        strategicFloor: data.strategicFloor,
        strategicFloorOther: data.strategicFloorOther,
        strategicCustomerType: data.strategicCustomerType,
        strategicHousingType: data.strategicHousingType,
        strategicIndustrialEstateName: data.strategicIndustrialEstateName,
        streetFood: data.streetFood,
        createDate: data.createDate,
        createBy: data.createBy,
      });
      savedLocation = await this.backupLocationModel.save(backupLocation);
    }

    const backupLocationId = savedLocation.id;

    // 3. Create related profiles if provided
    let profileIds: number[] = [];
    if (data.profiles && Array.isArray(data.profiles)) {
      const profiles = data.profiles.map((p: any) =>
        this.backupLocationProfileModel.create({
          backupLocationId: backupLocationId,
          profileLayerId: p.profileLayerId,
          backupPercentage: p.backupPercentage,
        }),
      );
      const savedProfiles = await this.backupLocationProfileModel.save(profiles);
      profileIds = savedProfiles.map((profile) => profile.id);
    }

    // 4. Create related profile POIs if provided
    if (data.profilePois && Array.isArray(data.profilePois)) {
      // Create a map of profileLayerId to saved profile ID
      const profileLayerIdMap = new Map<number, number>();
      data.profiles?.forEach((profile: any, index: number) => {
        profileLayerIdMap.set(profile.profileLayerId, profileIds[index]);
      });

      const profilePois = data.profilePois.map((pp: any) => {
        const backupLocationProfileId = profileLayerIdMap.get(pp.profileLayerId);
        return this.backupLocationProfilePoiModel.create({
          backupLocationProfileId: backupLocationProfileId,
          backupLocationId: backupLocationId,
          poiId: pp.poiId,
          profileLayerId: pp.profileLayerId,
          distance: pp.distance,
          populationAmount: pp.populationAmount,
          customerAmount: pp.customerAmount,
          percentPredictCustomer: pp.percentPredictCustomer,
        });
      });
      await this.backupLocationProfilePoiModel.save(profilePois);
    }

    // 5. Create related competitors if provided
    if (data.competitors && Array.isArray(data.competitors)) {
      const competitors = data.competitors.map((c: any) =>
        this.backupLocationCompetitorModel.create({
          backupLocationId: backupLocationId,
          competitorLayerId: c.competitorLayerId,
          competitorId: c.competitorId,
          distance: c.distance,
          competitorType: c.competitorType,
        }),
      );
      await this.backupLocationCompetitorModel.save(competitors);
    }

    return {
      id: backupLocationId,
      uid: savedLocation.uid,
      message: 'Backup profile created successfully',
    };
  }

  async updateBackupProfile(uid: string, data: any): Promise<any> {
    // 1. Find backup location by UID
    const backupLocation = await this.findByUid(uid);
    if (!backupLocation) {
      throw new NotFoundException('ไม่พบ Backup Profile');
    }

    // 2. Update main backup location fields
    await this.updateBackupLocationFields(backupLocation, data);

    const backupLocationId = backupLocation.id;

    // 3. Delete all related records
    await this.deleteRelatedRecords(backupLocationId);

    // 4. Insert new related profiles if provided
    let profileIds: number[] = [];
    if (data.profiles && Array.isArray(data.profiles)) {
      profileIds = await this.insertBackupLocationProfiles(
        backupLocationId,
        data.profiles,
      );
    }

    // 5. Insert new related profile POIs if provided
    if (data.profilePois && Array.isArray(data.profilePois)) {
      await this.insertBackupLocationProfilePois(
        backupLocationId,
        data.profilePois,
        profileIds,
      );
    }

    // 6. Insert new related competitors if provided
    if (data.competitors && Array.isArray(data.competitors)) {
      await this.insertBackupLocationCompetitors(backupLocationId, data.competitors);
    }

    return { id: backupLocationId, message: 'Backup profile updated successfully' };
  }

  private async updateBackupLocationFields(
    backupLocation: BackupLocationEntity,
    data: any,
  ): Promise<void> {
    // If shape is provided, use raw query with ST_GeomFromText
    if (data.shape && data.shape !== null && data.shape !== 'null') {
      await this.backupLocationModel
        .createQueryBuilder()
        .update(BackupLocationEntity)
        .set({
          poiLayerId: data.poiLayerId ?? backupLocation.poiLayerId,
          poiId: data.poiId ?? backupLocation.poiId,
          formLocNumber: data.formLocNumber ?? backupLocation.formLocNumber,
          zoneCode: data.zoneCode ?? backupLocation.zoneCode,
          shape: () => `ST_GeomFromText('${data.shape}', 4326)`,
          backupColor: data.backupColor ?? backupLocation.backupColor,
          backupColorLayer: data.backupColorLayer ?? backupLocation.backupColorLayer,
          isActive: data.isActive ?? backupLocation.isActive,
          mainProfile: data.mainProfile ?? backupLocation.mainProfile,
          subProfile: data.subProfile ?? backupLocation.subProfile,
          areaSize: data.areaSize ?? backupLocation.areaSize,
          backupRemark: data.backupRemark ?? backupLocation.backupRemark,
          strategicLocation: data.strategicLocation ?? backupLocation.strategicLocation,
          strategicSupport: data.strategicSupport ?? backupLocation.strategicSupport,
          strategicPlace: data.strategicPlace ?? backupLocation.strategicPlace,
          strategicPlaceOther:
            data.strategicPlaceOther ?? backupLocation.strategicPlaceOther,
          strategicPlaceName:
            data.strategicPlaceName ?? backupLocation.strategicPlaceName,
          strategicPlaceGuid:
            data.strategicPlaceGuid ?? backupLocation.strategicPlaceGuid,
          strategicPosition: data.strategicPosition ?? backupLocation.strategicPosition,
          strategicPositionOther:
            data.strategicPositionOther ?? backupLocation.strategicPositionOther,
          strategicPositionName:
            data.strategicPositionName ?? backupLocation.strategicPositionName,
          strategicFloor: data.strategicFloor ?? backupLocation.strategicFloor,
          strategicFloorOther:
            data.strategicFloorOther ?? backupLocation.strategicFloorOther,
          strategicCustomerType:
            data.strategicCustomerType ?? backupLocation.strategicCustomerType,
          strategicHousingType:
            data.strategicHousingType ?? backupLocation.strategicHousingType,
          strategicIndustrialEstateName:
            data.strategicIndustrialEstateName ??
            backupLocation.strategicIndustrialEstateName,
          streetFood: data.streetFood ?? backupLocation.streetFood,
          updateDate: data.updateDate,
          updateBy: data.updateBy,
        })
        .where('id = :id', { id: backupLocation.id })
        .execute();
    } else {
      // No shape update, use normal Object.assign
      Object.assign(backupLocation, {
        poiLayerId: data.poiLayerId ?? backupLocation.poiLayerId,
        poiId: data.poiId ?? backupLocation.poiId,
        formLocNumber: data.formLocNumber ?? backupLocation.formLocNumber,
        zoneCode: data.zoneCode ?? backupLocation.zoneCode,
        backupColor: data.backupColor ?? backupLocation.backupColor,
        backupColorLayer: data.backupColorLayer ?? backupLocation.backupColorLayer,
        isActive: data.isActive ?? backupLocation.isActive,
        mainProfile: data.mainProfile ?? backupLocation.mainProfile,
        subProfile: data.subProfile ?? backupLocation.subProfile,
        areaSize: data.areaSize ?? backupLocation.areaSize,
        backupRemark: data.backupRemark ?? backupLocation.backupRemark,
        strategicLocation: data.strategicLocation ?? backupLocation.strategicLocation,
        strategicSupport: data.strategicSupport ?? backupLocation.strategicSupport,
        strategicPlace: data.strategicPlace ?? backupLocation.strategicPlace,
        strategicPlaceOther:
          data.strategicPlaceOther ?? backupLocation.strategicPlaceOther,
        strategicPlaceName: data.strategicPlaceName ?? backupLocation.strategicPlaceName,
        strategicPlaceGuid: data.strategicPlaceGuid ?? backupLocation.strategicPlaceGuid,
        strategicPosition: data.strategicPosition ?? backupLocation.strategicPosition,
        strategicPositionOther:
          data.strategicPositionOther ?? backupLocation.strategicPositionOther,
        strategicPositionName:
          data.strategicPositionName ?? backupLocation.strategicPositionName,
        strategicFloor: data.strategicFloor ?? backupLocation.strategicFloor,
        strategicFloorOther:
          data.strategicFloorOther ?? backupLocation.strategicFloorOther,
        strategicCustomerType:
          data.strategicCustomerType ?? backupLocation.strategicCustomerType,
        strategicHousingType:
          data.strategicHousingType ?? backupLocation.strategicHousingType,
        strategicIndustrialEstateName:
          data.strategicIndustrialEstateName ??
          backupLocation.strategicIndustrialEstateName,
        streetFood: data.streetFood ?? backupLocation.streetFood,
        updateDate: data.updateDate,
        updateBy: data.updateBy,
      });

      await this.backupLocationModel.save(backupLocation);
    }
  }

  private async deleteRelatedRecords(backupLocationId: number): Promise<void> {
    // Delete all related records in order
    await this.backupLocationProfileModel.delete({ backupLocationId });
    await this.backupLocationProfilePoiModel.delete({ backupLocationId });
    await this.backupLocationCompetitorModel.delete({ backupLocationId });
  }

  private async insertBackupLocationProfiles(
    backupLocationId: number,
    profiles: any[],
  ): Promise<number[]> {
    const newProfiles = profiles.map((p: any) =>
      this.backupLocationProfileModel.create({
        backupLocationId,
        profileLayerId: p.profileLayerId,
        backupPercentage: p.backupPercentage,
      }),
    );
    const savedProfiles = await this.backupLocationProfileModel.save(newProfiles);
    return savedProfiles.map((profile) => profile.id);
  }

  private async insertBackupLocationProfilePois(
    backupLocationId: number,
    profilePois: any[],
    profileIds: number[],
  ): Promise<void> {
    // Get profiles to build profileLayerId map
    const profiles = await this.backupLocationProfileModel.find({
      where: { backupLocationId },
    });

    // Create a map of profileLayerId to profile ID
    const profileLayerIdMap = new Map<number, number>();
    profiles.forEach((profile) => {
      profileLayerIdMap.set(profile.profileLayerId, profile.id);
    });

    const newProfilePois = profilePois.map((pp: any) => {
      const backupLocationProfileId = profileLayerIdMap.get(pp.profileLayerId);
      return {
        backupLocationProfileId: backupLocationProfileId,
        backupLocationId,
        poiId: pp.poiId,
        profileLayerId: pp.profileLayerId,
        distance: pp.distance,
        populationAmount: pp.populationAmount,
        customerAmount: pp.customerAmount,
        percentPredictCustomer: pp.percentPredictCustomer,
      };
    });

    if (newProfilePois.length > 0) {
      await this.backupLocationProfilePoiModel
        .createQueryBuilder()
        .insert()
        .into(BackupLocationProfilePoiEntity)
        .values(newProfilePois)
        .execute();
    }
  }

  private async insertBackupLocationCompetitors(
    backupLocationId: number,
    competitors: any[],
  ): Promise<void> {
    const newCompetitors = competitors.map((c: any) =>
      this.backupLocationCompetitorModel.create({
        backupLocationId,
        competitorLayerId: c.competitorLayerId,
        competitorId: c.competitorId,
        distance: c.distance,
        competitorType: c.competitorType,
      }),
    );
    await this.backupLocationCompetitorModel.save(newCompetitors);
  }

  async getBackupLocationByPoiId(poiId: number): Promise<BackupLocationEntity> {
    return await this.backupLocationModel.findOne({
      where: {
        poiId,
      },
    });
  }

  async updateBackupLocationFormLocNumber(
    poiId: number,
    formLocNumber: string,
    updateBy: number,
  ): Promise<void> {
    await this.backupLocationModel
      .createQueryBuilder()
      .update(BackupLocationEntity)
      .set({
        formLocNumber,
        updateDate: new Date(),
        updateBy,
      })
      .where('poi_id = :poiId', { poiId })
      .execute();
  }
}
