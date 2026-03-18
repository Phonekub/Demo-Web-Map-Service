import { createRef } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Hoist mocks to avoid reference errors
const serviceMocks = vi.hoisted(() => ({
  useQueryMock: vi.fn(),
  fetchBackupProfile: vi.fn(),
  updateBackupProfile: vi.fn(),
  fetchPoiByPoiId: vi.fn(),
  fetchBackupProfileLayers: vi.fn(),
}));

const storeMocks = vi.hoisted(() => ({
  setMainProfile: vi.fn(),
  setSubProfile: vi.fn(),
  setStrategic: vi.fn(),
  setBackupRemark: vi.fn(),
  syncStreetFoodFromApi: vi.fn(),
  setProfiles: vi.fn(),
  setProfilePois: vi.fn(),
  setCompetitors: vi.fn(),
  setShape: vi.fn(),
  setUid: vi.fn(),
  setHaveBackupProfile: vi.fn(),
}));

const mapStoreMocks = vi.hoisted(() => ({
  setCreatingAreaStoreId: vi.fn(),
  setIsCreatingBackupProfile: vi.fn(),
  setIsCreatingArea: vi.fn(),
  setPolygonLayers: vi.fn(),
  setIsEditing: vi.fn(),
  setEditingAreaId: vi.fn(),
  setEditedCoordinates: vi.fn(),
  setAreaCoordinates: vi.fn(),
  setDrawMode: vi.fn(),
}));

// Mutable state containers to allow changing return values in tests
const stateContainer = vi.hoisted(() => ({
  backupProfileState: {} as any,
  mapStoreState: {} as any,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => serviceMocks.useQueryMock(...args),
}));

vi.mock('@/services/backup.service', () => ({
  fetchBackupProfile: (...args: unknown[]) => serviceMocks.fetchBackupProfile(...args),
  updateBackupProfile: (...args: unknown[]) => serviceMocks.updateBackupProfile(...args),
}));

vi.mock('@/services/location.service', () => ({
  fetchBackupProfileLayers: (...args: unknown[]) =>
    serviceMocks.fetchBackupProfileLayers(...args),
  fetchPoiByPoiId: (...args: unknown[]) => serviceMocks.fetchPoiByPoiId(...args),
}));

vi.mock('@/stores/userStore', () => ({
  useUserStore: (selector: any) => selector({ user: { id: 99 } }),
}));

vi.mock('@/stores/mapStore', () => ({
  useMapStore: (selector?: any) =>
    selector ? selector(stateContainer.mapStoreState) : stateContainer.mapStoreState,
}));

vi.mock('@/stores/backupProfileStore', () => {
  const hook = (selector?: any) =>
    selector
      ? selector(stateContainer.backupProfileState)
      : stateContainer.backupProfileState;
  (hook as any).getState = () => stateContainer.backupProfileState;
  return {
    useBackupProfileStore: hook,
  };
});

vi.mock('./TabBackup/StrategicTab', () => ({
  default: () => <div data-testid="strategic-tab">strategic-tab</div>,
}));
vi.mock('./TabBackup/EmptyProfileState', () => ({
  EmptyProfileState: ({ onCreateClick }: any) => (
    <div data-testid="empty-profile-state">
      <button onClick={onCreateClick}>create-backup</button>
    </div>
  ),
}));
vi.mock('./TabBackup/BackupTab', () => ({
  default: () => <div data-testid="backup-tab">backup-tab</div>,
}));
vi.mock('./TabBackup/locationTab', () => ({
  default: () => <div data-testid="location-tab">location-tab</div>,
}));
vi.mock('./TabBackup/competitorTab', () => ({
  default: () => <div data-testid="competitor-tab">competitor-tab</div>,
}));
vi.mock('./TabBackup/sevenTab', () => ({
  default: () => <div data-testid="seven-tab">seven-tab</div>,
}));
vi.mock('./TabBackup/commentTab', () => ({
  default: () => <div data-testid="comment-tab">comment-tab</div>,
}));

vi.mock('../../../components/base/PopupAlert', () => ({
  default: (props: any) =>
    props.open ? (
      <div data-testid="popup-alert">
        <span>{props.message}</span>
        {props.onConfirm && (
          <button onClick={props.onConfirm}>{props.confirmText || 'confirm'}</button>
        )}
        {props.onCancel && (
          <button onClick={props.onCancel}>{props.cancelText || 'cancel'}</button>
        )}
        {props.onClose && <button onClick={props.onClose}>close</button>}
      </div>
    ) : null,
}));

