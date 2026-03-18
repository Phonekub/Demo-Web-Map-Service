import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthCheckController } from './inbound/controllers/healthCheck.controller';
import { AuthController } from './inbound/controllers/auth.controller';
import { JwtAuthStrategy } from './inbound/strategies/jwtAuth.strategy';
import { LocationController } from './inbound/controllers/location.controller';
import { UserController } from './inbound/controllers/user.controller';
import { ArcgisGateway } from './outbound/gateways/arcgis.gateway';
import PoiRepository from './outbound/repositories/poi.repository';
import UserRepository from './outbound/repositories/user.repository';
import { PoiEntity } from './outbound/repositories/entities/poi.entity';
import { PoiSevenElevenEntity } from './outbound/repositories/entities/sevenEleven.entity';
import { PoiVendingMachineEntity } from './outbound/repositories/entities/vendingMachine.entity';
import { AreaEntity } from './outbound/repositories/entities/area.entity';
import { UserEntity } from './outbound/repositories/entities/user.entity';
import ADCognitoGateway from './outbound/gateways/adCognito.gateway';
import { RoleController } from './inbound/controllers/role.controller';
import { MasterController } from './inbound/controllers/master.controller';
import { RoleRepository } from './outbound/repositories/role.repository';
import { MasterRepository } from './outbound/repositories/master.repository';
import { DepartmentEntity } from './outbound/repositories/entities/department.entity';
import { LevelEntity } from './outbound/repositories/entities/level.entity';
import { RoleEntity } from './outbound/repositories/entities/role.entity';
import { ZoneEntity } from './outbound/repositories/entities/zone.entity';
import { SubZoneEntity } from './outbound/repositories/entities/subzone.entity';
import { UserRoleEntity } from './outbound/repositories/entities/userrole.entity';
import { UserZoneEntity } from './outbound/repositories/entities/userzone.entity';
import { UserPermissionEntity } from './outbound/repositories/entities/userPermission.entity';
import { GeoLocationEntity } from './outbound/repositories/entities/geoLocation.entity';
import { CommonCodeEntity } from './outbound/repositories/entities/commonCode.entity';
import { BackupLocationEntity } from './outbound/repositories/entities/backupLocation.entity';
import { BackupLocationProfileEntity } from './outbound/repositories/entities/backupLocationProfile.entity';
import { BackupLocationProfilePoiEntity } from './outbound/repositories/entities/backupLocationProfilePoi.entity';
import { BackupLocationCompetitorEntity } from './outbound/repositories/entities/backupLocationCompetitor.entity';
import { BackupProfileController } from './inbound/controllers/backupProfile.controller';
import { BackupProfileRepository } from './outbound/repositories/backupProfile.repository';
import { DynamicFormController } from './inbound/controllers/dynamicForm.controller';
import { DynamicFormRepository } from './outbound/repositories/dynamicForm.repository';
import { DformEntity } from './outbound/repositories/entities/dform.entity';
import { DformConfigEntity } from './outbound/repositories/entities/dformConfig.entity';
import { DformVersionEntity } from './outbound/repositories/entities/dformVersion.entity';
import { DformFieldEntity } from './outbound/repositories/entities/dformField.entity';
import { DformValueEntity } from './outbound/repositories/entities/dformValue.entity';
import { DformTextEntity } from './outbound/repositories/entities/dformText.entity';
import { DformJsonbEntity } from './outbound/repositories/entities/dformJsonb.entity';

