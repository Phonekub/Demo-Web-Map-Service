import { forwardRef, useImperativeHandle } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Hoist mocks to avoid reference errors
const serviceMocks = vi.hoisted(() => ({
  useQueryMock: vi.fn(),
  fetchBackupProfileLayers: vi.fn(),
  fetchCompetitorNearby: vi.fn(),
  fetchPotentialByPoiId: vi.fn(),
  createBackupProfile: vi.fn(),
  updateBackupProfile: vi.fn(),
}));

const storeMocks = vi.hoisted(() => ({
  setStep: vi.fn(),
  setCompetitors: vi.fn(),
  setSelectedPoiId: vi.fn(),
}));

const stateContainer = vi.hoisted(() => ({
  flowState: {} as any,
  backupProfileState: {} as any,
  populationStoreState: {} as any,
  envConfirmed: true,
  refetchLayers: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => serviceMocks.useQueryMock(...args),
}));

vi.mock('@/services/location.service', () => ({
  fetchBackupProfileLayers: (...args: unknown[]) =>
    serviceMocks.fetchBackupProfileLayers(...args),
  fetchCompetitorNearby: (...args: unknown[]) =>
    serviceMocks.fetchCompetitorNearby(...args),
  fetchPotentialByPoiId: (...args: unknown[]) =>
    serviceMocks.fetchPotentialByPoiId(...args),
}));

vi.mock('@/services/backup.service', () => ({
  createBackupProfile: (...args: unknown[]) => serviceMocks.createBackupProfile(...args),
  updateBackupProfile: (...args: unknown[]) => serviceMocks.updateBackupProfile(...args),
}));

vi.mock('@/components/base/Button', () => ({
  default: (props: any) => <button {...props}>{props.children}</button>,
}));

vi.mock('../envpointpotential/Backup', () => ({
  default: forwardRef((_props: any, ref: any) => {
    useImperativeHandle(ref, () => ({
      isDataConfirmed: () => stateContainer.envConfirmed,
    }));
    return <div data-testid="env-backup">env-backup</div>;
  }),
}));

vi.mock('@/stores/backupProfileStore', () => ({
  useBackupFlowStore: (selector?: any) =>
    selector ? selector(stateContainer.flowState) : stateContainer.flowState,
  useBackupProfileStore: (selector?: any) =>
    selector
      ? selector(stateContainer.backupProfileState)
      : stateContainer.backupProfileState,
  usePopulationStore: (selector?: any) =>
    selector
      ? selector(stateContainer.populationStoreState)
      : stateContainer.populationStoreState,
}));

vi.mock('@/stores', () => ({
  useUserStore: () => ({ user: { id: 7 } }),
}));

vi.mock('@/stores/languageStore', () => ({
  getLanguage: () => 'en',
}));

