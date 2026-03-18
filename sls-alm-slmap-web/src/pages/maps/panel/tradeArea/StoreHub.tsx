import { Button, Modal } from '@/components';
import ModalTradeArea from '@/components/base/ModalTradeArea';
import PopupAlert, { type AlertType } from '@/components/base/PopupAlert';
import type { LocationInfo } from '@/services/location.service';
import {
  deleteTradearea,
  getTradeAreaByStoreId,
  sendForApprovalTradeArea,
  updateTradeAreaApprove,
  type TradeAreaDto,
} from '@/services/tradeArea.service';
import {
  getCurrentWorkflow,
  type CurrentWorkflowStepData,
} from '@/services/workflow.service';
import { useMapStore } from '@/stores';
import { useTradeAreaStore } from '@/stores/tradeareaStore';
import {
  CheckCircleIcon,
  PaperAirplaneIcon,
  PencilSquareIcon,
  TrashIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  ArrowLeftCircleIcon,
} from '@heroicons/react/24/solid';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

// Interfaces คงเดิม
interface TradeAreaProps {
  poiId?: string;
  location: LocationInfo;
}

interface TradeAreaItem extends TradeAreaDto {
  isChecked: boolean;
  currentWorkflow?: CurrentWorkflowStepData;
}

export const StoreHub: React.FC<TradeAreaProps> = ({ poiId, location }) => {
  const { t } = useTranslation(['tradearea']);
  const [tradeAreas, setTradeAreas] = useState<TradeAreaItem[]>([]);
  const [remark, setRemark] = useState<string>('');
  const [isRemarkError, setIsRemarkError] = useState<boolean>(true);
  const [actionType, setActionType] = useState<string>('');
  const buttonList: string[] = ['SAVE', 'CANCEL'];
  const [displayConfirmModal, setDisplayConfirmModal] = useState(false);
  const [displayAlertModal, setDisplayAlertModal] = useState(false);
  const [popupType, setPopupType] = useState<AlertType>('info');
  const [popupMessage, setPopupMessage] = useState<string>('');
  const [hasRemark, setHasRemark] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSelectAll, setIsSelectAll] = useState<boolean>(false);
  const [newFetch, setNewFetch] = useState<boolean>(true);
  const tradeareaType = 'store_hub';

  const {
    polygonLayers,
    removePolygonLayer,
    setEditingAreaId,
    isEditing,
    setIsEditing,
    setCreatingAreaStoreId,
    setIsCreatingArea,
    setTradeAreaProperties,
    setRadiusArea,
    isCreatingArea,
    setCreatingAreaType,
    addPolygonLayer,
  } = useMapStore();

  const {
    openModal: openTradeareaModal,
    setOpenModal: setOpenTradeareaModal,
    view,
    setView,
    setTradeareaId,
    tradeareaId,
    isFetch,
    setIsFetch,
    setCurrentWfStep,
    setTradeareaType,
  } = useTradeAreaStore();

  useEffect(() => {
    if (!poiId) return;
    setNewFetch(true);
  }, [poiId]);

  const handleEditArea = async (item: TradeAreaItem) => {
    setTradeareaType(tradeareaType);
    const areaId = `trade-area-${item.id}`;

    const radius: number[] =
      item.status!.toLowerCase() !== 'draft' || item.wfId !== 1
        ? [600, 1100, 2100]
        : [600];

    const saveStatus =
      item.status!.toLowerCase() === 'draft' ||
      (item.status!.toLowerCase() === 'scheduled' && item.parentId !== null);

    setIsEditing(true);
    setRadiusArea(location?.geom?.coordinates || [], radius);
    checkBoxChange(item, true);
    setTradeAreaProperties(item);
    setView(saveStatus ? 'save' : 'edit');
    setEditingAreaId(areaId);
    setCurrentWfStep(item.currentWorkflow?.wfStep.wfStepId || null);
  };

  const handleCreateArea = () => {
    setTradeareaType(tradeareaType);
    setIsCreatingArea(true);
    setCreatingAreaStoreId(poiId || '');
    setRadiusArea(location?.geom?.coordinates || [], [600]);
    setCurrentWfStep(101);
  };

  const checkBoxChange = useCallback(
    (item: TradeAreaItem, isChecked: boolean) => {
      item.isChecked = isChecked;
      // const fillStatus = ['activ', 'scheduled']
      let color: CanvasPattern | string | null = null;
      // if (fillStatus.includes(item.status!.toLowerCase())) {

      if (item.status!.toLowerCase() === 'scheduled') {
        const canvas = document.createElement('canvas');
        canvas.width = 10;
        canvas.height = 10;
        const context = canvas.getContext('2d');
        const rgbMatch = item.areaColor?.match(/\d+/g);
        const [r, g, b] = rgbMatch ? rgbMatch.map(Number) : [180, 180, 180];
        context!.fillStyle = 'rgb(80,80,80,0.3)';
        context!.fillRect(0, 0, 5, 5);
        context!.fillRect(5, 5, 5, 5);

        context!.fillStyle = `rgba(${r},${g},${b},0.1)`;
        context!.fillRect(5, 0, 5, 5);
        context!.fillRect(0, 5, 5, 5);
        color = context!.createPattern(canvas, 'repeat');
      }

      if (item.status!.toLowerCase() === 'active') {
        const rgbMatch2 = item.areaColor?.match(/\d+/g);
        const [r2, g2, b2] = rgbMatch2 ? rgbMatch2.map(Number) : [180, 180, 180];
        color = `rgba(${r2},${g2},${b2},0.3)`;
      }

      if (isChecked) {
        addPolygonLayer({
          id: `trade-area-${item.id}`,
          name: `Trade Area`,
          data: [
            {
              id: item.id!,
              coordinates: item.shape!.coordinates,
              properties: {
                areaColor:
                  item.status!.toLowerCase() === 'active'
                    ? item.areaColor
                    : 'rgb(100,100,100)',
              },
            },
          ],
          style: {
            fill: color ?? undefined,
            stroke: {
              color: item.areaColor!,
              width: 2,
            },
          },
        });
      } else {
        removePolygonLayer(`trade-area-${item.id}`);
      }
    },
    [addPolygonLayer, removePolygonLayer]
  );

  const fetchTradeAreas = useCallback(
    async (isAllChecked?: boolean) => {
      setNewFetch(false);
      polygonLayers.forEach(layer => {
        if (layer.id.startsWith('trade-area-')) {
          removePolygonLayer(layer.id);
        }
      });
      setTradeAreas([]);

      if (!location?.branchCode) {
        return;
      }

      try {
        setIsLoading(true);
        const res = await getTradeAreaByStoreId(location.branchCode, tradeareaType);
        if (!res) {
          setTradeAreas([]);
        }

        const mapping: TradeAreaItem[] = [];
        for (const area of res.data) {
          const currentWorkflowRes = await fetchCurrentWorkflow(
            Number(area.id),
            area.wfId!
          );
          const item: TradeAreaItem = {
            ...area,
            isChecked: false,
            currentWorkflow: currentWorkflowRes,
          };

          if (isAllChecked) {
            checkBoxChange(item, true);
          }

          mapping.push(item);
        }
        setTradeAreas(mapping);
        if (isAllChecked) {
          setIsSelectAll(true);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('🚀 Failed to fetch trade areas:', error);
        setIsLoading(false);
      }
    },
    [location, removePolygonLayer, polygonLayers, tradeareaType, checkBoxChange]
  );

  const fetchCurrentWorkflow = async (
    tradeAreaId: number,
    wfId: number
  ): Promise<CurrentWorkflowStepData | undefined> => {
    const { data } = await getCurrentWorkflow(tradeAreaId, wfId);
    return data;
  };

  const setVariantByActionCode = (
    actionCode: string
  ):
    | 'primary'
    | 'success'
    | 'secondary'
    | 'outline'
    | 'danger'
    | 'warning'
    | 'info'
    | 'neutral'
    | 'accent' => {
    switch (actionCode) {
      case 'SAVE':
        return 'success';
      case 'SEND_APPROVE':
        return 'warning';
      case 'CANCEL':
        return 'secondary';
      case 'APPROVE':
        return 'success';
      case 'NOT_APPROVE':
        return 'danger';
      case 'REJECT':
        return 'info';
      case 'DELETE':
        return 'danger';
      default:
        return 'primary';
    }
  };

  const setIconByActionCode = (actionCode: string) => {
    switch (actionCode) {
      case 'SEND_APPROVE':
        return <PaperAirplaneIcon className="size-5 text-white" />;
      case 'EDIT':
        return <PencilSquareIcon className="size-5 text-white" />;
      case 'CANCEL':
        return <TrashIcon className="size-6 text-white" />;
      case 'DELETE':
        return <TrashIcon className="size-6 text-white" />;
      case 'APPROVE':
        return <CheckCircleIcon className="size-6 text-white" />;
      case 'NOT_APPROVE':
        return <XCircleIcon className="size-6 text-white" />;
      case 'REJECT':
        return <ArrowLeftCircleIcon className="size-6 text-white" />;
      default:
        return null;
    }
  };

  const handleAction = (actionCode: string, item: TradeAreaItem) => {
    if (!item.currentWorkflow) return;

    setTradeareaId(Number(item.id));
    setActionType(actionCode);

    const deleteFlow = [301, 302, 303];

    const isdelete = deleteFlow.includes(item.currentWorkflow.wfStep.wfStepId);

    const actionMap = new Map([
      [
        'VIEW',
        () => {
          setView('view');
          onOpenTradeareaModal(item);
        },
      ],
      ['EDIT', () => handleEditArea(item)],
      ['SEND_APPROVE', () => onOpenConfirmModal(t('send_approval_confirm'), item)],
      [
        'APPROVE',
        () =>
          onOpenConfirmModal(
            isdelete ? t('approve_delete_confirm') : t('approve_confirm'),
            item
          ),
      ],
      ['NOT_APPROVE', () => onOpenConfirmModal(t('not_approve_confirm'), item, true)],
      ['REJECT', () => onOpenConfirmModal(t('return_confirm'), item, true)],
      [
        'DELETE',
        () => {
          onOpenConfirmModal(t('delete_confirm'), item);
        },
      ],
    ]);

    const actionHandler = actionMap.get(actionCode);
    if (!actionHandler) {
      return;
    }
    actionHandler();
  };

  const onOpenConfirmModal = (
    message: string,
    item: TradeAreaItem,
    reqRemark: boolean = false
  ) => {
    setPopupMessage(message);
    setPopupType('info');
    setTradeareaId(Number(item.id));
    setHasRemark(reqRemark);
    setIsRemarkError(false);
    setDisplayConfirmModal(true);
  };

  const onOpenTradeareaModal = async (item: TradeAreaItem) => {
    setTradeareaId(Number(item.id));
    setOpenTradeareaModal(true);
  };

  const onCloseModal = async () => {
    if (!tradeareaId) return;

    const mapHandler = new Map<string, () => Promise<void>>([
      [
        'SEND_APPROVE',
        async () => {
          await sendForApprovalTradeArea(tradeareaId.toString());
        },
      ],
      [
        'APPROVE',
        async () => {
          await updateTradeAreaApprove(tradeareaId, 'APPROVE');
        },
      ],
      [
        'REJECT',
        async () => {
          await updateTradeAreaApprove(tradeareaId, 'REJECT', remark);
        },
      ],
      [
        'NOT_APPROVE',
        async () => {
          await updateTradeAreaApprove(tradeareaId, 'NOT_APPROVE', remark);
        },
      ],
      [
        'DELETE',
        async () => {
          await deleteTradearea(tradeareaId);
        },
      ],
    ]);

    const handler = mapHandler.get(actionType);
    if (!handler) return;

    try {
      setIsLoading(true);
      await handler();
      setPopupType('success');
      setPopupMessage('ดำเนินการสำเร็จ');
    } catch (error: any) {
      const message = error.response?.data?.message;
      setPopupType('error');
      setPopupMessage(message || error.message);
    } finally {
      setDisplayConfirmModal(false);
      setDisplayAlertModal(true);
      setIsLoading(false);
    }
  };

  const handleCheckboxChange = (item: TradeAreaItem, isChecked: boolean) => {
    setIsSelectAll(false);
    checkBoxChange(item, isChecked);
  };

  const handleSelectAll = (isChecked: boolean) => {
    tradeAreas.forEach(area => {
      checkBoxChange(area, isChecked);
    });
    setIsSelectAll(isChecked);
  };

  useEffect(() => {
    if (isCreatingArea || isEditing) return;
    if (!newFetch) return;

    fetchTradeAreas(true);
    setCreatingAreaType(tradeareaType);
  }, [
    location,
    isCreatingArea,
    isEditing,
    newFetch,
    setCreatingAreaType,
    fetchTradeAreas,
  ]);

  useEffect(() => {
    if (openTradeareaModal) return;
    if (!isFetch) return;

    setNewFetch(true);
    setIsFetch(false);
  }, [isFetch, setIsFetch, openTradeareaModal]);

  return (
    <div className="p-2 bg-white rounded-lg shadow-sm h-full">
      {/* 1. ปุ่มสร้าง Delivery Area: ปรับเป็น Primary และย้ายไปขวาบน */}
      <div className="flex items-center justify-end mb-4">
        <Button
          variant="outline"
          className="btn-sm !bg-[#2563EB] hover:!bg-[#1D4ED8] !border-none text-white"
          icon={<PlusIcon className="size-5" />}
          onClick={handleCreateArea}
        >
          {t('create_delivery_area')}
        </Button>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full bg-white">
          <thead className="bg-blue-100 text-blue-700">
            <tr>
              <th className="px-3 py-3 text-left text-sm font-semibold whitespace-nowrap border-r border-blue-200">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  checked={isSelectAll}
                  onChange={e => {
                    e.stopPropagation();
                    handleSelectAll(e.target.checked);
                  }}
                  onClick={e => e.stopPropagation()}
                />
              </th>
              <th className="px-2 py-2 text-center text-sm font-semibold whitespace-nowrap border-r border-blue-200">
                {t('table.actions')}
              </th>
              <th className="px-2 py-3 text-left text-sm font-semibold whitespace-nowrap border-r border-blue-200 w-16">
                {t('table.no')}
              </th>

              <th className="px-2 py-3 text-left text-sm font-semibold whitespace-nowrap border-r border-blue-200">
                {t('table.status')}
              </th>

              <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap border-r border-blue-200">
                {t('table.process')}
              </th>

              <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap border-r border-blue-200">
                {t('table.effective_date')}
              </th>

              <th className="px-4 py-3 text-left text-sm font-semibold whitespace-nowrap border-r border-blue-200">
                {t('table.comments')}
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {tradeAreas.map((item, index) => {
              return (
                <tr
                  key={index}
                  className="hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    handleAction('VIEW', item);
                  }}
                >
                  <td className="px-3 py-3 text-sm text-gray-900 border-r border-gray-100">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      checked={item.isChecked}
                      onChange={e => {
                        e.stopPropagation();
                        handleCheckboxChange(item, e.target.checked);
                      }}
                      onClick={e => e.stopPropagation()}
                    />
                  </td>
                  {/* 7. Actions */}
                  <td className="px-2 py-3 whitespace-nowrap border-r border-gray-100 text-center">
                    <div className="flex items-center justify-start gap-1">
                      {item.currentWorkflow?.availableActions.map(action => {
                        if (buttonList.includes(action.actionCode)) {
                          return null;
                        }
                        return (
                          <Button
                            key={action.actionCode}
                            variant={setVariantByActionCode(action.actionCode)}
                            icon={setIconByActionCode(action.actionCode)}
                            onClick={e => {
                              e.stopPropagation();
                              handleAction(action.actionCode, item);
                            }}
                            tooltip={action.actionName}
                            iconOnly
                          ></Button>
                        );
                      })}
                    </div>
                  </td>
                  {/* 2. No. */}
                  <td className="px-2 py-3 text-sm text-gray-900 border-r border-gray-100 text-right">
                    {index + 1}
                  </td>

                  {/* 3. Status */}
                  <td className="px-2 py-3 text-sm text-gray-700 border-r border-gray-100 whitespace-nowrap text-center">
                    <span className="px-1 py-2 badge badge-primary badge-sm font-medium w-full h-full">
                      {item.status}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-500 border-r border-gray-100 min-w-[12rem] text-center">
                    <span className="badge badge-sm px-1 py-1 text-xs font-medium bg-orange-100 text-orange-800 text-balance w-full h-full">
                      {item.currentWorkflow?.wfStatus.wfStatusName || '-'}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-100">
                    {item.effectiveDate
                      ? new Date(item.effectiveDate).toLocaleDateString('th-TH')
                      : '-'}
                  </td>

                  {/* 6. รายละเอียด (Placeholder) */}
                  <td className="px-4 py-3 text-sm text-gray-500 border-r border-gray-100">
                    <div className="truncate max-w-xs">{item.comment}</div>
                  </td>
                </tr>
              );
            })}

            {/* Empty State */}
            {tradeAreas.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  {isLoading ? (
                    <div>
                      {'กำลังโหลดข้อมูล '}
                      <span className="loading loading-dots loading-xs"></span>
                    </div>
                  ) : (
                    'ไม่พบข้อมูล'
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
              variant={'primary'}
              onClick={() => {
                if (hasRemark && !remark.trim()) {
                  setIsRemarkError(true);
                  return;
                }
                onCloseModal();
              }}
            >
              {isLoading && <span className="loading loading-spinner loading-md"></span>}
              {!isLoading &&
                (actionType === 'DELETE' ? t('actions.delete') : t('actions.confirm'))}
            </Button>
            <Button
              variant="outline"
              className="btn btn-ghost"
              type="submit"
              onClick={() => {
                setRemark('');
                setDisplayConfirmModal(false);
              }}
              disabled={isLoading}
            >
              {t('actions.cancel')}
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

      <PopupAlert
        open={displayAlertModal}
        type={popupType}
        message={popupMessage}
        onClose={() => {
          setDisplayAlertModal(false);
          setNewFetch(true);
          setCurrentWfStep(null);
        }}
      />

      <ModalTradeArea
        isOpen={openTradeareaModal}
        view={view}
        tradeareaId={tradeareaId}
        poiId={Number(poiId)}
        onClose={() => {
          setOpenTradeareaModal(false);
          setCurrentWfStep(null);
        }}
      />
    </div>
  );
};
