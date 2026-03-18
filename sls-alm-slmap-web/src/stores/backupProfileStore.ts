import { create } from 'zustand';

// ============================================================================
// Backup Flow Store
// ============================================================================
export type BackupFlowStep = 'area-selection' | 'layer-selection';

interface BackupFlowState {
  step: BackupFlowStep;
  setStep: (step: BackupFlowStep) => void;
  reset: () => void;
}

export const useBackupFlowStore = create<BackupFlowState>(set => ({
  step: 'area-selection',
  setStep: step => set({ step }),
  reset: () => set({ step: 'area-selection' }),
}));

// ============================================================================
// Types
// ============================================================================

export type GeoPolygon = {
  type: 'Polygon';
  coordinates: number[][][];
};

export interface Profile {
  id: number;
  backupLocationId: number;
  profileLayerId: number;
  backupPercentage: number;
  profileLayerName: string;
}

export interface ProfilePoi {
  id: number;
  backupLocationProfileId: number;
  backupLocationId: number;
  profileLayerId: number;
  poiId: number;
  distance: string;
  populationAmount: number;
  customerAmount: number;
  percentPredictCustomer: number;
  poiNamt: string;
}

export interface Competitor {
  id: number;
  backupLocationId: number;
  competitorLayerId: number;
  competitorId: number;
  distance: number;
  competitorType: number;
  competitorTypeName: string;
  grade: string;
}

// ============================================================================
// Create Backup Profile Store (payload builder store)
// ============================================================================
export interface CreateProfiles {
  profileLayerId: number;
  backupPercentage: number;
}

export interface CreateProfilePois {
  poiId: number;
  profileLayerId: number;
  distance: string;
  populationAmount: number;
  customerAmount: number;
  percentPredictCustomer: number;
}

export interface CreateCompetitors {
  competitorLayerId: number;
  competitorId: number;
  distance: number;
  competitorType: number;
}

export interface CreateBackupProfilePayload {
  poiId: number;
  poiLayerId: number;
  strategicLocation: string;
  formLocNumber: string;
  zoneCode: string;
  shape: string;
  backupColor: number;
  backupColorLayer: string;
  isActive: string;
  mainProfile: string;
  subProfile: string;
  areaSize: number;
  backupRemark: string;
  strategicSupport: string;
  strategicPlace: string;
  strategicPlaceOther: string;
  strategicPlaceName: string;
  strategicPlaceGuid: string;
  strategicPosition: string;
  strategicPositionOther: string;
  strategicPositionName: string;
  strategicFloor: string;
  strategicFloorOther: string;
  strategicCustomerType: string;
  strategicHousingType: string;
  strategicIndustrialEstateName: string;
  createBy: number;

  streetFood: string;

  profiles: CreateProfiles[];
  profilePois: CreateProfilePois[];
  competitors: CreateCompetitors[];
}

export interface StrategicPayload {
  strategicLocation: string;
  strategicSupport: string;
  strategicPlace: string;
  strategicPlaceOther: string;
  strategicPlaceName: string;
  strategicPlaceGuid: string;
  strategicPosition: string;
  strategicPositionOther: string;
  strategicPositionName: string;
  strategicFloor: string;
  strategicFloorOther: string;
  strategicCustomerType: string;
  strategicHousingType: string;
  strategicIndustrialEstateName: string;
}

// ============================================================================
// Backup Profile Store (data store for editing/viewing)
// ============================================================================
interface BackupProfileState {
  haveBackupProfile: boolean;
  uid: string;
  mainProfile: string | null;
  subProfile: string | null;
  strategic: StrategicPayload | null;

  backupRemark: string;

  streetFood: string;

  shape: GeoPolygon | null;
  profiles: Profile[];
  profilePois: ProfilePoi[];
  competitors: Competitor[];
  selectedPoiId: number | null;

  setHaveBackupProfile: (have: boolean) => void;
  setSelectedPoiId: (id: number | null) => void;
  setUid: (uid: string) => void;
  setMainProfile: (data: string | null) => void;
  setSubProfile: (data: string | null) => void;
  setStrategic: (data: StrategicPayload) => void;
  setBackupRemark: (remark: string) => void;
  setStreetFood: (sf: string) => void;
  setShape: (shape: GeoPolygon | null) => void;
  setProfiles: (profiles: Profile[]) => void;
  setProfilePois: (pois: ProfilePoi[]) => void;
  setCompetitors: (competitors: Competitor[]) => void;