//workflow
import { WorkflowRepository } from './outbound/repositories/workflow.repository';
import { WfEntity } from './outbound/repositories/entities/wf.entity';
import { WfTransactionEntity } from './outbound/repositories/entities/wfTransaction.entity';
import { WfStepEntity } from './outbound/repositories/entities/wfStep.entity';
import { WfStatusEntity } from './outbound/repositories/entities/wfStatus.entity';
import { WfRouteEntity } from './outbound/repositories/entities/wfRoute.entity';
import { WfActionEntity } from './outbound/repositories/entities/wfAction.entity';
import { WfParameterEntity } from './outbound/repositories/entities/wfParameter.entity';
import { WfStepHistoryEntity } from './outbound/repositories/entities/wfStepHistory.entity';
import { WfEmailTemplateEntity } from './outbound/repositories/entities/wfEmailTemplate.entity';
import { WfEmailDetailEntity } from './outbound/repositories/entities/wfEmailDetail.entity';
import { PoiCompetitorEntity } from './outbound/repositories/entities/competitor.entity';
import { PoiPotentialEntity } from './outbound/repositories/entities/potential.entity';
import { ElementSevenElevenEntity } from './outbound/repositories/entities/elementSevenEleven.entity';
import { ElementVendingMachineEntity } from './outbound/repositories/entities/elementVendingMachine.entity';
import { PoiCompetitorSurroundEntity } from './outbound/repositories/entities/competitorSurround.entity';
import { LayerEntity } from './outbound/repositories/entities/layer.entity';
import { LayerRepository } from './outbound/repositories/layer.repository';
import { MailGateway } from './outbound/gateways/mail.gateway';
import { S3Gateway } from './outbound/gateways/s3.gateway';
import { PermissionGroupEntity } from './outbound/repositories/entities/permissionGroup.entity';
import { PermissionEntity } from './outbound/repositories/entities/permission.entity';
import { RolePermissionEntity } from './outbound/repositories/entities/rolePermission.entity';
import { RentalController } from './inbound/controllers/rental.controller';
import { PoiEntertainmentAreaEntity } from './outbound/repositories/entities/entertainmentArea.entity';
// Trade Area
import { TradeareaController } from './inbound/controllers/tradearea.controller';
import { TradeareaRepository } from './outbound/repositories/tradearea.repository';
import { TradeareaEntity } from './outbound/repositories/entities/tradearea.entity';
//export-report
import { ReportConfigEntity } from './outbound/repositories/entities/reportConfig.entity';
import { ReportFieldEntity } from './outbound/repositories/entities/reportField.entity';
import { ExcelExportGateway } from './outbound/gateways/exportReport.gateway';
import { QuotaExcelExportGateway } from './outbound/gateways/generateExcel.gateway';
import { ReportController } from '../adapter/inbound/controllers/report.controller';

import { TradeareaHistoryEntity } from './outbound/repositories/entities/tradeareaHistory.entity';
import { WorkflowEntity } from './outbound/repositories/entities/workflow.entity';
import { WorkflowStatusEntity } from './outbound/repositories/entities/workflowStatus.entity';
import { WorkflowStepEntity } from './outbound/repositories/entities/workflowStep.entity';
import { WorkflowStepHistoryEntity } from './outbound/repositories/entities/workflowStepHistory.entity';
import { WorkFlowTransactionEntity } from './outbound/repositories/entities/workflowTransaction.entity';
import { WorkflowController } from './inbound/controllers/workflow.controller';
// Quota Management
import { QuotaManagementController } from './inbound/controllers/quotaManagement.controller';
import { QuotaConfigRepository } from './outbound/repositories/quotaConfig.repository';
import { QuotaConfigEntity } from './outbound/repositories/entities/quotaConfig.entity';
import { QuotaAnnualTargetRepository } from './outbound/repositories/quotaAnnualTarget.repository';
import { QuotaAnnualTargetEntity } from './outbound/repositories/entities/quotaAnnualTarget.entity';
import { QuotaAllocationSearchRepository } from './outbound/repositories/quotaAllocationSearch.repository';
import { QuotaAllocationRepository } from './outbound/repositories/quotaAllocation.repository';
import { QuotaAllocationEntity } from './outbound/repositories/entities/quotaAllocation.entity';
import { QuotaRoundEntity } from './outbound/repositories/entities/quotaRound.entity';
import { QuotaRoundStatusEntity } from './outbound/repositories/entities/quotaRoundStatus.entity';
import { QuotaAllocationItemEntity } from './outbound/repositories/entities/quotaAllocationItem.entity';
import { QuotaAllocationItemLogEntity } from './outbound/repositories/entities/quotaAllocationItemLog.entity';
import { QuotaRoundRepository } from './outbound/repositories/quotaRound.repository';
// Import
import { ImportConfigEntity } from './outbound/repositories/entities/importConfig.entity';
import { ImportFieldEntity } from './outbound/repositories/entities/importField.entity';
import { ImportController } from './inbound/controllers/import.controller';
import { ImportRepository } from './outbound/repositories/import.repository';

import { MasterCpallZoneEntity } from './outbound/repositories/entities/masterCpallZone.entity';
import { PotentialController } from './inbound/controllers/potential.controller';
import { ProfileSubCodeEntity } from './outbound/repositories/entities/profileSubCode.entity';
import { ProfileSubCategoriesEntity } from './outbound/repositories/entities/profileSubCategories.entity';
import { ProfileCategoriesEntity } from './outbound/repositories/entities/profileCategories.entity';
import { TradeareaTypeEntity } from './outbound/repositories/entities/tradeareaType.entity';