vi.mock('@/components/base/PopupAlert', () => ({
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

import CreateBackupProfile from './CreateBackupProfile';

describe('CreateBackupProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stateContainer.envConfirmed = true;
    stateContainer.flowState = { step: 'area-selection', setStep: storeMocks.setStep };
    storeMocks.setSelectedPoiId.mockImplementation((value: number | null) => {
      stateContainer.backupProfileState.selectedPoiId = value;
    });
    stateContainer.backupProfileState = {
      strategic: null,
      setCompetitors: storeMocks.setCompetitors,
      competitors: [],
      setSelectedPoiId: storeMocks.setSelectedPoiId,
      selectedPoiId: null,
      profilePois: [],
    };
    stateContainer.populationStoreState = { byPoi: {} };

    serviceMocks.useQueryMock.mockImplementation(({ queryKey }: any) => {
      if (queryKey[0] === 'backupProfileLayers') {
        return {
          data: undefined,
          refetch: stateContainer.refetchLayers,
          isLoading: false,
        };
      }
      if (queryKey[0] === 'competitorNearby') {
        return {
          data: [
            {
              id: 1,
              competitorLayerId: 6,
              competitorType: 2,
              competitorTypeName: 'Cafe',
              distance: 123,
            },
          ],
          isLoading: false,
        };
      }
      if (queryKey[0] === 'potentialPois') {
        return {
          data: {
            potentialStore: { formLocNumber: 'FL-100' },
            poi: { name: 'Main Branch' },
          },
          isLoading: false,
        };
      }
      return { data: undefined, isLoading: false };
    });
  });

  // --- Area selection step ---
  // Shows the area-selection summary, blocks next without a polygon, and delegates cancel immediately.
  it('renders the area-selection step and disables next until a polygon is drawn', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(
      <CreateBackupProfile
        coordinates={
          [
            [100, 13],
            [101, 13],
          ] as any
        }
        poiId="12"
        location={{ geom: { coordinates: [100.5, 13.7] } } as any}
        onCancel={onCancel}
        onClearArea={vi.fn()}
        onSave={vi.fn()}
      />
    );

    expect(screen.getByText('FL-100')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'common:next' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'common:cancel' }));
    expect(onCancel).toHaveBeenCalled();
  });

  // --- Advance into layer selection ---
  // Moves from area-selection to layer-selection and refetches backup profile layers when the polygon is valid.
  it('advances to layer-selection and refetches layers for a valid drawn area', async () => {
    const user = userEvent.setup();

    render(
      <CreateBackupProfile
        coordinates={
          [
            [100, 13],
            [101, 13],
            [101, 14],
          ] as any
        }
        poiId="12"
        location={{ geom: { coordinates: [100.5, 13.7] } } as any}
        onCancel={vi.fn()}
        onClearArea={vi.fn()}
        onSave={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'common:next' }));

    expect(storeMocks.setStep).toHaveBeenCalledWith('layer-selection');
    expect(stateContainer.refetchLayers).toHaveBeenCalled();
  });

  // --- Layer selection and save validations ---
  // Renders fetched layers and pois, syncs nearby competitors, and blocks save until a POI is selected and data is confirmed.
  it('renders layer selection data and shows validation popups for missing POI or unconfirmed detail data', async () => {
    const user = userEvent.setup();
    stateContainer.flowState.step = 'layer-selection';
    stateContainer.envConfirmed = false;
    serviceMocks.useQueryMock.mockImplementation(({ queryKey }: any) => {
      if (queryKey[0] === 'backupProfileLayers') {
        return {
          data: {
            data: {
              layers: [
                {
                  layerId: 1,
                  layerName: 'Primary',
                  layerEn: 'Primary',
                  subCategories: [
                    {
                      pois: [
                        {
                          poiId: 10,
                          name: 'POI A',
                          populationAmount: 1000,
                          percentPredictCustomer: 10,
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          },
          refetch: stateContainer.refetchLayers,
          isLoading: false,
        };
      }
      if (queryKey[0] === 'competitorNearby') {
        return {
          data: [
            {
              id: 1,
              competitorLayerId: 6,
              competitorType: 2,
              competitorTypeName: 'Cafe',
              distance: 123,
            },
          ],
          isLoading: false,
        };
      }
      if (queryKey[0] === 'potentialPois') {
        return {
          data: {
            potentialStore: { formLocNumber: 'FL-100' },
            poi: { name: 'Main Branch' },
          },
          isLoading: false,
        };
      }
      return { data: undefined, isLoading: false };
    });

    render(
      <CreateBackupProfile
        coordinates={
          [
            [100, 13],
            [101, 13],
            [101, 14],
          ] as any
        }
        poiId="12"
        location={{ geom: { coordinates: [100.5, 13.7] } } as any}
        onCancel={vi.fn()}
        onClearArea={vi.fn()}
        onSave={vi.fn()}
      />
    );

    await waitFor(() => expect(storeMocks.setCompetitors).toHaveBeenCalled());
    expect(screen.getByText('POI A')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'common:save' }));
    expect(
      screen.getByText(
        'คุณยังไม่ได้เลือก POI กรุณาเลือกอย่างน้อย 1 POI เพื่อดำเนินการต่อ'
      )
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'close' }));

    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByText('POI A'));
    await waitFor(() => expect(screen.getByTestId('env-backup')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'common:save' }));
    expect(
      screen.getByText(
        "คุณยังไม่ได้กดปุ่ม 'ยืนยันข้อมูล' กรุณากดปุ่มดังกล่าวเพื่อยืนยันข้อมูลก่อนดำเนินการต่อ"
      )
    ).toBeInTheDocument();
  });

  // --- Successful create flow ---
  // Builds the backup payload from selected POIs and calls onSave after a successful create flow closes.
  it('creates a backup profile and resolves the selected poi callback after closing success popup', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    stateContainer.flowState.step = 'layer-selection';
    serviceMocks.createBackupProfile.mockResolvedValue({ success: true });
    serviceMocks.useQueryMock.mockImplementation(({ queryKey }: any) => {
      if (queryKey[0] === 'backupProfileLayers') {
        return {
          data: {
            data: {
              layers: [
                {
                  layerId: 1,
                  layerName: 'Primary',
                  layerEn: 'Primary',
                  subCategories: [
                    {
                      pois: [
                        {
                          poiId: 10,
                          name: 'POI A',
                          populationAmount: 1000,
                          percentPredictCustomer: 10,
                          coordinates: [100.1, 13.1],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          },
          refetch: stateContainer.refetchLayers,
          isLoading: false,
        };
      }
      if (queryKey[0] === 'competitorNearby') {
        return { data: [], isLoading: false };
      }
      if (queryKey[0] === 'potentialPois') {
        return {
          data: {
            potentialStore: { formLocNumber: 'FL-100' },
            poi: { name: 'Main Branch' },
          },
          isLoading: false,
        };
      }
      return { data: undefined, isLoading: false };
    });

    render(
      <CreateBackupProfile
        coordinates={
          [
            [100, 13],
            [101, 13],
            [101, 14],
          ] as any
        }
        poiId="12"
        location={{ geom: { coordinates: [100.5, 13.7] } } as any}
        onCancel={vi.fn()}
        onClearArea={vi.fn()}
        onSave={onSave}
      />
    );

    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByText('POI A'));
    await waitFor(() => expect(screen.getByTestId('env-backup')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'common:save' }));

    await waitFor(() =>
      expect(serviceMocks.createBackupProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          poiId: 12,
          shape: 'POLYGON((100 13, 101 13, 101 14, 100 13))',
          createBy: 7,
        })
      )
    );

    await user.click(screen.getByRole('button', { name: 'close' }));

    expect(onSave).toHaveBeenCalledWith([
      expect.objectContaining({
        poiId: 10,
        poiName: 'POI A',
        population: 1000,
        customers: 100,
      }),
    ]);
    expect(storeMocks.setStep).toHaveBeenCalledWith('area-selection');
    expect(storeMocks.setSelectedPoiId).toHaveBeenCalledWith(null);
  });
});
