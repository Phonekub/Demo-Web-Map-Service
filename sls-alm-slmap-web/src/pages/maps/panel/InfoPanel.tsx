import {
  createElement,
  lazy,
  Suspense,
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  type RefObject,
} from 'react';
import Card from '../../../components/base/Card';
import { Button } from '../../../components';
import { fetchPoiByPoiId, type LocationInfo } from '@/services/location.service';
import type { CoordinateBasicInfo } from '../../../components/base/LocationClickPopup';
import { checkPOIHasPendingApproval } from '@/services/poi.service';
import { useTranslation } from 'react-i18next';

const BasicInfo = lazy(() =>
  import('./BasicInfo').then(module => ({ default: module.BasicInfo }))
);
const BackupProfile = lazy(() =>
  import('./BackupProfile').then(module => ({ default: module.BackupProfile }))
);
const Images = lazy(() =>
  import('./Images').then(module => ({ default: module.Images }))
);
const TradeArea = lazy(() =>
  import('./tradeArea/TradeArea').then(module => ({ default: module.TradeArea }))
);

import { POIApprovalModal } from './POIApprovalModal';
import { getPotentialStatus } from '@/services/potential.service';
import type { BasicInfoRef } from '../pointpotential/Information';
import { useBackupProfileStore } from '@/stores/backupProfileStore';
import { useInfoPanelStore } from '@/stores/infoPanelStore';

interface BackupProfileRef {
  handleSave: () => void;
  handleUpdate: () => void;
  handleEditBackup: () => void;
}

interface ImagesRef {
  [key: string]: unknown;
}

interface ComponentProps {
  poiId: string;
  uid: string;
  storeCode: string;
  ref?: React.Ref<BasicInfoRef | BackupProfileRef | ImagesRef>;
  onSavedAndClose?: () => void;
  onFormStateChange?: (state: {
    showSevenForm: boolean;
    showVendingForm: boolean;
  }) => void;
  type?: 'default' | 'env';
  location?: LocationInfo | null;
  coordinateBasicInfo?: CoordinateBasicInfo | null;
  formId?: number;
  isUpdateForm?: boolean;
  onSaveSuccess?: (poiId: number) => void;
}

interface ComponentMapItem {
  tabName: TabName;
  component: () => Promise<{ default: React.ComponentType<any> }>;
}

type TabName = 'Information' | 'Backup Profile' | 'Images' | 'Trade Area';
export type InfoComponent = 'INFORMATION' | 'BACKUP_PROFILE' | 'IMAGES' | 'TRADE_AREA';

interface InfoPanelProps {
  poiId: string;
  uid: string;
  storeCode: string;
  location?: LocationInfo | null;
  onClose: () => void;
  type?: 'default' | 'env';
  coordinateBasicInfo?: CoordinateBasicInfo | null;
  isCreateBackupArea?: boolean;
  isUpdateForm?: boolean;
  // selectComponent?: InfoComponent;
  onTabChange?: (tab: TabName) => void;
  // startTab?: InfoComponent;
}

const getRefForContext = (
  type: 'default' | 'env',
  activeTab: TabName,
  refs: {
    basic: RefObject<BasicInfoRef | null>;
    envInfo: RefObject<BasicInfoRef | null>;
    envBackup: RefObject<BackupProfileRef | null>;
    backup: RefObject<BackupProfileRef | null>;
  }
): RefObject<BasicInfoRef | BackupProfileRef | null> => {
  if (type === 'env') {
    return activeTab === 'Backup Profile' ? refs.envBackup : refs.envInfo;
  }
  return activeTab === 'Backup Profile' ? refs.backup : refs.basic;
};