import { QuotaReportRepository } from './outbound/repositories/quotaReport.repository';
import { GenerateSummaryExcelGateway } from './outbound/gateways/generateSummaryExcel.gateway';
import { QuotaReportOpenPlanEntity } from './outbound/repositories/entities/quotaReportOpenPlan.entity';
import { SevenProfileEntity } from './outbound/repositories/entities/sevenProfile.entity';
import { SevenInfoRepository } from './outbound/repositories/sevenInfo.repository';
import { SevenProfileController } from './inbound/controllers/sevenProfile.controller';
import { QuotaMailTemplateRepository } from './outbound/repositories/quotaMailTemplate.repository';
import { QuotaMailParametersRepository } from './outbound/repositories/quotaMailParameters.repository';
import { WfEmailParameterEntity } from './outbound/repositories/entities/wfEmailParameter.entity';
import { ImageEntity } from './outbound/repositories/entities/image.entity';
import { QuotaReportSiteImpactEntity } from './outbound/repositories/entities/quotaReportSiteImpact.entity';

import { StorePlanStandardEntity } from './outbound/repositories/entities/storePlanStandard.entity';
import { StorePlanStandardRepository } from './outbound/repositories/storePlanStandard.repository';
import { AnnounceEntity } from './outbound/repositories/entities/announce.entity';
import { AnnounceRoleEntity } from './outbound/repositories/entities/announceRole.entity';
import { AnnounceRepository } from './outbound/repositories/announce.repository';
import { DownloadFileDetailEntity } from './outbound/repositories/entities/downloadFileDetail.entity';
import { DownloadFileRoleEntity } from './outbound/repositories/entities/downloadFileRole.entity';
import { DownloadFileDetailRepository } from './outbound/repositories/downloadFileDetail.repository';
import { AnnounceRoleRepository } from './outbound/repositories/announceRole.repository';


