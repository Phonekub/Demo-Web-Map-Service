import {
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchBackupProfile, updateBackupProfile } from '@/services/backup.service';
import { useUserStore } from '@/stores/userStore';
import { useMapStore } from '@/stores/mapStore';
import type { LocationInfo } from '@/services/location.service';
import { fetchBackupProfileLayers, fetchPoiByPoiId } from '@/services/location.service';

import StrategicTab from './TabBackup/StrategicTab';
import { EmptyProfileState } from './TabBackup/EmptyProfileState';
import PopupAlert from '../../../components/base/PopupAlert';

import { useBackupProfileStore, type GeoPolygon } from '@/stores/backupProfileStore';

import BackupTab from './TabBackup/BackupTab';
import LocationTab from './TabBackup/locationTab';
import CompetitorTab from './TabBackup/competitorTab';
import SevenTab from './TabBackup/sevenTab';
import CommentTab from './TabBackup/commentTab';
import { useTranslation } from 'react-i18next';
import type { PolygonLayer } from '@/components/basemap/BaseMap';
//import { getPotentialStatus, updatePotentialApprove } from '@/services/potential.service';
//import type { CurrentWorkflowStepData } from '@/services/workflow.service';
// import {
//   ArrowUturnLeftIcon,
//   CheckCircleIcon,
//   PaperAirplaneIcon,
//   PencilSquareIcon,
//   TrashIcon,
//   XCircleIcon,
// } from '@heroicons/react/24/solid';

// ============================================================================
// Types & Constants
// ============================================================================

interface BackupProps {
  poiId: string;
  location: LocationInfo | null;
}

export interface BackupRef {
  handleSave: () => void;
  handleEditBackup: () => void;
}

const EDIT_LAYER_ID = 'area-results';

// strict tuple type so TS won’t complain
type LngLatTuple = [number, number];

function normalizeRing(ring: any[] | undefined | null): LngLatTuple[] | null {
  if (!Array.isArray(ring) || ring.length < 3) return null;

  const cleaned: LngLatTuple[] = ring
    .map((p: any) => [Number(p?.[0]), Number(p?.[1])] as LngLatTuple)
    .filter(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat));

  if (cleaned.length < 3) return null;

  const first = cleaned[0];
  const last = cleaned[cleaned.length - 1];

  const closed: LngLatTuple[] =
    first[0] === last[0] && first[1] === last[1] ? cleaned : [...cleaned, first];

  return closed;
}

function ringKey(ring: LngLatTuple[] | null): string {
  if (!ring || ring.length < 3) return 'no-ring';
  // stable key for react-query
  return ring.map(([lng, lat]) => `${lng.toFixed(6)},${lat.toFixed(6)}`).join('|');
}

