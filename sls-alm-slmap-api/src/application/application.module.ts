import { HttpModule } from '@nestjs/axios';
import { Get, Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GenerateJwtTokenUseCase } from './usecases/generateJwtToken.usecase';
import { JwtModule } from '@nestjs/jwt';
import { FindStoreLocationUseCase } from './usecases/locations/findStoreLocation.usecase';
import { SearchPoiUseCase } from './usecases/locations/searchPoi.usecase';
import { SpatialSearchUseCase } from './usecases/locations/spatialSearch.usecase';
import { SearchNearbySevenUseCase } from './usecases/locations/searchNearbySeven.usecase';
import { SearchNearbyCompetitorUseCase } from './usecases/locations/searchNearbyCompetitor.usecase';
import { SearchNearbyEntertainmentAreaUseCase } from './usecases/locations/searchNearbyEntertainmentArea.usecase';
import { SearchCompetitorSurroundUseCase } from './usecases/locations/searchCompetitorSurround.usecase';
import { UpsertPoiAreaUseCase } from './usecases/locations/upsertPoiArea.usecase';
import { CreatePoiUseCase } from './usecases/locations/createPoi.usecase';
import { UpdatePoiUseCase } from './usecases/locations/updatePoi.usecase';
import { GenerateAdURLUseCase } from './usecases/auth/generateAdURL.usecase';
import { OAuth2CallbackUseCase } from './usecases/auth/oauth2Callback.usecase';
import { FindAllUserUseCase } from './usecases/users/findAllUser.usecase';
import { GetAllDepartmentUseCase } from './usecases/role/getAllDepartment.usecase';
import { GetAllLevelsUseCase } from './usecases/role/getAllLevels.usecase';
import { GetAllZonesUseCase } from './usecases/role/getAllZones.usecase';
import { GetAllRolesUseCase } from './usecases/role/getAllRoles.usecase';
import { UpdateUserUseCase } from './usecases/users/updateUser.usecase';
import { GetUserRoleUseCase } from './usecases/users/getUserRole.usecase';
import { GetUserZonesUseCase } from './usecases/users/getUserZones.usecase';
import { GetUserSubZonesUseCase } from './usecases/users/getUserSubZones.usecase';
import { GetProvincesUseCase } from './usecases/master/getProvinces.usecase';
import { GetDistrictsUseCase } from './usecases/master/getDistricts.usecase';
import { GetSubDistrictsUseCase } from './usecases/master/getSubDistricts.usecase';
import { GetBackupProfileUseCase } from './usecases/backupProfile/getBackupProfile.usecase';
import { SaveBackupProfileUseCase } from './usecases/backupProfile/saveBackupProfile.usecase';
import { GetDynamicFormUseCase } from './usecases/dynamicForm/getDynamicForm.usecase';
import { GetFormByReferenceUseCase } from './usecases/dynamicForm/getFormByReference.usecase';
import { GetBlankDynamicFormUseCase } from './usecases/dynamicForm/getBlankDynamicForm.usecase';
import { GetBlankDynamicFormBySubcodeUseCase } from './usecases/dynamicForm/getBlankDynamicFormBySubcode.usecase';
import { SaveDynamicFormUseCase } from './usecases/dynamicForm/saveDynamicForm.usecase';