@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      PoiEntity,
      PoiSevenElevenEntity,
      PoiCompetitorEntity,
      PoiCompetitorSurroundEntity,
      PoiVendingMachineEntity,
      PoiPotentialEntity,
      ElementSevenElevenEntity,
      ElementVendingMachineEntity,
      PoiEntertainmentAreaEntity,
      AreaEntity,
      UserEntity,
      DepartmentEntity,
      LevelEntity,
      RoleEntity,
      ZoneEntity,
      SubZoneEntity,
      UserRoleEntity,
      UserZoneEntity,
      UserPermissionEntity,
      GeoLocationEntity,
      CommonCodeEntity,
      BackupLocationEntity,
      BackupLocationProfileEntity,
      BackupLocationProfilePoiEntity,
      BackupLocationCompetitorEntity,
      DformEntity,
      DformConfigEntity,
      DformVersionEntity,
      DformFieldEntity,
      DformValueEntity,
      DformTextEntity,
      DformJsonbEntity,
      WfEntity,
      WfTransactionEntity,
      WfStepEntity,
      WfStatusEntity,
      WfRouteEntity,
      WfActionEntity,
      WfParameterEntity,
      WfStepHistoryEntity,
      WfEmailTemplateEntity,
      WfEmailDetailEntity,
      WfEmailParameterEntity,
      LayerEntity,
      TradeareaEntity,
      ReportConfigEntity,
      ReportFieldEntity,
      TradeareaHistoryEntity,
      TradeareaTypeEntity,
      WorkflowEntity,
      WorkflowStatusEntity,
      WorkflowStepEntity,
      WorkflowStepHistoryEntity,
      WorkFlowTransactionEntity,
      QuotaConfigEntity,
      QuotaAnnualTargetEntity,
      QuotaAllocationEntity,
      QuotaRoundEntity,
      QuotaRoundStatusEntity,
      QuotaAllocationItemEntity,
      QuotaAllocationItemLogEntity,
      ImportConfigEntity,
      ImportFieldEntity,
      PermissionGroupEntity,
      PermissionEntity,
      RolePermissionEntity,
      ProfileSubCodeEntity,
      ProfileSubCategoriesEntity,
      ProfileCategoriesEntity,
      MasterCpallZoneEntity,
      QuotaReportOpenPlanEntity,
      SevenProfileEntity,
      ImageEntity,
      StorePlanStandardEntity,
      AnnounceEntity,
      AnnounceRoleEntity,
      AnnounceEntity,
      DownloadFileDetailEntity,
      DownloadFileRoleEntity,
      QuotaReportSiteImpactEntity,
    ]),
    HttpModule,
    ConfigModule,
    PassportModule,
  ],
  controllers: [
    HealthCheckController,
    AuthController,
    LocationController,
    UserController,
    RoleController,
    MasterController,
    BackupProfileController,
    DynamicFormController,
    TradeareaController,
    ReportController,
    WorkflowController,
    QuotaManagementController,
    ImportController,
    PotentialController,
    RentalController,
    SevenProfileController,
  ],
  providers: [
    JwtAuthStrategy,
    {
      provide: 'PoiRepository',
      useClass: PoiRepository,
    },
    {
      provide: 'TradeareaRepository',
      useClass: TradeareaRepository,
    },
    {
      provide: 'UserRepository',
      useClass: UserRepository,
    },
    {
      provide: 'MapGateway',
      useClass: ArcgisGateway,
    },
    {
      provide: 'ADCognitoGateway',
      useClass: ADCognitoGateway,
    },
    {
      provide: 'RoleRepository',
      useClass: RoleRepository,
    },
    {
      provide: 'MasterRepository',
      useClass: MasterRepository,
    },
    {
      provide: 'BackupProfileRepository',
      useClass: BackupProfileRepository,
    },
    {
      provide: 'DynamicFormRepository',
      useClass: DynamicFormRepository,
    },
    {
      provide: 'WorkflowRepository',
      useClass: WorkflowRepository,
    },
    {
      provide: 'LayerRepository',
      useClass: LayerRepository,
    },
    {
      provide: 'TradeareaRepository',
      useClass: TradeareaRepository,
    },
    {
      provide: 'MailGateway',
      useClass: MailGateway,
    },
    {
      provide: 'QuotaConfigRepository',
      useClass: QuotaConfigRepository,
    },
    {
      provide: 'QuotaAnnualTargetRepository',
      useClass: QuotaAnnualTargetRepository,
    },
    {
      provide: 'QuotaMailTemplateRepository',
      useClass: QuotaMailTemplateRepository,
    },
    {
      provide: 'QuotaMailParametersRepository',
      useClass: QuotaMailParametersRepository,
    },
    {
      provide: 'QuotaAllocationSearchRepository',
      useClass: QuotaAllocationSearchRepository,
    },
    {
      provide: 'QuotaAllocationRepository',
      useClass: QuotaAllocationRepository,
    },
    {
      provide: 'ImportRepository',
      useClass: ImportRepository,
    },
    {
      provide: 'QuotaRoundRepository',
      useClass: QuotaRoundRepository,
    },
    {
      provide: 'ExcelExportGatewayPort',
      useClass: QuotaExcelExportGateway,
    },
    {
      provide: 'ExcelDynamicExportGatewayPort',
      useClass: ExcelExportGateway,
    },
    {

      provide: 'QuotaReportRepository',
      useClass: QuotaReportRepository,
    },
    {
      provide: 'ExcelSummaryExportGatewayPort',
      useClass: GenerateSummaryExcelGateway,
    },
    {
      provide: 'S3GatewayPort',
      useClass: S3Gateway,
    },
    {
      provide: 'StorePlanStandardRepository',
      useClass: StorePlanStandardRepository,
    },
    {
      provide: 'AnnounceRepository',
      useClass: AnnounceRepository,
    },
    {
      provide: 'AnnounceRoleRepository',
      useClass: AnnounceRoleRepository,
    },
    {
      provide: 'DownloadFileDetailRepository',
      useClass: DownloadFileDetailRepository,
    },
    {
      provide: 'StorePlanStandardRepository',
      useClass: StorePlanStandardRepository,
    },
    {
      provide: 'SevenInfoRepository',
      useClass: SevenInfoRepository,
    },
    {
      provide: 'QuotaAllocationRepositoryPort',
      useClass: QuotaAllocationRepository,
    },
  ],
  exports: [
    'MapGateway',
    'PoiRepository',
    'UserRepository',
    'ADCognitoGateway',
    'RoleRepository',
    'TradeareaRepository',
    // 'GeoLocationRepository',
    'BackupProfileRepository',
    'DynamicFormRepository',
    'MasterRepository',
    'LayerRepository',
    'WorkflowRepository',
    'MailGateway',
    'QuotaConfigRepository',
    'QuotaAnnualTargetRepository',
    'QuotaMailTemplateRepository',
    'QuotaMailParametersRepository',
    'QuotaAllocationSearchRepository',
    'QuotaAllocationRepository',
    'QuotaAllocationRepositoryPort',
    'ImportRepository',
    'QuotaRoundRepository',
    'ExcelExportGatewayPort',
    'ExcelDynamicExportGatewayPort',
    'QuotaReportRepository',
    'ExcelSummaryExportGatewayPort',
    'S3GatewayPort',
    'StorePlanStandardRepository',
    'AnnounceRepository',
    'AnnounceRoleRepository',
    'DownloadFileDetailRepository',

    'SevenInfoRepository',
  ],
})
export class AdapterModule {}