export const InfoPanel = ({
  poiId,
  uid,
  storeCode,
  location,
  onClose,
  type = 'default',
  coordinateBasicInfo = null,
  isCreateBackupArea = false,
  isUpdateForm = true,
  // selectComponent,
  onTabChange,
  // startTab = 'INFORMATION',
}: InfoPanelProps) => {
  const { t } = useTranslation('common');
  const { currentTap, setCurrentTap } = useInfoPanelStore();
  const [haveBackupProfile] = useBackupProfileStore(state => [state.haveBackupProfile]);
  const [currentComponent, setCurrentComponent] =
    useState<React.ComponentType<any> | null>(BasicInfo);
  const [activeTab, setActiveTab] = useState<TabName>('Information');
  const [tabComponentMap, setTabComponentMap] = useState<ComponentMapItem[]>([]);
  const [pendingClose, setPendingClose] = useState(false);
  const [showPOIApprovalButton, setShowPOIApprovalButton] = useState<boolean>(false);
  const [isApprovalButtonEnabled, setIsApprovalButtonEnabled] = useState<boolean>(false);
  const [poiLayerId, setPoiLayerId] = useState<number | null>(null);

  const basicInfoRef = useRef<BasicInfoRef>(null);
  const envInfoRef = useRef<BasicInfoRef>(null);
  const envBackupRef = useRef<BackupProfileRef>(null);
  const backupProfileRef = useRef<BackupProfileRef>(null);

  const componentsMap = useMemo(
    () =>
      new Map<InfoComponent, ComponentMapItem>([
        [
          'INFORMATION',
          {
            tabName: 'Information',
            component: () => Promise.resolve({ default: BasicInfo }),
          },
        ],
        [
          'BACKUP_PROFILE',
          {
            tabName: 'Backup Profile',
            component: () =>
              Promise.resolve({
                default: BackupProfile as React.ComponentType<ComponentProps>,
              }),
          },
        ],
        [
          'IMAGES',
          {
            tabName: 'Images',
            component: () => Promise.resolve({ default: Images }),
          },
        ],
        [
          'TRADE_AREA',
          {
            tabName: 'Trade Area',
            component: () =>
              Promise.resolve({
                default: TradeArea as React.ComponentType<ComponentProps>,
              }),
          },
        ],
      ]),
    []
  );

  const initialTabs = useCallback(
    (layerProperties: InfoComponent[]) => {
      const mapTabs = layerProperties
        .map(property => componentsMap.get(property))
        .filter((tab): tab is ComponentMapItem => tab !== undefined);

      setTabComponentMap(mapTabs);
    },
    [componentsMap]
  );

  // useEffect(() => {
  //   if (startTab) {
  //     setActiveTab(startTab);
  //     const target = getComponentByTabName(startTab);
  //     setCurrentComponent(() => target);
  //   }
  // }, [startTab]);
  //
  const toConstantCase = useCallback((str: string): string => {
    return str.toUpperCase().trim().replace(/\s+/g, '_');
  }, []);

  const onTabSelect = useCallback(
    async (componentLoader: ComponentMapItem['component'], tabName: TabName) => {
      const loadedComponent = await componentLoader();
      setCurrentComponent(() => loadedComponent.default);
      const constantName = toConstantCase(tabName) as unknown as InfoComponent;
      setCurrentTap(constantName);
      setActiveTab(tabName);
      onTabChange?.(tabName);
    },
    [onTabChange, toConstantCase, setCurrentTap]
  );

  const activeRef = useMemo(() => {
    return getRefForContext(type, activeTab, {
      basic: basicInfoRef,
      envInfo: envInfoRef,
      envBackup: envBackupRef,
      backup: backupProfileRef,
    });
  }, [type, activeTab]);

  useEffect(() => {
    const fetchData = async () => {
      if (poiId === '') {
        initialTabs(['INFORMATION', 'TRADE_AREA']);
        return;
      }

      try {
        const poiInfo = await fetchPoiByPoiId(
          typeof poiId === 'string' ? Number(poiId) : poiId
        );
        const tabs = poiInfo?.layerProperties || [];
        setPoiLayerId(poiInfo?.layerId ?? null);
        initialTabs(['INFORMATION', ...tabs]);
      } catch (error) {
        console.error('Failed to fetch POI data:', error);
      }
    };

    fetchData();
  }, [poiId, initialTabs]);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!poiId || poiId === '') {
        setIsApprovalButtonEnabled(false);
        return;
      }

      try {
        const res = await getPotentialStatus(Number.parseInt(poiId));

        if (res.data) {
          // setCurrentWorkflowStepData(res.data);
          setIsApprovalButtonEnabled(res.data?.canAction);
          return;
        }

        const canSendApprove = res.success;
        setIsApprovalButtonEnabled(canSendApprove);
      } catch (error) {
        console.error('Failed to fetch potential status:', error);
        setIsApprovalButtonEnabled(false);
      }
    };

    const checkApprovalStatus = async () => {
      if (!poiId || poiId === '') {
        setShowPOIApprovalButton(false);
        return;
      }

      try {
        const numericPoiId = typeof poiId === 'string' ? Number(poiId) : poiId;
        const hasPendingApproval = await checkPOIHasPendingApproval(numericPoiId);
        setShowPOIApprovalButton(hasPendingApproval);
      } catch (error) {
        console.error('Failed to check POI approval status:', error);
        setShowPOIApprovalButton(false);
      }
    };

    fetchStatus();
    checkApprovalStatus();
  }, [poiId]);

  const onSelectCompoent = useCallback(async () => {
    if (!currentTap) return;
    console.log('onSelectCompoent');
    const componentRef = componentsMap.get(currentTap);

    if (!componentRef) return;

    const loadedComponent = await componentRef.component();
    setCurrentComponent(() => loadedComponent.default);
    setActiveTab(componentRef.tabName);
  }, [componentsMap, setActiveTab, setCurrentComponent, currentTap]);

  useEffect(() => {
    onSelectCompoent();
  }, [onSelectCompoent]);

  const handleClose = useCallback(() => {
    if (
      basicInfoRef.current?.hasUnsavedChanges &&
      basicInfoRef.current.hasUnsavedChanges()
    ) {
      setPendingClose(true);
      basicInfoRef.current.showUnsavedPopup();
    } else {
      onClose();
    }
  }, [onClose]);

  const handleSavedAndClose = useCallback(() => {
    setPendingClose(false);
    onClose();
  }, [onClose]);

  const handleSaveSuccess = useCallback(
    async (newPoiId: number) => {
      try {
        const poiInfo = await fetchPoiByPoiId(newPoiId);
        const tabs = poiInfo?.layerProperties || [];
        initialTabs(['INFORMATION', ...tabs]);
      } catch (error) {
        console.error('Failed to refetch POI data after save:', error);
      }
    },
    [initialTabs]
  );

  const handleSaveClick = useCallback(() => {
    const ref = activeRef.current;
    if (!ref) return;

    switch (true) {
      case type === 'env' && activeTab === 'Backup Profile':
        (ref as BackupProfileRef).handleSave();
        break;
      case type === 'env':
        (ref as BasicInfoRef).handleSave();
        break;
      case activeTab === 'Backup Profile':
        (ref as BackupProfileRef).handleSave();
        break;
      default:
        if (isUpdateForm) {
          (ref as BasicInfoRef).handleUpdate();
        } else {
          (ref as BasicInfoRef).handleSave();
        }
        break;
    }
  }, [type, activeTab, activeRef, isUpdateForm]);

  const handleEditBackup = useCallback(() => {
    if (activeTab === 'Backup Profile') {
      const ref = type === 'env' ? envBackupRef : backupProfileRef;
      ref.current?.handleEditBackup?.();
    }
  }, [activeTab, type]);

  const handleSendApproval = useCallback(() => {
    basicInfoRef.current?.handleSendRequestApprove();
  }, []);

  const refreshApprovalStatus = useCallback(async () => {
    if (!poiId || poiId === '') {
      setShowPOIApprovalButton(false);
      return;
    }

    try {
      const numericPoiId = typeof poiId === 'string' ? Number(poiId) : poiId;
      const hasPendingApproval = await checkPOIHasPendingApproval(numericPoiId);
      setShowPOIApprovalButton(hasPendingApproval);
    } catch (error) {
      console.error('Failed to check POI approval status:', error);
      setShowPOIApprovalButton(false);
    }
  }, [poiId]);

  const shouldShowButtons = useMemo(() => {
    if (type === 'env' && activeTab === 'Information') {
      return true;
    }

    if (
      type !== 'env' &&
      (activeTab === 'Information' || activeTab === 'Backup Profile')
    ) {
      return true;
    }

    return false;
  }, [type, activeTab]);

  const shouldShowEnvBackupButtons = useMemo(() => {
    return type === 'env' && activeTab === 'Backup Profile';
  }, [type, activeTab]);

  // const [currentWorkflowStepData, setCurrentWorkflowStepData] =
  //   useState<CurrentWorkflowStepData>();

  // const handlerAction = async (actionCode: string) => {
  //   try {
  //     const res = await updatePotentialApprove(Number.parseInt(poiId), actionCode);

  //     if (res.success) {
  //       // showPopup('success', 'ดำเนินการสำเร็จ');
  //       const statusRes = await getPotentialStatus(Number.parseInt(poiId));
  //       if (statusRes.success) {
  //         setCurrentWorkflowStepData(statusRes.data);
  //       }
  //     } else {
  //       // showPopup('error', 'เกิดข้อผิดพลาดในการดำเนินการ');
  //     }
  //   } catch (error) {
  //     console.error('Error in handlerAction:', error);
  //     // showPopup('error', 'เกิดข้อผิดพลาดในการดำเนินการ');
  //   }
  // };

  // const setVariantByActionCode = (
  //   actionCode: string
  // ):
  //   | 'primary'
  //   | 'success'
  //   | 'secondary'
  //   | 'outline'
  //   | 'danger'
  //   | 'error'
  //   | 'warning'
  //   | 'accent' => {
  //   switch (actionCode) {
  //     case 'SAVE':
  //       return 'primary';
  //     case 'SEND_APPROVE':
  //       return 'accent';
  //     case 'CANCEL':
  //       return 'outline';
  //     case 'APPROVE':
  //       return 'success';
  //     case 'NOT_APPROVE':
  //       return 'danger';
  //     case 'REJECT':
  //       return 'error';
  //     default:
  //       return 'primary';
  //   }
  // };

  // const setIconByActionCode = (actionCode: string) => {
  //   switch (actionCode) {
  //     case 'SAVE':
  //       return <DocumentCheckIcon className="size-6" />;
  //     case 'SEND_APPROVE':
  //       return <PaperAirplaneIcon className="size-6" />;
  //     case 'CANCEL':
  //       return <TrashIcon className="size-6" />;
  //     case 'APPROVE':
  //       return <CheckCircleIcon className="size-6" />;
  //     case 'NOT_APPROVE':
  //       return <XCircleIcon className="size-6" />;
  //     case 'REJECT':
  //       return <ArrowUturnLeftIcon className="size-6" />;
  //     default:
  //       return null;
  //   }
  // };

  if (isCreateBackupArea) return null;

  const panelWidth =
    activeTab === 'Backup Profile'
      ? 'max-w-[800px]'
      : activeTab === 'Trade Area'
        ? 'w-[80%]'
        : activeTab === 'Information'
          ? 'w-[760px]'
          : 'max-w-[660px]';

  return (
    <Card className={`${panelWidth} max-h-[80vh] mt-12 flex flex-col`}>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="p-3 col-span-2">
          {type === 'env' ? 'สร้างข้อมูลสภาพแวดล้อม' : ''}
        </div>
      </div>
      <div role="tablist" className="tabs tabs-border">
        {tabComponentMap.map((item, index) => (
          <a
            key={index}
            role="tab"
            className={`tab ${activeTab === item.tabName ? 'tab-active' : ''}`}
            onClick={() => onTabSelect(item.component, item.tabName)}
          >
            {item.tabName}
          </a>
        ))}
      </div>
      <div className="divider mt-0 mb-0"></div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
        {currentComponent && (
          <Suspense fallback={<div>Loading...</div>}>
            {createElement(currentComponent, {
              poiId,
              uid,
              storeCode,
              layerId: poiLayerId,
              ref: activeRef,
              onSavedAndClose: pendingClose ? handleSavedAndClose : undefined,
              type,
              location,
              coordinateBasicInfo,
              isUpdateForm,
              onSaveSuccess: handleSaveSuccess,
            })}
          </Suspense>
        )}
      </div>

      <div className="divider mt-2 mb-2 flex-shrink-0"></div>
      {shouldShowButtons && (
        <div className="flex justify-end gap-3 flex-shrink-0 pb-2">
          <Button
            variant="outline"
            className="w-32 border-blue-600 text-blue-500"
            size="sm"
            onClick={handleClose}
          >
            {t('close')}
          </Button>

          {/* BackupProfile */}
          {activeTab === 'Backup Profile' && (
            <Button
              variant="outline"
              className="w-32 border-blue-600 text-blue-500"
              size="sm"
              onClick={handleEditBackup}
              disabled={!haveBackupProfile}
            >
              แก้ไข Backup
            </Button>
          )}
          <Button
            variant={activeTab === 'Backup Profile' ? 'primary' : 'outline'}
            className={
              activeTab === 'Backup Profile'
                ? 'w-32 bg-blue-600 text-white hover:bg-blue-700'
                : 'w-32 border-blue-600 text-blue-500'
            }
            size="sm"
            onClick={handleSaveClick}
            disabled={!haveBackupProfile && activeTab === 'Backup Profile'}
          >
            {t('save')}
          </Button>

          {type !== 'env' && activeTab === 'Information' && (
            <>
              {/*{!showPOIApprovalButton && (
                <Button
                  className={`w-32 bg-blue-600 text-white hover:bg-blue-700 ${!isApprovalButtonEnabled ? ' opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!isApprovalButtonEnabled}
                  size="sm"
                  onClick={handleSendApproval}
                >
                  {isApprovalButtonEnabled ? 'ส่งอนุมัติ' : 'รอส่งอนุมัติ'}
                </Button>
              )}*/}
              {/*{currentWorkflowStepData?.availableActions?.map(action => {
                return (
                  <Button
                    key={action.actionCode}
                    variant={setVariantByActionCode(action.actionCode)}
                    icon={setIconByActionCode(action.actionCode)}
                    onClick={() => {
                      handlerAction(action.actionCode);
                    }}
                  >
                    {action.actionName}
                  </Button>
                );
              })}*/}
              {isApprovalButtonEnabled && (
                <Button
                  className={`w-32 bg-blue-600 border-blue-600 text-white hover:bg-blue-700${!isApprovalButtonEnabled ? ' opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!isApprovalButtonEnabled}
                  size="sm"
                  onClick={handleSendApproval}
                >
                  ส่งขออนุมัติ
                </Button>
              )}
              {showPOIApprovalButton && (
                <POIApprovalModal
                  poiId={poiId}
                  onApprovalSuccess={refreshApprovalStatus}
                />
              )}
            </>
          )}
        </div>
      )}
      {shouldShowEnvBackupButtons && (
        <div className="flex justify-end gap-3 flex-shrink-0">
          <Button
            variant="outline"
            className="w-32 border-blue-600 text-blue-500"
            size="sm"
            onClick={handleClose}
          >
            {t('close')}
          </Button>
          <Button
            variant="outline"
            className="w-32 border-blue-600 text-blue-500"
            size="sm"
            onClick={handleEditBackup}
          >
            แก้ไข Backup
          </Button>
          <Button
            variant="outline"
            className="w-32 border-blue-600 text-blue-500"
            size="sm"
            onClick={handleSaveClick}
          >
            บันทึก
          </Button>
        </div>
      )}
    </Card>
  );
};