export default forwardRef<BackupRef, BackupProps>(function Backup(
  { poiId, location },
  ref
) {
  // ============================================================================
  // Hooks & Translations
  // ============================================================================
  const { t } = useTranslation(['backup']);

  const SIDEBAR_TABS = [
    'Backup',
    t('backup:strategicGroup'),
    t('backup:location'),
    t('backup:competitor'),
    '7-Eleven',
    t('backup:comment'),
  ] as const;

  type SidebarTab = (typeof SIDEBAR_TABS)[number];

  // ============================================================================
  // State
  // ============================================================================
  const [activeSidebar, setActiveSidebar] = useState<SidebarTab>('Backup');
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupType, setPopupType] = useState<'success' | 'error' | 'info'>('success');
  const [popupMessage, setPopupMessage] = useState('');
  const [showSaveWarning, setShowSaveWarning] = useState(false);
  const [shouldSearchLayers, setShouldSearchLayers] = useState(false);

  // ============================================================================
  // Store
  // ============================================================================
  const {
    setMainProfile,
    setSubProfile,
    setStrategic,
    setBackupRemark,
    syncStreetFoodFromApi,
    setProfiles,
    setProfilePois,
    setCompetitors,
    setShape,
    setUid,
    setHaveBackupProfile,
  } = useBackupProfileStore();

  const user = useUserStore(state => state.user);

  const {
    setCreatingAreaStoreId,
    setIsCreatingBackupProfile,
    setIsCreatingArea,

    setPolygonLayers,
    setIsEditing,
    setEditingAreaId,

    setEditedCoordinates,
    setAreaCoordinates,
    editedCoordinates,
    isEditing,
    editingAreaId,
    areaCoordinates,

    setDrawMode,
  } = useMapStore();

  // ============================================================================
  // Data Fetching
  // ============================================================================
  const {
    data: backupData,
    refetch: refetchBackupData,
    isLoading: fetchBackupDataLoading,
  } = useQuery({
    queryKey: ['backupProfile', poiId],
    queryFn: () => fetchBackupProfile(poiId),
    enabled: !!poiId,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,

    retry: 0,
  });

  const payload: any = (backupData as any)?.data ?? backupData;

  // Fetch POI data to get nation
  const { data: poiData } = useQuery({
    queryKey: ['poi', poiId],
    queryFn: () => fetchPoiByPoiId(Number(poiId)),
    enabled: !!poiId,
    staleTime: 5 * 60 * 1000,
  });

  const nation = (poiData as any)?.nation || 'TH'; // Default to TH if not found

  // ============================================================================
  // Sync API -> Store
  // ============================================================================
  useEffect(() => {
    if (!payload) {
      setHaveBackupProfile(false);
      setShape(null);
      return;
    }
    setHaveBackupProfile(true);
    setUid(payload.uid ?? '');

    setMainProfile(payload.mainProfile ?? null);
    setSubProfile(payload.subProfile ?? null);

    setBackupRemark(payload.backupRemark ?? '');
    syncStreetFoodFromApi(payload.streetFood);

    setProfiles(Array.isArray(payload.profiles) ? payload.profiles : []);
    setProfilePois(Array.isArray(payload.profilePois) ? payload.profilePois : []);
    setCompetitors(Array.isArray(payload.competitors) ? payload.competitors : []);

    setShape((payload.shape ?? null) as GeoPolygon | null);
  }, [
    payload,
    refetchBackupData,
    setUid,
    setMainProfile,
    setSubProfile,
    setStrategic,
    setBackupRemark,
    syncStreetFoodFromApi,
    setProfiles,
    setProfilePois,
    setCompetitors,
    setShape,
  ]);

  useEffect(() => {
    // only sync during edit of backup layer
    if (!isEditing) return;
    if (editingAreaId !== EDIT_LAYER_ID) return;
    if (!editedCoordinates || editedCoordinates.length < 3) return;

    // Build GeoJSON ring: [ [lng,lat], ... ] and close ring
    const ring: LngLatTuple[] = editedCoordinates
      .map(p => [Number(p.lng), Number(p.lat)] as LngLatTuple)
      .filter(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat));

    if (ring.length < 3) return;

    const first = ring[0];
    const last = ring[ring.length - 1];
    const closedRing: LngLatTuple[] =
      first[0] === last[0] && first[1] === last[1] ? ring : [...ring, first];

    const newShape: GeoPolygon = {
      type: 'Polygon',
      coordinates: [closedRing],
    };

    setShape(newShape);
  }, [editedCoordinates, isEditing, editingAreaId, setShape]);

  const backupStoreShape = useBackupProfileStore(s => s.shape);

  const searchRing: LngLatTuple[] | null = useMemo(() => {
    // 1) Editing: use editedCoordinates (newest)
    if (isEditing && editingAreaId === EDIT_LAYER_ID && editedCoordinates?.length >= 3) {
      const ring: LngLatTuple[] = editedCoordinates
        .map(p => [Number(p.lng), Number(p.lat)] as LngLatTuple)
        .filter(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat));

      return normalizeRing(ring);
    }

    // 2) Creating: use areaCoordinates
    if (areaCoordinates?.length >= 3) {
      const ring: LngLatTuple[] = areaCoordinates
        .map(p => [Number(p.lng), Number(p.lat)] as LngLatTuple)
        .filter(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat));

      return normalizeRing(ring);
    }

    // 3) Fallback: store shape (only after user action)
    if (backupStoreShape && typeof backupStoreShape === 'object') {
      const ring = (backupStoreShape as GeoPolygon)?.coordinates?.[0];
      return normalizeRing(ring as any[]);
    }

    return null;
  }, [isEditing, editingAreaId, editedCoordinates, areaCoordinates, backupStoreShape]);

  const searchKey = useMemo(() => ringKey(searchRing), [searchRing]);

  // layer search query
  useQuery({
    queryKey: ['backupProfileLayers', poiId, searchKey],
    queryFn: () => fetchBackupProfileLayers(searchRing as LngLatTuple[]),
    enabled: shouldSearchLayers && !!poiId && !!searchRing && searchRing.length >= 3,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Popup
  const showPopup = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setPopupType(type);
    setPopupMessage(message);
    setPopupOpen(true);
  }, []);

  /** Show save warning popup */
  const handleClosePopup = useCallback(() => setPopupOpen(false), []);

  const handleSave = useCallback(() => setShowSaveWarning(true), []);
  const handleCancelSave = useCallback(() => setShowSaveWarning(false), []);

  const handleConfirmSave = useCallback(async () => {
    setShowSaveWarning(false);

    try {
      const uid = payload?.uid;
      if (!uid) {
        showPopup('error', t('backup:notFoundBackupProfile'));
        return;
      }

      const state = useBackupProfileStore.getState();
      const ring = normalizeRing(state.shape?.coordinates?.[0] as any[]);

      if (!ring || ring.length < 4) {
        showPopup('error', t('backup:shapePolygonMinPoints'));
        return;
      }

      const updateData = {
        mainProfile: state.mainProfile,
        subProfile: state.subProfile,
        ...state.strategic,
        backupRemark: state.backupRemark,
        streetFood: state.streetFood,
        shape: 'POLYGON ((' + ring.map(coord => coord.join(' ')).join(', ') + '))',
        profiles: (state.profiles || []).map(p => ({
          ...p,
          backupPercentage: Number((p as any).backupPercentage),
        })),
        profilePois: (state.profilePois || []).map(pp => ({
          ...pp,
          percentPredictCustomer: Number((pp as any).percentPredictCustomer),
        })),
        competitors: (state.competitors || []).map(c => ({
          ...c,
          distance: c.distance != null ? Number(c.distance) : null,
        })),
        updateBy: user?.id || 0,
      };

      await updateBackupProfile(uid, updateData);
      showPopup('success', t('backup:saveSuccess'));
      await refetchBackupData();
    } catch (error) {
      console.error('Error saving backup profile:', error);
      showPopup('error', t('backup:saveError'));
    }
  }, [payload, user?.id, refetchBackupData, showPopup, t]);

  /** Start creating backup profile area on map */
  const handleCreateArea = useCallback(() => {
    setIsCreatingBackupProfile(true);
    setCreatingAreaStoreId(location?.branchCode ?? poiId ?? '');
    setIsCreatingArea(true);
    setShouldSearchLayers(true);
  }, [location, poiId, setIsCreatingBackupProfile, setCreatingAreaStoreId, setIsCreatingArea]);

  // Edit area
  const handleEditBackup = useCallback(() => {
    const backupState = useBackupProfileStore.getState();
    setShouldSearchLayers(true);

    if (!backupState.shape) {
      showPopup('error', t('backup:shapeNotFound'));
      return;
    }

    // shape can be object OR string
    let shape: GeoPolygon | null = null;

    if (typeof backupState.shape === 'string') {
      try {
        shape = JSON.parse(backupState.shape) as GeoPolygon;
      } catch {
        showPopup('error', t('backup:shapeParseError'));
        return;
      }
    } else {
      shape = backupState.shape as GeoPolygon;
    }

    if (!shape || shape.type !== 'Polygon' || !Array.isArray(shape.coordinates)) {
      showPopup('error', t('backup:shapeInvalid'));
      return;
    }

    const closedRing = normalizeRing(shape.coordinates?.[0] as any[]);
    if (!closedRing) {
      showPopup('error', t('backup:shapePolygonInvalidCoordinates'));
      return;
    }

    const uid = payload?.uid || String(poiId);
    const polygonId = `backup-${uid}`;

    const layer: PolygonLayer = {
      id: EDIT_LAYER_ID,
      name: 'Backup Area (Edit)',
      visible: true,
      data: [
        {
          id: polygonId,
          coordinates: [closedRing],
          properties: { type: 'backup-edit', uid },
        },
      ],
    };

    // also pre-fill edit coords (for validation / next-step)
    const latLngCoords = closedRing.map(([lng, lat]) => ({ lat, lng }));

    setShape({ type: 'Polygon', coordinates: [closedRing] });
    setAreaCoordinates(latLngCoords);
    setIsCreatingBackupProfile(true);
    setIsCreatingArea(false);
    setDrawMode(null);
    setPolygonLayers([layer]);
    setEditingAreaId(EDIT_LAYER_ID);
    setIsEditing(true);
    setEditedCoordinates(latLngCoords);
    showPopup('info', t('backup:startEditingBackupBoundary'));
  }, [
    payload?.uid,
    poiId,
    setIsCreatingBackupProfile,
    setIsCreatingArea,
    setDrawMode,
    setPolygonLayers,
    setEditingAreaId,
    setIsEditing,
    setAreaCoordinates,
    setEditedCoordinates,
    setShape,
    showPopup,
    t,
  ]);

  useImperativeHandle(ref, () => ({ handleSave, handleEditBackup }), [
    handleSave,
    handleEditBackup,
  ]);

  // useEffect(() => {
  //   const fetchStatus = async () => {
  //     const res = await getPotentialStatus(Number.parseInt(poiId));
  //     console.log('🚀 ~ fetchStatus ~ res:', res.data);
  //     if (!res.success) {
  //       return;
  //     }

  //     setCurrentWorkflowStepData(res.data);
  //   };
  //   fetchStatus();
  // }, [poiId]);

  // ============================================================================
  // Workflow Actions (Commented out - not in use yet)
  // ============================================================================
  // const [currentWorkflowStepData, setCurrentWorkflowStepData] =
  //   useState<CurrentWorkflowStepData>();

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
  //       return 'success';
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

  // const handlerAction = async (actionCode: string) => {
  //   try {
  //     const res = await updatePotentialApprove(Number.parseInt(poiId), actionCode);
  //     console.log('🚀 ~ handlerAction ~ res:', res);

  //     if (res.success) {
  //       showPopup('success', 'ดำเนินการสำเร็จ');
  //       // Refetch status after action
  //       const statusRes = await getPotentialStatus(Number.parseInt(poiId));
  //       if (statusRes.success) {
  //         setCurrentWorkflowStepData(statusRes.data);
  //       }
  //     } else {
  //       showPopup('error', 'เกิดข้อผิดพลาดในการดำเนินการ');
  //     }
  //   } catch (error) {
  //     console.error('Error in handlerAction:', error);
  //     showPopup('error', 'เกิดข้อผิดพลาดในการดำเนินการ');
  //   }
  // };

  // ============================================================================
  // Render
  // ============================================================================
  if (fetchBackupDataLoading) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
      </div>
    );
  }
  return (
    <div className="flex">
      {/* Sidebar Navigation */}
      <div className="w-30 bg-blue-50/50 border-r flex flex-col flex-shrink-0">
        {SIDEBAR_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSidebar(tab)}
            className={`flex items-center justify-between px-6 py-4 pl-4 text-left font-medium transition-all ${
              activeSidebar === tab
                ? 'bg-blue-600 text-white'
                : 'text-blue-800 hover:bg-blue-100'
            }`}
          >
            <span>{tab}</span>
            {activeSidebar === tab && <span>›</span>}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="col-span-3 flex-1 bg-white max-h-[500px]">
        {!backupData ? (
          <EmptyProfileState onCreateClick={handleCreateArea} location={location} poiId={poiId ? Number(poiId) : undefined} />
        ) : (
          <>
            <div
              className="max-h-full h-screen overflow-auto"
              style={{ display: activeSidebar === 'Backup' ? 'block' : 'none' }}
            >
              <BackupTab
                poiId={poiId}
                location={location}
                formLocNumber={payload?.formLocNumber}
                nation={nation}
              />
            </div>

            <div
              className="max-h-full h-screen overflow-auto"
              style={{
                display: activeSidebar === t('backup:strategicGroup') ? 'block' : 'none',
              }}
            >
              <StrategicTab
                backupData={payload}
                location={location}
                formLocNumber={payload?.formLocNumber}
              />
            </div>

            <div
              className="max-h-full h-screen overflow-auto"
              style={{
                display: activeSidebar === t('backup:location') ? 'block' : 'none',
              }}
            >
              <LocationTab
                backupData={payload}
                location={location}
                formLocNumber={payload?.formLocNumber}
                nation={nation}
              />
            </div>

            <div
              className="max-h-full h-screen overflow-auto"
              style={{
                display: activeSidebar === t('backup:competitor') ? 'block' : 'none',
              }}
            >
              <CompetitorTab
                backupData={payload}
                location={location}
                formLocNumber={payload?.formLocNumber}
              />
            </div>

            <div
              className="max-h-full h-screen overflow-auto"
              style={{ display: activeSidebar === '7-Eleven' ? 'block' : 'none' }}
            >
              <SevenTab
                backupData={payload}
                location={location}
                formLocNumber={payload?.formLocNumber}
                nation={nation}
              />
            </div>

            <div
              className="max-h-full h-screen overflow-auto"
              style={{
                display: activeSidebar === t('backup:comment') ? 'block' : 'none',
              }}
            >
              <CommentTab location={location} formLocNumber={payload?.formLocNumber} />
            </div>
          </>
        )}

        <PopupAlert
          open={popupOpen}
          type={popupType}
          message={popupMessage}
          onClose={handleClosePopup}
        />

        <PopupAlert
          open={showSaveWarning}
          type="info"
          message="ต้องการบันทึกข้อมูลที่แก้ไขหรือไม่?"
          confirmText="บันทึก"
          cancelText="ไม่บันทึก"
          onConfirm={handleConfirmSave}
          onCancel={handleCancelSave}
          onClose={handleCancelSave}
        />
      </div>
      {/* <div className="divider"></div>
      <div className="flex item-center justify-end gap-3">
        <Button variant="outline" className="w-32 border-blue-600 text-blue-500">
          ปิด
        </Button>
        {currentWorkflowStepData?.availableActions.map(action => {
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
        })}
      </div> */}
    </div>
  );
});
