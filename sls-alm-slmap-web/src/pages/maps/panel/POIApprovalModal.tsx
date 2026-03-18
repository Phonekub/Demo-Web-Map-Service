import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Modal } from '@/components';
import {
  getCurrentWorkflow,
  type CurrentWorkflowStepData,
} from '@/services/workflow.service';
import { updatePOIApprove } from '@/services/poi.service';
import {
  ArrowUturnLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';
import PopupAlert, { type AlertType } from '@/components/base/PopupAlert';
import { fetchPotentialByPoiId } from '@/services/location.service';
import { getWorkflowTransaction } from '@/services/workflow.service';

interface POIApprovalModalProps {
  poiId: string;
  onApprovalSuccess?: () => void;
}

export const POIApprovalModal: React.FC<POIApprovalModalProps> = ({ poiId, onApprovalSuccess }) => {
  const { t } = useTranslation('dashboard');
  const { t: c } = useTranslation('common');
  const { t: tTradearea } = useTranslation(['tradearea']);

  const [currentWorkflow, setCurrentWorkflow] = useState<CurrentWorkflowStepData | null>(
    null
  );
  const [actionType, setActionType] = useState<string>('');
  const [remark, setRemark] = useState<string>('');
  const [isRemarkError, setIsRemarkError] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [displayConfirmModal, setDisplayConfirmModal] = useState(false);
  const [displayAlertModal, setDisplayAlertModal] = useState(false);
  const [popupType, setPopupType] = useState<AlertType>('info');
  const [popupMessage, setPopupMessage] = useState<string>('');
  const [hasRemark, setHasRemark] = useState<boolean>(false);
  const [poiDetailData, setPoiDetailData] = useState<any>(null);
  const [wfTransactionData, setWfTransactionData] = useState<any>(null);

  const handleOpenModal = async () => {
    if (!poiId) return;

    try {
      const poiInfo = await fetchPotentialByPoiId(
        typeof poiId === 'string' ? Number(poiId) : poiId
      );

      if (!poiInfo) {
        console.error('No response from fetchPotentialByPoiId');
        return;
      }

      setPoiDetailData(poiInfo);

      // Fetch current workflow
      if (poiInfo.potentialStore?.id && poiInfo.potentialStore?.wfTransactionId) {
        // Get wfId from workflow transaction
        const wfTransactionRes = await getWorkflowTransaction(
          Number(poiInfo.potentialStore.wfTransactionId)
        );
        
        if (wfTransactionRes?.data?.wfId) {
          setWfTransactionData(wfTransactionRes.data);
          const wfRes = await getCurrentWorkflow(
            Number(poiInfo.potentialStore.id),
            wfTransactionRes.data.wfId
          );
          if (wfRes) {
            setCurrentWorkflow(wfRes.data || null);
          }
        }
      }

      const modal = document.getElementById('poi_modal_6') as HTMLDialogElement;
      modal?.showModal();
    } catch (error) {
      console.error('Failed to open POI modal:', error);
    }
  };

  const closeModal = () => {
    const modal = document.getElementById('poi_modal_6') as HTMLDialogElement;
    modal?.close();
    setPoiDetailData(null);
    setWfTransactionData(null);
    setRemark('');
    setIsRemarkError(false);
  };

  const setIconByActionCode = (actionCode: string) => {
    switch (actionCode) {
      case 'APPROVE':
        return <CheckCircleIcon className="size-5" />;
      case 'NOT_APPROVE':
        return <XCircleIcon className="size-5" />;
      case 'REJECT':
        return <ArrowUturnLeftIcon className="size-5" />;
      default:
        return null;
    }
  };

  const setVariantByActionCode = (
    actionCode: string
  ): 'primary' | 'success' | 'secondary' | 'outline' | 'danger' => {
    switch (actionCode) {
      case 'APPROVE':
        return 'success';
      case 'NOT_APPROVE':
        return 'danger';
      case 'REJECT':
        return 'outline';
      default:
        return 'primary';
    }
  };

  const handleAction = (actionCode: string) => {
    setActionType(actionCode);

    const actionMap = new Map([
      ['SEND_APPROVE', () => onDisplayConfirmModal(tTradearea('send_approval_confirm'))],
      ['APPROVE', () => onDisplayConfirmModal(tTradearea('approve_confirm'))],
      [
        'NOT_APPROVE',
        () => onDisplayConfirmRemarkModal(tTradearea('not_approve_confirm')),
      ],
      ['REJECT', () => onDisplayConfirmRemarkModal(tTradearea('return_confirm'))],
    ]);

    const actionHandler = actionMap.get(actionCode);
    if (!actionHandler) {
      return;
    }

    setDisplayConfirmModal(true);

    actionHandler();
  };

  const onCloseModal = async () => {
    if (!poiId) return;

    // Validate remark for REJECT and NOT_APPROVE actions
    if ((actionType === 'REJECT' || actionType === 'NOT_APPROVE') && !remark.trim()) {
      setIsRemarkError(true);
      return;
    }

    const mapHandler = new Map([
      [
        'APPROVE',
        async () => {
          await updatePOIApprove(+poiId, 'APPROVE');
        },
      ],
      [
        'REJECT',
        async () => {
          await updatePOIApprove(+poiId, 'REJECT', remark);
        },
      ],
      [
        'NOT_APPROVE',
        async () => {
          await updatePOIApprove(+poiId, 'NOT_APPROVE', remark);
        },
      ],
    ]);

    const handler = mapHandler.get(actionType);
    if (!handler) return;

    setIsSubmitting(true);

    try {
      await handler();

      setDisplayConfirmModal(false);

      setPopupType('success');
      setPopupMessage('ดำเนินการสำเร็จ');
      setDisplayAlertModal(true);
    } catch (error: any) {
      setDisplayConfirmModal(false);
      setPopupType('error');
      setPopupMessage(error.message || 'เกิดข้อผิดพลาด');
      setDisplayAlertModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDisplayConfirmModal = (message: string) => {
    setPopupMessage(message);
    setPopupType('info');
    setHasRemark(false);
    setDisplayConfirmModal(true);
  };

  const onDisplayConfirmRemarkModal = (message: string) => {
    setPopupMessage(message);
    setPopupType('info');
    setHasRemark(true);
    setDisplayConfirmModal(true);
  };

  return (
    <>
      <Button
        className="w-32 bg-green-600 text-white hover:bg-green-700"
        size="sm"
        onClick={handleOpenModal}
      >
        {t('approve')}
      </Button>

      {/* POI Approval Modal */}
      <dialog id="poi_modal_6" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <h3 className="font-bold text-lg text-gray-900 mb-4">
            {t('potential_details')}
          </h3>

          {poiDetailData && (
            <div className="space-y-4 py-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">
                  {t('potential_name')}:
                </span>
                <span className="text-sm text-gray-900 font-semibold">
                  {poiDetailData.poi?.namt || '-'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">
                  {t('location')}:
                </span>
                <span className="text-sm text-gray-900">
                  {poiDetailData.poi?.locationT || '-'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">
                  {t('workflow')}:
                </span>
                <span className="text-sm text-gray-900">
                  {wfTransactionData?.wfName || '-'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">
                  {t('status')}:
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  {currentWorkflow?.wfStatus.wfStatusName || '-'}
                </span>
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="modal-action gap-2 mt-6 justify-between">
            <div className="flex gap-2">
              {currentWorkflow?.availableActions.map(action => {
                return (
                  <Button
                    key={action.actionCode}
                    variant={setVariantByActionCode(action.actionCode)}
                    icon={setIconByActionCode(action.actionCode)}
                    onClick={() => {
                      handleAction(action.actionCode);
                    }}
                  >
                    {''}
                  </Button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <form method="dialog">
                <button className="btn btn-ghost" onClick={closeModal}>
                  {t('close')}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Modal Backdrop */}
        <form method="dialog" className="modal-backdrop">
          <button onClick={closeModal}>close</button>
        </form>

        <PopupAlert
          open={displayAlertModal}
          type={popupType}
          message={popupMessage}
          onClose={() => {
            setDisplayAlertModal(false);
            closeModal();
            if (popupType === 'success' && onApprovalSuccess) {
              onApprovalSuccess();
            }
          }}
        />

        <Modal
          id="trade_area_approve_modal"
          title={t('process_confirm')}
          isOpen={displayConfirmModal}
          onClose={() => {}}
          closeButton={false}
          location="center"
          size="md"
          actions={
            <>
              <Button
                variant={hasRemark ? 'danger' : 'primary'}
                onClick={() => {
                  onCloseModal();
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="loading loading-spinner loading-sm mr-2"></span>
                    กำลังดำเนินการ...
                  </>
                ) : (
                  c('confirm')
                )}
              </Button>
              <Button
                variant="outline"
                className="btn btn-ghost"
                type="submit"
                onClick={() => {
                  setDisplayConfirmModal(false);
                }}
                disabled={isSubmitting}
              >
                {c('cancel')}
              </Button>
            </>
          }
        >
          {!hasRemark && popupMessage}
          {hasRemark && (
            <div className="form-control w-full ">
              <label className="label">
                <span
                  className={`label-text font-medium ml-2 mb-2 ${
                    isRemarkError ? 'text-red-500' : 'text-gray-700'
                  }`}
                >
                  {t('remark')} <span className="text-red-500">*</span>
                </span>
              </label>
              <textarea
                className={`textarea w-full h-32 text-base transition-all duration-200 ${
                  isRemarkError
                    ? 'textarea-error border-red-500 focus:ring-red-200 bg-red-50'
                    : 'textarea-bordered border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 bg-white text-gray-900'
                }`}
                value={remark}
                onChange={e => {
                  setRemark(e.target.value);
                  if (e.target.value.trim()) setIsRemarkError(false);
                }}
              ></textarea>
              <div
                className={`text-red-500 ml-2 text-xs mt-2 flex items-center gap-1 transition-opacity duration-200 ${
                  isRemarkError ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <ExclamationTriangleIcon className="w-4 h-4" />
                <span>{t('remark_required')}</span>
              </div>
            </div>
          )}
        </Modal>
      </dialog>
    </>
  );
};
