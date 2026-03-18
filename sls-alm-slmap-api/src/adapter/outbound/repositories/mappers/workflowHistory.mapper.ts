import { Builder } from 'builder-pattern';
import { WorkflowHistory, WorkflowHistoryItem } from '../../../../domain/workflowHistory';

interface RawWorkflowHistoryData {
  history_id: number | string;
  history_wf_transaction_id: number | string;
  history_ref_id: number | string;
  history_wf_step_id: number | string;
  history_wf_status_id: number | string;
  history_wf_action_id: number | string;
  history_remark: string | null;
  history_create_by: number | string | null;
  history_create_date: Date | string | null;
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
  action_action_name: string | null;
  action_action_name_th?: string | null;
  action_action_name_en?: string | null;
  action_action_name_kh?: string | null;
  action_action_name_la?: string | null;
  user_first_name: string | null;
  user_last_name: string | null;
}

export class WorkflowHistoryMapper {
  static toDomain(
    rawData: RawWorkflowHistoryData[],
    language?: string,
  ): WorkflowHistory | null {
    if (!rawData || rawData.length === 0) {
      return null;
    }

    const validLanguages = ['th', 'en', 'km', 'la'];

    const histories: WorkflowHistoryItem[] = rawData.map((item) => {
      const createByName =
        [item.user_first_name, item.user_last_name].filter(Boolean).join(' ') ||
        'ไม่ระบุ';

      const defaultStepName = item.step_wf_step_name || '-';
      const defaultStatusName = item.status_status_name || '-';
      const defaultActionName = item.action_action_name || '-';

      let stepName = defaultStepName;
      if (language && validLanguages.includes(language)) {
        const langMap: { [key: string]: string | null | undefined } = {
          th: item.step_wf_step_name_th,
          en: item.step_wf_step_name_en,
          km: item.step_wf_step_name_kh,
          la: item.step_wf_step_name_la,
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
          th: item.status_status_name_th,
          en: item.status_status_name_en,
          km: item.status_status_name_kh,
          la: item.status_status_name_la,
        };
        const languageSpecificName = langMap[language];
        statusName =
          languageSpecificName && languageSpecificName.trim() !== ''
            ? languageSpecificName
            : defaultStatusName;
      }

      let actionName = defaultActionName;
      if (language && validLanguages.includes(language)) {
        const langMap: { [key: string]: string | null | undefined } = {
          th: item.action_action_name_th,
          en: item.action_action_name_en,
          km: item.action_action_name_kh,
          la: item.action_action_name_la,
        };
        const languageSpecificName = langMap[language];
        actionName =
          languageSpecificName && languageSpecificName.trim() !== ''
            ? languageSpecificName
            : defaultActionName;
      }

      return Builder(WorkflowHistoryItem)
        .id(Number(item.history_id))
        .wfTransactionId(Number(item.history_wf_transaction_id))
        .wfStepId(Number(item.history_wf_step_id))
        .wfStepName(stepName)
        .wfStatusId(Number(item.history_wf_status_id))
        .wfStatusName(statusName)
        .wfActionId(Number(item.history_wf_action_id))
        .wfActionName(actionName)
        .remark(item.history_remark || '')
        .createBy(item.history_create_by ? Number(item.history_create_by) : null)
        .createByName(createByName)
        .createDate(item.history_create_date ? new Date(item.history_create_date) : null)
        .build();
    });

    return Builder(WorkflowHistory)
      .refId(Number(rawData[0].history_ref_id))
      .histories(histories)
      .build();
  }
}