// Trade Area Use Cases
import { GetAllTradeareaUseCase } from './usecases/tradearea/getAllTradearea.usecase';
import { GetTradeareaByIdUseCase } from './usecases/tradearea/getTradeareaById.usecase';
import { GetTradeareaByStoreCodeUseCase } from './usecases/tradearea/getTradeareaByStoreCode.usecase';
import { GetTradeareaByZoneUseCase } from './usecases/tradearea/getTradeareaByZone.usecase';
import { GetTradeareaBySubzoneUseCase } from './usecases/tradearea/getTradeareaBySubzone.usecase';
import { CheckPointInTradeareaUseCase } from './usecases/tradearea/checkPointInTradearea.usecase';
import { CreateTradeareaUseCase } from './usecases/tradearea/createTradearea.usecase';
import { UpdateTradeareaUseCase } from './usecases/tradearea/updateTradearea.usecase';
import { CheckOverlapUseCase } from './usecases/tradearea/checkOverlap.usecase';
import { GetTradeareasPendingApprovalUseCase } from './usecases/tradearea/getTradeareasPendingApproval.usecase';
import { GetCommonCodeUseCase } from './usecases/master/getCommonCode.usecase';
//workflow usecase
import { GetCurrentWorkflowStepUseCase } from './usecases/workflow/getCurrentWorkflowStep.usecase';
import { GetWorkflowHistoryUseCase } from './usecases/workflow/getWorkflowHistory.usecase';
import { GetWorkflowStatusesUseCase } from './usecases/workflow/getWorkflowStatuses.usecase';
import { GetWorkflowStepsUseCase } from './usecases/workflow/getWorkflowSteps.usecase';
import { UpdateWfStepOwnerUseCase } from './usecases/workflow/updateWfStepOwner.usecase';
import { CreateWorkflowTransactionUseCase } from './usecases/workflow/createWorkflowTransaction.usecase';
import { WorkflowApprovalUseCase } from './usecases/workflow/workflowApproval.usecase';
import { WorkflowSendMailUseCase } from './usecases/workflow/workflowSendMail.usecase';
import { GetLayersUseCase } from './usecases/master/getLayers.usecase';
import { SubmitTradeareaApprovalUseCase } from './usecases/tradearea/submitTradeareaApproval.usecase';
import { GetPermissionsUseCase } from './usecases/master/getPermissions.usecase';
import { FindPoiTradeareaUseCase } from './usecases/tradearea/findPoiTradearea.usecase';
import { UpdateTradeareaApproveUseCase } from './usecases/tradearea/updateTradeareaApprove.usecase';

import { GetTradeareaConfigsUseCase } from './usecases/master/getExportConfigs.usecase';
import { ExportReportUseCase } from './usecases/exportReport/exportReport.usecase';

import { GetZonesUseCase } from './usecases/master/getZones.usecase';
// Quota Use Cases
import { GetYearConfigsUseCase } from './usecases/quota/getYearConfigs.usecase';
import { GetZoneAnnualTargetsByYearUseCase } from './usecases/quota/getZoneAnnualTargetsByYear.usecase';
import { SaveAnnualQuotaUseCase } from './usecases/quota/saveAnnualQuota.usecase';
import { ExportAnnualQuotaUseCase } from './usecases/quota/exportAnnualQuota.usecase';
import { GetQuotaAllocationDetailUseCase } from './usecases/quota/getQuotaAllocationDetail.usecase';
import { SaveLocationSelectionUseCase } from './usecases/quota/saveLocationSelection.usecase';
import { GetItemHistoryUseCase } from './usecases/quota/getItemHistory.usecase';
import { GetSevenInfoByStorecodeUseCase } from './usecases/locations/getSevenInfoByStorecode.usecase';
import { SearchQuotaAllocationUseCase } from './usecases/quota/searchQuotaAllocation.usecase';
import { GetAllocationHistoryUseCase } from './usecases/quota/getAllocationHistory.usecase';
import { GetQuotaRoundsUseCase } from './usecases/quota/getQuotaRounds.usecase';
import { ApproveSelectedUseCase } from './usecases/quota/approveSelected.usecase';
import { RejectSelectedUseCase } from './usecases/quota/rejectSelected.usecase';
import { ProcessAllocationActionUseCase } from './usecases/quota/processAllocationAction.usecase';
import { QuotaAllocationWorkflowService } from './usecases/quota/helpers/quotaAllocationWorkflow.service';
// Import Use Cases
import { GetImportConfigUseCase } from './usecases/master/getImportConfig.usecase';
import { ImportFileUseCase } from './usecases/import/importFile.usecase';

