import {
  createElement,
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from 'react';
import type { PotentialFormData } from '../pointpotential/TabInformation/Potential';
import type { SevenFormData } from '../pointpotential/TabInformation/Seven';
import type { VendingMachineFormData } from '../pointpotential/TabInformation/VendingMachine';
import Potential from '../pointpotential/TabInformation/Potential';
import Seven from '../pointpotential/TabInformation/Seven';
import Vending from '../pointpotential/TabInformation/VendingMachine';
import SevenInfo from '../pointpotential/TabInformation/SevenInfo';
import PopupAlert from '../../../components/base/PopupAlert';
import {
  createPoiPotential,
  updatePOIPotential,
  type CreatePoiRequest,
  type UpdatePoiRequest,
} from '../../../services/location.service';
import type { CoordinateBasicInfo } from '../../../components/base/LocationClickPopup';
import { fetchPotentialByPoiId } from '../../../services/location.service';
import { sendApprove } from '@/services/potential.service';
import { useTranslation } from 'react-i18next';
import { useMapStore } from '@/stores/mapStore';

const initialPotential: PotentialFormData = {
  name: '',
  address: '',
  tradeType: '',
  locationType: '',
  areaType: '',
  cigaretteSale: 0,
  alcoholSale: 0,
};
const initialSeven: SevenFormData = {
  name: '',
  storeCode: '',
  standardLayout: '',
  estimateDateOpen: '',
  impactType: '',
  impactDetail: '',
  storeBuildingType: '',
  investmentType: '',
  dimension: {
    width: '',
    length: '',
    saleArea: '',
    stockArea: '',
    storeArea: '',
  },
  parkingCount: '',
};
const initialVending: VendingMachineFormData = {
  businessTypeCode: '',
  status: '',
  parentBranchCode: '',
  motherStoreName: '',
  name: '',
  vendingCode: '',
  serialNumber: '',
  model: '',
  installationType: '',
  position: '',
  floor: '',
  address: '',
  contractStartDate: '',
  contractEndDate: '',
  contractCancelDate: '',
  serviceStartDate: '',
  serviceEndDate: '',
};

const sidebarMenus = [
  { sidetab: 'potential' },
  { sidetab: 'seven' },
  { sidetab: 'vending' },
] as const;

type SidebarType = (typeof sidebarMenus)[number]['sidetab'];

export interface BasicInfoRef {
  handleSave: () => void;
  handleUpdate: () => void;
  handleSendRequestApprove: () => void;
  validate: () => boolean;
  isReadyToSend: () => boolean;
  hasUnsavedChanges: () => boolean;
  showUnsavedPopup: () => void;
}

const BasicInfo = forwardRef<
  BasicInfoRef,
  {
    poiId: string;
    onSavedAndClose?: () => void;
    onFormStateChange?: (state: {
      showSevenForm: boolean;
      showVendingForm: boolean;
    }) => void;
    coordinateBasicInfo?: CoordinateBasicInfo | null;
    isUpdateForm: boolean;
    onSaveSuccess?: (poiId: number) => void;
    layerId?: number | null;
  }
>(
  (
    {
      poiId,
      onSavedAndClose,
      onFormStateChange,
      coordinateBasicInfo,
      isUpdateForm,
      onSaveSuccess,
      layerId,
    },
    ref
  ) => {
    const { t } = useTranslation(['maps']);
    const setCreatedPoiId = useMapStore(state => state.setCreatedPoiId);

    const useSevenInfo = layerId === 1;

    const [activeSidebar, setActiveSidebar] = useState<SidebarType>('potential');
    const [potentialData, setPotentialData] = useState<PotentialFormData>({
      ...initialPotential,
    });
    const [sevenData, setSevenData] = useState<SevenFormData>({ ...initialSeven });
    const [showSevenForm, setShowSevenForm] = useState(false);
    const [vendingData, setVendingData] = useState<VendingMachineFormData>({
      ...initialVending,
    });
    const [showVendingForm, setShowVendingForm] = useState(false);
    const [popupOpen, setPopupOpen] = useState(false);
    const [popupType, setPopupType] = useState<'success' | 'error' | 'info'>('success');
    const [popupMessage, setPopupMessage] = useState('');
    const [showUnsavedPopup, setShowUnsavedPopup] = useState(false);
    const [showConfirmApprovalPopup, setShowConfirmApprovalPopup] = useState(false);

    const [pendingAutoClose, setPendingAutoClose] = useState(false);
    const [savedPoiId, setSavedPoiId] = useState<number | null>(null);

    const [invalidFields, setInvalidFields] = useState<string[]>([]);

    const [sevenFormValidated, setSevenFormValidated] = useState(false);
    const [vendingFormValidated, setVendingFormValidated] = useState(false);

    // Store POI coordinates for distance calculation
    const [poiCoordinates, setPoiCoordinates] = useState<{
      lat: number;
      long: number;
    } | null>(null);

    const fetchFormData = async (id: number) => {
      try {
        const result = await fetchPotentialByPoiId(id);
        const poi = result.poi;
        const potential = result.potentialStore;
        const seven = result.sevenEleven;
        const vending = result.vendingMachine;

        if (poi && potential) {
          // Store coordinates if available in the POI shape
          if (poi.shape?.coordinates && Array.isArray(poi.shape.coordinates)) {
            const coords = {
              long: poi.shape.coordinates[0],
              lat: poi.shape.coordinates[1],
            };
            setPoiCoordinates(coords);
          }

          const potentialData: PotentialFormData = {
            name: poi.name,
            address: poi.locationT,
            tradeType: '',
            locationType: potential.locationType ?? '',
            areaType: potential.areaType ?? '',
            alcoholSale: potential.canSaleAlcohol === 'Y' ? 1 : 0,
            cigaretteSale: potential.canSaleCigarette === 'Y' ? 1 : 0,
            zoneCode: poi.zoneCode ?? '',
            subZoneCode: poi.subzoneCode ?? '',
            status: potential.status ?? '',
            approveStatus: potential.approveStatus ?? '',
            grade: potential.grade ?? '',
          };
          setPotentialData(potentialData);

          if (seven) {
            const sevenData: SevenFormData = {
              name: seven.name ?? '',
              storeCode: seven.storeCode ?? seven.storecode ?? '',
              standardLayout: seven.standardLayout ?? '',
              estimateDateOpen: seven.estimateDateOpen ?? '',
              impactType: seven.impactTypeSite?.toString() ?? '',
              impactDetail: seven.impactDetail ?? '',
              storeBuildingType: seven.storeFranchise?.toString() ?? '',
              investmentType: seven.storeFranchise?.toString() ?? '',
              dimension: {
                width: seven.storeWidth?.toString() ?? '',
                length: seven.storeLength?.toString() ?? '',
                saleArea: seven.saleArea?.toString() ?? '',
                stockArea: seven.stockArea?.toString() ?? '',
                storeArea: seven.storeArea?.toString() ?? '',
              },
              parkingCount: seven.parkingCount?.toString() ?? '',
            };
            setSevenData(sevenData);
            setShowSevenForm(true);
          } else {
            setSevenData({ ...initialSeven });
            setShowSevenForm(false);
          }

          if (vending) {
            const vendingData: VendingMachineFormData = {
              businessTypeCode: vending.businessTypeCode ?? '',
              status: potential.status,
              parentBranchCode: vending.storecode ?? '',
              motherStoreName: vending.motherStoreName ?? '',
              name: vending.name ?? '',
              vendingCode: vending.machineId ?? '',
              serialNumber: vending.serialNumber ?? '',
              model: vending.vendingModel ?? '',
              installationType: vending.vendingType ?? '',
              position: vending.targetPoint ? String(vending.targetPoint) : '',
              floor: vending.floor ?? '',
              address: vending.locationAddress ?? '',
              contractStartDate: vending.contractStartDate ?? '',
              contractEndDate: vending.contractFinishDate ?? '',
              contractCancelDate: vending.contractCancelDate ?? '',
              serviceStartDate: vending.openDate ?? '',
              serviceEndDate: vending.closeDate ?? '',
            };
            setVendingData(vendingData);
            setShowVendingForm(true);
          } else {
            setVendingData({ ...initialVending });
            setShowVendingForm(false);
          }
        }
      } catch (error) {
        console.error('[API Error]', error);
        setPopupType('error');
        setPopupMessage(t('error_fetch_poi_data'));
        setPopupOpen(true);
      }
    };

    useEffect(() => {
      if (poiId && isUpdateForm) {
        fetchFormData(parseInt(poiId));
      }
    }, [poiId]);

    const isFormEmpty = (
      formObj: PotentialFormData | SevenFormData | VendingMachineFormData
    ) => {
      if (formObj && typeof formObj === 'object' && 'dimension' in formObj) {
        // For SevenFormData
        const { dimension, ...rest } = formObj;
        return (
          Object.values(rest).every(v => v === '') &&
          Object.values(dimension || {}).every(v => v === '')
        );
      }
      return Object.values(formObj).every(v => v === '');
    };
    // Required fields for each form (with *)
    const requiredPotential = ['name', 'cigaretteSale', 'alcoholSale'];
    const requiredSeven = [
      'name',
      'dimension.width',
      'dimension.length',
      'dimension.saleArea',
      'dimension.stockArea',
      'dimension.storeArea',
      'parkingCount',
    ];
    const requiredVending = ['parentBranchCode', 'floor'];
    // Validate required fields helper
    const validateRequired = (data: Record<string, any>, required: string[]) => {
      return required.every(field => {
        if (field.startsWith('dimension.')) {
          const key = field.split('.')[1];
          return (
            !!data.dimension &&
            data.dimension[key] !== undefined &&
            data.dimension[key] !== ''
          );
        }
        // Special case for number fields that can be 0
        if (field === 'cigaretteSale' || field === 'alcoholSale') {
          return data[field] !== undefined && data[field] !== null && data[field] !== '';
        }
        return !!data[field] && data[field].toString().trim() !== '';
      });
    };

    const validate = () => {
      let invalid: string[] = [];
      // Potential
      if (
        !validateRequired(potentialData, requiredPotential) &&
        !isFormEmpty(potentialData)
      ) {
        invalid = invalid.concat(
          requiredPotential.filter(f => {
            if (f === 'cigaretteSale' || f === 'alcoholSale') {
              return potentialData[f] === undefined || potentialData[f] === null;
            }
            return (
              !(potentialData as Record<string, any>)[f] ||
              (potentialData as Record<string, any>)[f].toString().trim() === ''
            );
          })
        );
      }
      // Seven
      if (showSevenForm && !validateRequired(sevenData, requiredSeven)) {
        invalid = invalid.concat(
          requiredSeven.filter(f => {
            if (f.startsWith('dimension.')) {
              const key = f.split('.')[1];
              return (
                !sevenData.dimension ||
                !(sevenData.dimension as any)[key] ||
                (sevenData.dimension as any)[key].toString().trim() === ''
              );
            }
            return (
              !(sevenData as any)[f] || (sevenData as any)[f].toString().trim() === ''
            );
          })
        );
      }
      // Vending
      if (showVendingForm && !validateRequired(vendingData, requiredVending)) {
        invalid = invalid.concat(
          requiredVending.filter(
            f =>
              !(vendingData as Record<string, any>)[f] ||
              (vendingData as Record<string, any>)[f].toString().trim() === ''
          )
        );
      }
      // All empty
      if (
        isFormEmpty(potentialData) &&
        isFormEmpty(sevenData) &&
        isFormEmpty(vendingData)
      ) {
        invalid = [...requiredPotential, ...requiredSeven, ...requiredVending];
      }
      setInvalidFields(invalid);
      // Mark that Seven/Vending have been validated after showForm
      if (showSevenForm) setSevenFormValidated(true);
      if (showVendingForm) setVendingFormValidated(true);
      if (invalid.length > 0) {
        setPopupType('error');
        setPopupMessage(t('error_required_fields'));
        setPopupOpen(true);
        return false;
      }
      return true;
    };

    const handleSave = async () => {
      try {
        if (!validate()) {
          return;
        }

        const createData: CreatePoiRequest = {
          type: 'POTENTIAL',
          longitude: coordinateBasicInfo?.longitude || 0,
          latitude: coordinateBasicInfo?.latitude || 0,
          zone: coordinateBasicInfo?.zone || '',
          subzone: coordinateBasicInfo?.subzone || '',
        };

        if (!isFormEmpty(potentialData)) {
          createData.potential = potentialData;
        }

        if (!isFormEmpty(sevenData)) {
          createData.seven = { ...sevenData };
        }

        if (!isFormEmpty(vendingData)) {
          createData.vending = {
            ...vendingData,
            floor: vendingData?.floor?.toString() || '',
          };
        }

        const response = await createPoiPotential(createData);
        const newPoiId =
          (response as any)?.poiId ?? (response as any)?.data?.poiId ?? null;
        if (newPoiId) {
          setSavedPoiId(newPoiId);
        }
        setPopupType('success');
        setPopupMessage(t('save_data_success'));
        setPopupOpen(true);
        setPendingAutoClose(true);
      } catch (error) {
        console.error('[API Error]', error);
        setPopupType('error');
        setPopupMessage(t('error_save_data'));
        setPopupOpen(true);
      }
    };

    const handleUpdate = async (autoClose = false) => {
      try {
        if (!validate()) return;

        const updateData: UpdatePoiRequest = {
          type: 'POTENTIAL',
          longitude: coordinateBasicInfo?.longitude || 0,
          latitude: coordinateBasicInfo?.latitude || 0,
        };

        if (!isFormEmpty(potentialData)) {
          updateData.potential = potentialData;
        }

        if (showSevenForm) {
          updateData.seven = { ...sevenData };
        }

        if (showVendingForm) {
          updateData.vending = {
            ...vendingData,

            vendingCode: vendingData.vendingCode || undefined,
            machineId: vendingData.vendingCode || undefined,
            floor: vendingData?.floor?.toString() || '0',
          };
        }

        await updatePOIPotential(parseInt(poiId), updateData);

        setPopupType('success');
        setPopupMessage(t('update_data_success'));
        setPopupOpen(true);
        if (autoClose) setPendingAutoClose(true);
      } catch (error) {
        console.error('[API Error]', error);
        setPopupType('error');
        setPopupMessage(t('error_update_data'));
        setPopupOpen(true);
      }
    };

    const handleSendRequestApprove = async () => {
      setShowConfirmApprovalPopup(true);
    };

    const handleConfirmSendApproval = async () => {
      setShowConfirmApprovalPopup(false);
      try {
        const response = await sendApprove(parseInt(poiId));
        if (!response.success) {
          throw new Error(response.message || t('error_send_approval'));
        }

        setPopupType('success');
        setPopupMessage(t('send_approval_success'));
      } catch (error: unknown) {
        setPopupType('error');
        setPopupMessage(
          (error as { message?: string })?.message || t('error_send_approval')
        );
      } finally {
        setPopupOpen(true);
      }
    };

    const handleCancelSendApproval = () => {
      setShowConfirmApprovalPopup(false);
    };

    const isReadyToSend = () => showSevenForm || showVendingForm;

    const hasUnsavedChanges = () => {
      // unsaved changes
      const isEqual = (a: Record<string, any>, b: Record<string, any>) => {
        const keys = Object.keys(a);
        for (const k of keys) {
          if (a[k] !== b[k]) return false;
        }
        return true;
      };

      return (
        !isEqual(potentialData, initialPotential) ||
        !isEqual(sevenData, initialSeven) ||
        !isEqual(vendingData, initialVending)
      );
    };

    const showUnsavedPopupFn = () => setShowUnsavedPopup(true);

    useImperativeHandle(
      ref,
      () => ({
        handleSave,
        handleUpdate,
        handleSendRequestApprove,
        validate,
        isReadyToSend,
        hasUnsavedChanges,
        showUnsavedPopup: showUnsavedPopupFn,
        showSevenForm,
        showVendingForm,
      }),
      [potentialData, sevenData, vendingData, showSevenForm, showVendingForm]
    );

    const handleUnsavedSave = () => {
      setShowUnsavedPopup(false);

      if (poiId) {
        handleUpdate();
      } else {
        handleSave();
      }
    };
    const handleUnsavedDiscard = () => {
      setShowUnsavedPopup(false);
      if (onSavedAndClose) {
        onSavedAndClose();
      }
    };

    return (
      <div className="flex h-fit">
        {useSevenInfo ? (
          <div className="overflow-y-auto max-h-[500px] w-full">
            <SevenInfo poiId={poiId} />
          </div>
        ) : (
          <>
            <div className="w-30 bg-blue-50/50 border-r flex flex-col">
              {sidebarMenus.map((menu, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setActiveSidebar(menu.sidetab);
                  }}
                  className={`flex items-center justify-between px-6 py-4 pl-4 text-left font-medium transition-all ${
                    activeSidebar === menu.sidetab
                      ? 'bg-blue-600 text-white'
                      : 'text-blue-800 hover:bg-blue-100'
                  }`}
                >
                  <span>{t(`sidebar_${menu.sidetab}`)}</span>
                  {activeSidebar === menu.sidetab && <span>›</span>}
                </button>
              ))}
            </div>

            <div className="flex-1 pb-6 bg-white">
              <div className="overflow-y-auto max-h-[500px]">
                {(() => {
                  switch (activeSidebar) {
                    case 'potential':
                      return createElement(Potential, {
                        poiId,
                        formData: potentialData,
                        onDataChange: setPotentialData,
                        invalidFields,
                        coordinateBasicInfo,
                      });
                    case 'seven':
                      return createElement(Seven, {
                        key: poiId,
                        poiId,
                        formData: sevenData,
                        onDataChange: setSevenData,
                        showForm: showSevenForm,
                        setShowForm: (show: boolean) => {
                          setShowSevenForm(show);
                          setSevenFormValidated(false);
                          if (onFormStateChange)
                            onFormStateChange({ showSevenForm: show, showVendingForm });
                        },
                        invalidFields:
                          showSevenForm && sevenFormValidated ? invalidFields : [],
                      });
                    case 'vending':
                      return createElement(Vending, {
                        key: poiId,
                        poiId,
                        formData: vendingData,
                        onDataChange: setVendingData,
                        showForm: showVendingForm,
                        setShowForm: (show: boolean) => {
                          setShowVendingForm(show);
                          setVendingFormValidated(false);
                          if (onFormStateChange)
                            onFormStateChange({ showSevenForm, showVendingForm: show });
                        },
                        invalidFields:
                          showVendingForm && vendingFormValidated ? invalidFields : [],

                        lat: poiCoordinates?.lat || coordinateBasicInfo?.latitude || 0,
                        long: poiCoordinates?.long || coordinateBasicInfo?.longitude || 0,
                      });
                    default:
                      return null;
                  }
                })()}
              </div>
              <PopupAlert
                open={popupOpen}
                type={popupType}
                message={popupMessage}
                onClose={() => {
                  setPopupOpen(false);
                  if (pendingAutoClose) {
                    setPendingAutoClose(false);
                    if (savedPoiId) {
                      // Trigger ControlPanel to select the newly created POI
                      setCreatedPoiId(String(savedPoiId));
                      onSaveSuccess?.(savedPoiId);
                    }
                    if (onSavedAndClose) {
                      onSavedAndClose();
                    }
                  }
                }}
              />
              <PopupAlert
                open={showUnsavedPopup}
                type="info"
                message={t('unsaved_changes_message')}
                confirmText={t('save_button')}
                cancelText={t('dont_save_button')}
                onConfirm={handleUnsavedSave}
                onCancel={handleUnsavedDiscard}
                onClose={handleUnsavedDiscard}
              />
              <PopupAlert
                open={showConfirmApprovalPopup}
                type="info"
                title={t('confirm_send_approval_title')}
                message={t('confirm_send_approval_message')}
                confirmText={t('confirm_button')}
                cancelText={t('cancel_button')}
                onConfirm={handleConfirmSendApproval}
                onCancel={handleCancelSendApproval}
                onClose={handleCancelSendApproval}
              />
            </div>
          </>
        )}
      </div>
    );
  }
);

export default BasicInfo;