vi.mock('@/components/base/Button', () => ({
  default: (props: any) => <button {...props}>{props.children}</button>,
}));

import Backup, { type BackupRef } from './Backup';

describe('Backup', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    stateContainer.backupProfileState = {
      mainProfile: '1',
      subProfile: '2',
      strategic: { strategicLocation: '01' },
      backupRemark: 'remark',
      streetFood: ['A'],
      profiles: [{ profileLayerId: 1, backupPercentage: '50' }],
      profilePois: [{ poiId: 10, percentPredictCustomer: '3.5' }],
      competitors: [{ competitorId: 1, distance: '123.45' }],
      shape: {
        type: 'Polygon',
        coordinates: [
          [
            [100, 13],
            [101, 13],
            [101, 14],
            [100, 13],
          ],
        ],
      },
      setMainProfile: storeMocks.setMainProfile,
      setSubProfile: storeMocks.setSubProfile,
      setStrategic: storeMocks.setStrategic,
      setBackupRemark: storeMocks.setBackupRemark,
      syncStreetFoodFromApi: storeMocks.syncStreetFoodFromApi,
      setProfiles: storeMocks.setProfiles,
      setProfilePois: storeMocks.setProfilePois,
      setCompetitors: storeMocks.setCompetitors,
      setShape: storeMocks.setShape,
      setUid: storeMocks.setUid,
      setHaveBackupProfile: storeMocks.setHaveBackupProfile,
    };

    stateContainer.mapStoreState = {
      setCreatingAreaStoreId: mapStoreMocks.setCreatingAreaStoreId,
      setIsCreatingBackupProfile: mapStoreMocks.setIsCreatingBackupProfile,
      setIsCreatingArea: mapStoreMocks.setIsCreatingArea,
      setPolygonLayers: mapStoreMocks.setPolygonLayers,
      setIsEditing: mapStoreMocks.setIsEditing,
      setEditingAreaId: mapStoreMocks.setEditingAreaId,
      setEditedCoordinates: mapStoreMocks.setEditedCoordinates,
      setAreaCoordinates: mapStoreMocks.setAreaCoordinates,
      editedCoordinates: [],
      isEditing: false,
      editingAreaId: null,
      areaCoordinates: [],
      setDrawMode: mapStoreMocks.setDrawMode,
    };

    serviceMocks.useQueryMock.mockImplementation(({ queryKey }: any) => {
      if (queryKey[0] === 'backupProfile') {
        // Return undefined data by default unless overridden in test
        return { data: undefined, refetch: vi.fn(), isLoading: false };
      }
      if (queryKey[0] === 'poi') {
        return { data: { nation: 'KH' } };
      }
      if (queryKey[0] === 'backupProfileLayers') {
        return { data: undefined, isLoading: false };
      }
      return { data: undefined, isLoading: false };
    });
  });

  // --- Empty profile state ---
  // Renders the empty backup state when no profile exists and starts area creation from the create action.
  it('renders the empty profile state and starts backup area creation', async () => {
    const user = userEvent.setup();

    render(<Backup poiId="12" location={{ branchCode: 'BR-1' } as any} />);

    expect(screen.getByTestId('empty-profile-state')).toBeInTheDocument();
    expect(storeMocks.setHaveBackupProfile).toHaveBeenCalledWith(false);
    expect(storeMocks.setShape).toHaveBeenCalledWith(null);

    await user.click(screen.getByRole('button', { name: 'create-backup' }));

    expect(mapStoreMocks.setIsCreatingBackupProfile).toHaveBeenCalledWith(true);
    expect(mapStoreMocks.setCreatingAreaStoreId).toHaveBeenCalledWith('BR-1');
    expect(mapStoreMocks.setIsCreatingArea).toHaveBeenCalledWith(true);
  });

  // --- Existing profile sync and sidebar navigation ---
  // Syncs API payload into the backup store and switches between the sidebar tab panels.
  it('syncs backup payload into store state and switches sidebar tabs', async () => {
    const user = userEvent.setup();
    const backupProfileData = {
      data: {
        uid: 'uid-1',
        formLocNumber: 'FL-100',
        mainProfile: '1',
        subProfile: '2',
        backupRemark: 'existing remark',
        streetFood: ['A'],
        profiles: [{ profileLayerId: 1, backupPercentage: 50 }],
        profilePois: [{ poiId: 10 }],
        competitors: [{ competitorId: 99 }],
        shape: {
          type: 'Polygon',
          coordinates: [
            [
              [100, 13],
              [101, 13],
              [101, 14],
              [100, 13],
            ],
          ],
        },
      },
    };

    serviceMocks.useQueryMock.mockImplementation(({ queryKey }: any) => {
      if (queryKey[0] === 'backupProfile') {
        return { data: backupProfileData, refetch: vi.fn(), isLoading: false };
      }
      return { data: undefined, isLoading: false };
    });

    render(<Backup poiId="12" location={{ branchCode: 'BR-1' } as any} />);

    expect(storeMocks.setHaveBackupProfile).toHaveBeenCalledWith(true);
    expect(storeMocks.setUid).toHaveBeenCalledWith('uid-1');
    expect(storeMocks.setBackupRemark).toHaveBeenCalledWith('existing remark');
    expect(storeMocks.syncStreetFoodFromApi).toHaveBeenCalledWith(['A']);
    expect(screen.getByTestId('backup-tab')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'backup:competitor' }));
    expect(screen.getByTestId('competitor-tab')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'backup:comment' }));
    expect(screen.getByTestId('comment-tab')).toBeInTheDocument();
  });

  // --- Save confirmation ---
  // Opens the save warning popup and persists the normalized backup payload on confirm.
  it('confirms save and updates the backup profile payload', async () => {
    const user = userEvent.setup();
    const ref = createRef<BackupRef>();
    const backupProfileData = {
      data: {
        uid: 'uid-1',
        formLocNumber: 'FL-100',
      },
    };

    serviceMocks.useQueryMock.mockImplementation(({ queryKey }: any) => {
      if (queryKey[0] === 'backupProfile') {
        return { data: backupProfileData, refetch: vi.fn(), isLoading: false };
      }
      return { data: undefined, isLoading: false };
    });

    serviceMocks.updateBackupProfile.mockResolvedValue({ success: true });

    render(<Backup ref={ref} poiId="12" location={{ branchCode: 'BR-1' } as any} />);

    act(() => {
      ref.current?.handleSave();
    });
    expect(screen.getByText('ต้องการบันทึกข้อมูลที่แก้ไขหรือไม่?')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'บันทึก' }));

    await waitFor(() =>
      expect(serviceMocks.updateBackupProfile).toHaveBeenCalledWith(
        'uid-1',
        expect.objectContaining({
          mainProfile: '1',
          backupRemark: 'remark',
          shape: 'POLYGON ((100 13, 101 13, 101 14, 100 13))',
          updateBy: 99,
        })
      )
    );
    expect(screen.getByText('backup:saveSuccess')).toBeInTheDocument();
  });

  // --- Edit backup boundary ---
  // Exposes the edit handler through the ref and maps the stored polygon into map editing state.
  it('maps the stored backup polygon into editable map state via the ref handler', () => {
    const backupProfileData = {
      data: {
        uid: 'uid-1',
        formLocNumber: 'FL-100',
      },
    };
    serviceMocks.useQueryMock.mockImplementation(({ queryKey }: any) => {
      if (queryKey[0] === 'backupProfile') {
        return { data: backupProfileData, refetch: vi.fn(), isLoading: false };
      }
      return { data: undefined, isLoading: false };
    });

    const ref = createRef<BackupRef>();

    render(<Backup ref={ref} poiId="12" location={{ branchCode: 'BR-1' } as any} />);

    act(() => {
      ref.current?.handleEditBackup();
    });

    expect(mapStoreMocks.setPolygonLayers).toHaveBeenCalledWith([
      expect.objectContaining({
        id: 'area-results',
        data: [
          expect.objectContaining({
            id: 'backup-uid-1',
            coordinates: [
              [
                [100, 13],
                [101, 13],
                [101, 14],
                [100, 13],
              ],
            ],
          }),
        ],
      }),
    ]);
    expect(mapStoreMocks.setIsEditing).toHaveBeenCalledWith(true);
    expect(mapStoreMocks.setEditingAreaId).toHaveBeenCalledWith('area-results');
    expect(screen.getByText('backup:startEditingBackupBoundary')).toBeInTheDocument();
  });
});