  reset: () => void;
  syncStreetFoodFromApi: (apiValue: any) => void;
  updateProfileBackupPercentage: (index: number, value: string | number) => void;
  updateProfilePoiPercentPredictCustomer: (index: number, value: string | number) => void;
}

const toNum = (v: any) => {
  if (v === '' || v === null || v === undefined) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const initialBackupProfileState: Pick<
  BackupProfileState,
  | 'uid'
  | 'mainProfile'
  | 'subProfile'
  | 'strategic'
  | 'backupRemark'
  | 'streetFood'
  | 'shape'
  | 'profiles'
  | 'profilePois'
  | 'competitors'
  | 'selectedPoiId'
  | 'haveBackupProfile'
> = {
  uid: '',
  mainProfile: null,
  subProfile: null,
  strategic: null,
  backupRemark: '',
  streetFood: '{}',
  shape: null,
  profiles: [],
  profilePois: [],
  competitors: [],
  selectedPoiId: null,
  haveBackupProfile: false,
};

type PopulationByPoi = Record<
  number,
  { populationAmount: string; percentPredictCustomer: string }
>;

interface PopulationStore {
  byPoi: PopulationByPoi;

  // setter ทีเดียวต่อ poi
  setPopulation: (
    poiId: number,
    populationAmount: string,
    percentPredictCustomer: string
  ) => void;

  // helper getter (optional)
  getPopulation: (
    poiId: number
  ) => { populationAmount: string; percentPredictCustomer: string } | undefined;

  reset: () => void;
}

export const usePopulationStore = create<PopulationStore>((set, get) => ({
  byPoi: {},

  setPopulation: (poiId, populationAmount, percentPredictCustomer) =>
    set(state => ({
      byPoi: {
        ...state.byPoi,
        [poiId]: { populationAmount, percentPredictCustomer },
      },
    })),

  getPopulation: poiId => get().byPoi[poiId],

  reset: () => set({ byPoi: {} }),
}));

export const useBackupProfileStore = create<BackupProfileState>(set => ({
  ...initialBackupProfileState,

  setHaveBackupProfile: (have: boolean) => set({ haveBackupProfile: have }),

  setSelectedPoiId: id => set({ selectedPoiId: id }),
  setUid: uid => set({ uid }),
  setMainProfile: data => set({ mainProfile: data }),
  setSubProfile: data => set({ subProfile: data }),
  setStrategic: data => set({ strategic: data }),
  setBackupRemark: remark => set({ backupRemark: remark }),
  setStreetFood: sf => set({ streetFood: sf }),
  setShape: shape => set({ shape }),
  setProfiles: profiles => set({ profiles }),
  setProfilePois: pois => set({ profilePois: pois }),
  setCompetitors: competitors => set({ competitors }),

  reset: () => set({ ...initialBackupProfileState }),

  updateProfileBackupPercentage: (index, value) =>
    set(state => {
      const next = [...state.profiles];
      if (!next[index]) return state;
      next[index] = { ...next[index], backupPercentage: toNum(value) };
      return { profiles: next };
    }),

  updateProfilePoiPercentPredictCustomer: (index, value) =>
    set(state => {
      const next = [...state.profilePois];
      if (!next[index]) return state;
      next[index] = { ...next[index], percentPredictCustomer: toNum(value) };
      return { profilePois: next };
    }),

  syncStreetFoodFromApi: (apiValue: any) => {
    let ids: number[] = [];

    if (Array.isArray(apiValue)) {
      ids = apiValue
        .map((item: any) =>
          typeof item === 'object' && item.typeId ? Number(item.typeId) : Number(item)
        )
        .filter((id: any) => !isNaN(id));
    } else if (typeof apiValue === 'string') {
      const cleaned: string = apiValue.replace(/[{}]/g, '').trim();
      if (cleaned === '') ids = [];
      else {
        ids = cleaned
          .split(',')
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0)
          .map((s: string) => Number(s))
          .filter((id: number) => !isNaN(id));
      }
    }

    set({ streetFood: `{${ids.join(',')}}` });
  },
}));