import { GetQuotaConfigUseCase } from '../application/usecases/quotaRound/getQuotaConfig.usecase';
import { GetRoundWithAllosUseCase } from '../application/usecases/quotaRound/getRoundWithAllos.usecase';
import { CreateRoundUseCase } from '../application/usecases/quotaRound/createRound.usecase';
import { UpdateRoundUsecase } from '../application/usecases/quotaRound/updateRound.usecase';
import { DeleteRoundUseCase } from './usecases/quotaRound/deleteRound.usecase';
import { SubmitRoundByZoneUseCase } from './usecases/quotaRound/submitRoundByZone.usecase';
import { SubmitQuotaRoundAllZonesUseCase } from './usecases/quotaRound/submitQuotaRoundAllZones.usecase';
import { CloseQuotaConfigUseCase } from './usecases/quotaRound/closeQuotaConfig.usecase';
import { SubmitReviewRoundsByZoneUseCase } from './usecases/quotaRound/submitReviewRoundsByZone.usecase';
import { SubmitReviewRoundsAllZonesUseCase } from './usecases/quotaRound/submitReviewRoundAll.usecase';

import { GetAllPermissionGroupsUseCase } from './usecases/role/getAllPermissionGroups.usecase';
import { GetRolePermissionsUseCase } from './usecases/role/getRolePermissions.usecase';
import { UpdateRolePermissionsUseCase } from './usecases/role/updateRolePermissions.usecase';
import { CreateRoleUseCase } from './usecases/role/createRole.usecase';
import { SearchRolesUseCase } from './usecases/role/searchRoles.usecase';
import { GetCoordinateInfoUseCase } from './usecases/locations/getCoordinateInfo.usecase';
import { GetPoiByIdUseCase } from './usecases/locations/getPoiById.usecase';
import { ApprovePotentialUsecase } from './usecases/potential/approvePotential.usecase';
import { FindPotentialStatusUsecase } from './usecases/potential/findPotentialStatus.usecase';
import { GetPendingApprovalPotentialsUseCase } from './usecases/potential/getPendingApprovalPotentials.usecase';
import { GetPotentialDetailUseCase } from './usecases/potential/getPotentialDetail.usecase';
import { CreateRentalFormLocUseCase } from './usecases/potential/createRentalFormLoc.usecase';
import { SendApprovePotentialUseCase } from './usecases/potential/sendApprovePotential.usecase';
import { GetLocationFromRentalUseCase } from './usecases/rental/getLocationFromRental.usecase';
import { GenerateRentalLinkUseCase } from './usecases/rental/generateRentalLink.usecase';
import { FindTradeareaTypeUseCase } from './usecases/tradearea/findTradeareaType.usecase';
import { GetMailTemplateUseCase } from './usecases/quota/getMailTemplate.usecase';
import { GetMailParametersUseCase } from './usecases/quota/getMailParameters.usecase';
import { DeleteTradeareaUseCase } from './usecases/tradearea/deleteTradearea.usecase';

import { GetSummaryReportUseCase } from './usecases/quota/getSummaryReport.usecase';
import { ExportStoreSummaryUseCase } from './usecases/quota/exportStoreSummary.usecase';
import { SaveStoreOpeningReportUseCase } from './usecases/quota/saveStoreOpeningReport.usecase';
import { GetAllReportOpenPlanUseCase } from './usecases/quota/getAllStoreOpenPlan.usecase';
import { GetTradeareaByPoiUseCase } from './usecases/tradearea/getTradeareaByPoi.usecase';
import { CreateChildTradeareaUseCase } from './usecases/tradearea/createChildTradearea.usecase';
import { FindAllUserWithZonesUseCase } from './usecases/users/findAllUserWithZones.usecase';
import { SaveMailTemplateUseCase } from './usecases/quota/saveMailTemplate.usecase';
import { UploadPoiImagesUsecase } from './usecases/potential/uploadPoiImages.usecase';
import { GetPoiImagesUsecase } from './usecases/potential/getPoiImages.usecase';
import { DeletePoiImagesUsecase } from './usecases/potential/deletePoiImages.usecase';

