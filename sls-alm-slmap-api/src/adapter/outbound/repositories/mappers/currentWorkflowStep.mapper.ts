import { Builder } from 'builder-pattern';
import { CurrentWorkflowStep } from '../../../../domain/currentWorkflowStep';

interface RawWorkflowData {
  transaction_id: number | string;
  transaction_wf_step_id: number | string;
  transaction_wf_status_id: number | string;
  transaction_approve_by: string | null;
  transaction_approve_type: string | null;
  step_wf_step_name: string | null;
  step_wf_step_name_th?: string | null;
  step_wf_step_name_en?: string | null;
  step_wf_step_name_kh?: string | null;
  step_wf_step_name_la?: string | null;
  status_status_name: string | null;
  status_status_name_th?: string | null;
  status_status_name_en?: string | null;
  status_status_name_kh?: string | null;
  status_status_name_la?: string | null;
  status_wf_complete: 'W' | 'D' | 'C' | 'N' | 'Y' | null;
}

interface RawActionData {
  action_action_code: string | null;
  action_action_name: string | null;
  action_action_name_th?: string | null;
  action_action_name_en?: string | null;
  action_action_name_kh?: string | null;
  action_action_name_la?: string | null;
  action_require_remark: string | null;
  route_is_owner: string | null;
}

export class CurrentWorkflowStepMapper {
  static toDomain(
    rawData: RawWorkflowData,
    rawActions: RawActionData[],
    canAction: boolean,
    language?: string,
  ): CurrentWorkflowStep {
    const defaultStepName = rawData.step_wf_step_name ?? '';
    const defaultStatusName = rawData.status_status_name ?? '';

    const validLanguages = ['th', 'en', 'km', 'la'];

    let stepName = defaultStepName;
    if (language && validLanguages.includes(language)) {
      const langMap: { [key: string]: string | null | undefined } = {
        th: rawData.step_wf_step_name_th,
        en: rawData.step_wf_step_name_en,
        km: rawData.step_wf_step_name_kh,
        la: rawData.step_wf_step_name_la,
      };

      const languageSpecificName = langMap[language];
      stepName =
        languageSpecificName && languageSpecificName.trim() !== ''
          ? languageSpecificName
          : defaultStepName;
    }

    let statusName = defaultStatusName;
    if (language && validLanguages.includes(language)) {
      const langMap: { [key: string]: string | null | undefined } = {
        th: rawData.status_status_name_th,
        en: rawData.status_status_name_en,
        km: rawData.status_status_name_kh,
        la: rawData.status_status_name_la,
      };

      const languageSpecificName = langMap[language];
      statusName =
        languageSpecificName && languageSpecificName.trim() !== ''
          ? languageSpecificName
          : defaultStatusName;
    }

    // Map actions with language support
    const mappedActions = rawActions.map((action) => {
      const defaultActionName = action.action_action_name ?? '';

      let actionName = defaultActionName;
      if (language && validLanguages.includes(language)) {
        const langMap: { [key: string]: string | null | undefined } = {
          th: action.action_action_name_th,
          en: action.action_action_name_en,
          km: action.action_action_name_kh,
          la: action.action_action_name_la,
        };

        const languageSpecificName = langMap[language];
        actionName =
          languageSpecificName && languageSpecificName.trim() !== ''
            ? languageSpecificName
            : defaultActionName;
      }

      return {
        actionCode: action.action_action_code ?? '',
        actionName: actionName,
        requireRemark: String(action.action_require_remark) === 'Y',
        isOwner: String(action.route_is_owner) === 'Y',
      };
    });

    return Builder(CurrentWorkflowStep)
      .transactionId(Number(rawData.transaction_id))
      .wfStepId(Number(rawData.transaction_wf_step_id))
      .stepName(stepName)
      .wfStatusId(Number(rawData.transaction_wf_status_id))
      .statusName(statusName)
      .wfComplete((rawData.status_wf_complete ?? 'N') as any)
      .approveBy(rawData.transaction_approve_by ?? '')
      .approveType(rawData.transaction_approve_type ?? '')
      .canAction(canAction)
      .actions(mappedActions)
      .build();
  }
}
