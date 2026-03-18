import { Builder } from 'builder-pattern';
import { BackupLocationEntity } from '../entities/backupLocation.entity';
import { BackupLocationProfileEntity } from '../entities/backupLocationProfile.entity';
import { BackupLocationProfilePoiEntity } from '../entities/backupLocationProfilePoi.entity';
import { BackupLocationCompetitorEntity } from '../entities/backupLocationCompetitor.entity';
import {
  BackupProfile,
  BackupLocationProfile,
  BackupLocationProfilePoi,
  BackupLocationCompetitor,
} from '../../../../domain/backupProfile';

export class BackupProfileMapper {
  static toDomain(
    entity: BackupLocationEntity,
    profiles: any[] | BackupLocationProfileEntity[],
    profilePois: any[] | BackupLocationProfilePoiEntity[],
    competitors: any[] | BackupLocationCompetitorEntity[],
  ): BackupProfile {
    return Builder(BackupProfile)
      .id(entity.id)
      .uid(entity.uid)
      .poiLayerId(entity.poiLayerId)
      .poiId(entity.poiId)
      .formLocNumber(entity.formLocNumber)
      .zoneCode(entity.zoneCode)
      .shape(entity.shape)
      .backupColor(entity.backupColor)
      .backupColorLayer(entity.backupColorLayer)
      .isActive(entity.isActive)
      .mainProfile(entity.mainProfile)
      .subProfile(entity.subProfile)
      .areaSize(entity.areaSize)
      .backupRemark(entity.backupRemark)
      .strategicLocation(entity.strategicLocation)
      .strategicSupport(entity.strategicSupport)
      .strategicPlace(entity.strategicPlace)
      .strategicPlaceOther(entity.strategicPlaceOther)
      .strategicPlaceName(entity.strategicPlaceName)
      .strategicPlaceGuid(entity.strategicPlaceGuid)
      .strategicPosition(entity.strategicPosition)
      .strategicPositionOther(entity.strategicPositionOther)
      .strategicPositionName(entity.strategicPositionName)
      .strategicFloor(entity.strategicFloor)
      .strategicFloorOther(entity.strategicFloorOther)
      .strategicCustomerType(entity.strategicCustomerType)
      .strategicHousingType(entity.strategicHousingType)
      .strategicIndustrialEstateName(entity.strategicIndustrialEstateName)
      .streetFood(entity.streetFood)
      .createDate(entity.createDate)
      .createBy(entity.createBy)
      .updateDate(entity.updateDate)
      .updateBy(entity.updateBy)
      .profiles(profiles.map((p) => this.profileToDomain(p)))
      .profilePois(profilePois.map((pp) => this.profilePoiToDomain(pp)))
      .competitors(competitors.map((c) => this.competitorToDomain(c)))
      .build();
  }

  static profileToDomain(
    entity: any | BackupLocationProfileEntity,
  ): BackupLocationProfile {
    return Builder(BackupLocationProfile)
      .id(entity.id)
      .backupLocationId(entity.backupLocationId)
      .profileLayerId(entity.profileLayerId)
      .backupPercentage(entity.backupPercentage)
      .profileLayerName(entity.profileLayerName)
      .build();
  }

  static profilePoiToDomain(
    entity: any | BackupLocationProfilePoiEntity,
  ): BackupLocationProfilePoi {
    return Builder(BackupLocationProfilePoi)
      .id(entity.id)
      .backupLocationProfileId(entity.backupLocationProfileId)
      .backupLocationId(entity.backupLocationId)
      .poiId(entity.poiId)
      .profileLayerId(entity.profileLayerId)
      .distance(entity.distance)
      .populationAmount(entity.populationAmount)
      .customerAmount(entity.customerAmount)
      .percentPredictCustomer(entity.percentPredictCustomer)
      .poiNamt(entity.poiNamt)
      .build();
  }

  static competitorToDomain(
    entity: any | BackupLocationCompetitorEntity,
  ): BackupLocationCompetitor {
    return Builder(BackupLocationCompetitor)
      .id(entity.id)
      .backupLocationId(entity.backupLocationId)
      .competitorLayerId(entity.competitorLayerId)
      .competitorId(entity.competitorId)
      .distance(entity.distance)
      .competitorType(entity.competitorType)
      .competitorTypeName(entity.competitorTypeName)
      .grade(entity.grade)
      .openTime(entity.openTime)
      .closeTime(entity.closeTime)
      .saleAverage(entity.saleAverage)
      .build();
  }
}