import { GetStorePlanStandardUseCase } from './usecases/import/getStorePlanStandard.usecase';
import { GetAnnounceUseCase } from './usecases/import/getAnnounce.usecase';
import { CreateAnnounceUseCase } from './usecases/import/createAnnounce.usecase';
import { UpdateCanLoadStorePlanStandardUseCase } from './usecases/import/updateCanLoadStorePlanStandard.usecase';
import { UpdateAnnounceIsShowUseCase } from './usecases/import/updateAnnounceIsShow.usecase';
import { CreateStorePlanStandardUseCase } from './usecases/import/createStorePlanStandard.usecase';
import { DeleteStorePlanStandardUseCase } from './usecases/import/deleteStorePlanStandard.usecase';
import { GetKnowledgeUseCase } from '../application/usecases/import/getKnowledge.usecase';
import { CreateKnowledgeUseCase } from './usecases/import/createKnowledge.usecase';
import { DeleteKnowledgeUseCase } from './usecases/import/deleteKnowledge.usecase';
import { DeleteAnnounceUseCase } from './usecases/import/deleteAnnounce.usecase';
import { DownloadFileUseCase } from './usecases/import/downloadFile.usecase';

import { CheckLocationHistoryUseCase } from './usecases/quota/checkLocationHistory.usecase';
import { SaveImpactSiteReportUseCase } from './usecases/quota/saveImpactSiteReport.usecase';
import { GetAllReportImpactSiteUseCase } from './usecases/quota/getAllImpactSite.usecase';
import { DeleteReportImpactSiteUseCase } from './usecases/quota/deleteImpactSite.usecase';
@Global()
@Module({
  imports: [
    ConfigModule,
    HttpModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '8h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [],
  providers: [
    GenerateJwtTokenUseCase,
    FindStoreLocationUseCase,
    SearchPoiUseCase,
    SpatialSearchUseCase,
    SearchNearbySevenUseCase,
    SearchNearbyCompetitorUseCase,
    SearchNearbyEntertainmentAreaUseCase,
    SearchCompetitorSurroundUseCase,
    UpsertPoiAreaUseCase,
    CreatePoiUseCase,
    UpdatePoiUseCase,
    OAuth2CallbackUseCase,
    GenerateAdURLUseCase,
    FindAllUserUseCase,
    GetAllDepartmentUseCase,
    GetAllLevelsUseCase,
    GetAllZonesUseCase,
    GetAllRolesUseCase,
    UpdateUserUseCase,
    GetUserRoleUseCase,
    GetUserZonesUseCase,
    GetUserSubZonesUseCase,
    GetProvincesUseCase,
    GetDistrictsUseCase,
    GetSubDistrictsUseCase,
    GetBackupProfileUseCase,
    SaveBackupProfileUseCase,
    GetDynamicFormUseCase,
    GetBlankDynamicFormUseCase,
    SaveDynamicFormUseCase,
    GetAllTradeareaUseCase,
    GetTradeareaByIdUseCase,
    GetTradeareaByStoreCodeUseCase,
    GetTradeareaByZoneUseCase,
    GetTradeareaBySubzoneUseCase,
    GetTradeareasPendingApprovalUseCase,
    CheckPointInTradeareaUseCase,
    CreateTradeareaUseCase,
    UpdateTradeareaUseCase,
    CheckOverlapUseCase,
    GetCommonCodeUseCase,
    GetCurrentWorkflowStepUseCase,
    GetWorkflowHistoryUseCase,
    GetWorkflowStatusesUseCase,
    GetWorkflowStepsUseCase,
    UpdateWfStepOwnerUseCase,
    CreateWorkflowTransactionUseCase,
    WorkflowApprovalUseCase,
    WorkflowSendMailUseCase,
    GetLayersUseCase,
    GetTradeareaConfigsUseCase,
    ExportReportUseCase,
    SubmitTradeareaApprovalUseCase,
    GetPermissionsUseCase,
    FindPoiTradeareaUseCase,
    UpdateTradeareaApproveUseCase,
    GetZonesUseCase,
    GetYearConfigsUseCase,
    GetZoneAnnualTargetsByYearUseCase,
    SaveAnnualQuotaUseCase,
    GetQuotaAllocationDetailUseCase,
    GetImportConfigUseCase,
    ImportFileUseCase,
    GetQuotaConfigUseCase,
    GetRoundWithAllosUseCase,
    CreateRoundUseCase,
    UpdateRoundUsecase,
    DeleteRoundUseCase,
    SubmitRoundByZoneUseCase,
    SubmitQuotaRoundAllZonesUseCase,
    CloseQuotaConfigUseCase,
    SubmitReviewRoundsAllZonesUseCase,
    SubmitReviewRoundsByZoneUseCase,
    GetAllPermissionGroupsUseCase,
    GetRolePermissionsUseCase,
    UpdateRolePermissionsUseCase,
    CreateRoleUseCase,
    SearchRolesUseCase,
    GetCoordinateInfoUseCase,
    ApprovePotentialUsecase,
    FindPotentialStatusUsecase,
    GetPendingApprovalPotentialsUseCase,
    GetPotentialDetailUseCase,
    CreateRentalFormLocUseCase,
    SendApprovePotentialUseCase,
    ExportAnnualQuotaUseCase,
    SearchQuotaAllocationUseCase,
    GetAllocationHistoryUseCase,
    GetQuotaRoundsUseCase,
    ApproveSelectedUseCase,
    RejectSelectedUseCase,
    ProcessAllocationActionUseCase,
    GetLocationFromRentalUseCase,
    GenerateRentalLinkUseCase,
    GetFormByReferenceUseCase,
    GetBlankDynamicFormBySubcodeUseCase,
    GetPoiByIdUseCase,
    FindTradeareaTypeUseCase,
    GetMailTemplateUseCase,
    GetMailParametersUseCase,
    DeleteTradeareaUseCase,
    GetTradeareaByPoiUseCase,
    CreateChildTradeareaUseCase,
    FindAllUserWithZonesUseCase,
    SaveMailTemplateUseCase,
    SaveLocationSelectionUseCase,
    GetItemHistoryUseCase,
    QuotaAllocationWorkflowService,
    GetStorePlanStandardUseCase,
    GetAnnounceUseCase,
    CreateAnnounceUseCase,
    CreateStorePlanStandardUseCase,
    UpdateCanLoadStorePlanStandardUseCase,
    DeleteStorePlanStandardUseCase,
    GetKnowledgeUseCase,
    CreateKnowledgeUseCase,
    DeleteKnowledgeUseCase,
    DeleteAnnounceUseCase,
    UpdateAnnounceIsShowUseCase,
    DownloadFileUseCase,
    GetSevenInfoByStorecodeUseCase,

    GetSummaryReportUseCase,
    ExportStoreSummaryUseCase,
    SaveStoreOpeningReportUseCase,
    GetAllReportOpenPlanUseCase,
    SaveImpactSiteReportUseCase,
    GetAllReportImpactSiteUseCase,
    DeleteReportImpactSiteUseCase,
    GetSevenInfoByStorecodeUseCase,
    UploadPoiImagesUsecase,
    GetPoiImagesUsecase,
    DeletePoiImagesUsecase,
    CheckLocationHistoryUseCase,
  ],
  exports: [
    GenerateJwtTokenUseCase,
    FindStoreLocationUseCase,
    SearchPoiUseCase,
    SpatialSearchUseCase,
    SearchNearbySevenUseCase,
    SearchNearbyCompetitorUseCase,
    SearchNearbyEntertainmentAreaUseCase,
    SearchCompetitorSurroundUseCase,
    UpsertPoiAreaUseCase,
    CreatePoiUseCase,
    UpdatePoiUseCase,
    OAuth2CallbackUseCase,
    GenerateAdURLUseCase,
    FindAllUserUseCase,
    GetAllDepartmentUseCase,
    GetAllLevelsUseCase,
    GetAllZonesUseCase,
    GetAllRolesUseCase,
    UpdateUserUseCase,
    GetUserRoleUseCase,
    GetUserZonesUseCase,
    GetUserSubZonesUseCase,
    GetProvincesUseCase,
    GetDistrictsUseCase,
    UpdateAnnounceIsShowUseCase,
    GetSubDistrictsUseCase,
    GetBackupProfileUseCase,
    SaveBackupProfileUseCase,
    GetDynamicFormUseCase,
    GetBlankDynamicFormUseCase,
    SaveDynamicFormUseCase,
    GetAllTradeareaUseCase,
    GetTradeareaByIdUseCase,
    GetTradeareaByStoreCodeUseCase,
    GetTradeareaByZoneUseCase,
    GetTradeareaBySubzoneUseCase,
    GetTradeareasPendingApprovalUseCase,
    CheckPointInTradeareaUseCase,
    CreateTradeareaUseCase,
    UpdateTradeareaUseCase,
    CheckOverlapUseCase,
    GetCommonCodeUseCase,
    GetCurrentWorkflowStepUseCase,
    GetWorkflowHistoryUseCase,
    GetWorkflowStatusesUseCase,
    GetWorkflowStepsUseCase,
    UpdateWfStepOwnerUseCase,
    CreateWorkflowTransactionUseCase,
    WorkflowApprovalUseCase,
    WorkflowSendMailUseCase,
    GetLayersUseCase,
    GetTradeareaConfigsUseCase,
    ExportReportUseCase,
    SubmitTradeareaApprovalUseCase,
    GetPermissionsUseCase,
    FindPoiTradeareaUseCase,
    UpdateTradeareaApproveUseCase,
    GetZonesUseCase,
    GetYearConfigsUseCase,
    GetZoneAnnualTargetsByYearUseCase,
    SaveAnnualQuotaUseCase,
    GetQuotaAllocationDetailUseCase,
    GetImportConfigUseCase,
    ImportFileUseCase,
    GetQuotaConfigUseCase,
    GetRoundWithAllosUseCase,
    CreateRoundUseCase,
    GetLocationFromRentalUseCase,
    GenerateRentalLinkUseCase,
    UpdateRoundUsecase,
    DeleteRoundUseCase,
    SubmitRoundByZoneUseCase,
    SubmitQuotaRoundAllZonesUseCase,
    CloseQuotaConfigUseCase,
    SubmitReviewRoundsAllZonesUseCase,
    SubmitReviewRoundsByZoneUseCase,
    GetAllPermissionGroupsUseCase,
    GetRolePermissionsUseCase,
    UpdateRolePermissionsUseCase,
    CreateRoleUseCase,
    SearchRolesUseCase,
    GetCoordinateInfoUseCase,
    ApprovePotentialUsecase,
    FindPotentialStatusUsecase,
    GetPendingApprovalPotentialsUseCase,
    GetPotentialDetailUseCase,
    CreateRentalFormLocUseCase,
    SendApprovePotentialUseCase,
    ExportAnnualQuotaUseCase,
    SearchQuotaAllocationUseCase,
    GetAllocationHistoryUseCase,
    GetQuotaRoundsUseCase,
    ApproveSelectedUseCase,
    RejectSelectedUseCase,
    ProcessAllocationActionUseCase,
    GetFormByReferenceUseCase,
    GetBlankDynamicFormBySubcodeUseCase,
    GetPoiByIdUseCase,
    FindTradeareaTypeUseCase,
    GetMailTemplateUseCase,
    GetMailParametersUseCase,
    DeleteTradeareaUseCase,
    GetTradeareaByPoiUseCase,
    CreateChildTradeareaUseCase,
    FindAllUserWithZonesUseCase,
    SaveMailTemplateUseCase,
    SaveLocationSelectionUseCase,
    GetItemHistoryUseCase,
    QuotaAllocationWorkflowService,
    GetStorePlanStandardUseCase,
    CreateStorePlanStandardUseCase,
    UpdateCanLoadStorePlanStandardUseCase,
    GetAnnounceUseCase,
    CreateAnnounceUseCase,
    DeleteStorePlanStandardUseCase,
    GetKnowledgeUseCase,
    CreateKnowledgeUseCase,
    DeleteKnowledgeUseCase,
    DeleteAnnounceUseCase,
    UpdateAnnounceIsShowUseCase,
    DownloadFileUseCase,
    GetSummaryReportUseCase,
    ExportStoreSummaryUseCase,
    SaveStoreOpeningReportUseCase,
    GetAllReportOpenPlanUseCase,
    SaveImpactSiteReportUseCase,
    GetAllReportImpactSiteUseCase,
    DeleteReportImpactSiteUseCase,
    GetSevenInfoByStorecodeUseCase,
    UploadPoiImagesUsecase,
    GetPoiImagesUsecase,
    DeletePoiImagesUsecase,
    CheckLocationHistoryUseCase,
  ],
})
export class ApplicationModule {}
