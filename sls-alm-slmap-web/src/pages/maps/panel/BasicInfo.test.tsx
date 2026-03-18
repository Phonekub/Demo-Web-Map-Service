import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

const envInfoRender = vi.fn();
const pointInfoRender = vi.fn();

// --- Child component mocks ---
// Swap the large information panels for focused forwardRef test doubles.
vi.mock('../envpointpotential/Information', () => {
  return {
    __esModule: true,
    default: React.forwardRef((props: any, ref: any) => {
      envInfoRender({ ...props, hasRef: Boolean(ref) });
      return <div data-testid="env-information">env-information-{props.poiId}</div>;
    }),
  };
});

vi.mock('../pointpotential/Information', () => {
  return {
    __esModule: true,
    default: React.forwardRef((props: any, ref: any) => {
      pointInfoRender({ ...props, hasRef: Boolean(ref) });
      return <div data-testid="point-information">point-information-{props.poiId}</div>;
    }),
  };
});

import { BasicInfo } from './BasicInfo';

describe('BasicInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Env information selection ---
  // Renders the environment information form and forwards the remaining props.
  it('renders the env information component for env type', () => {
    const ref = React.createRef<any>();
    const coordinateBasicInfo = { latitude: 13.7, longitude: 100.5 };

    render(
      <BasicInfo
        ref={ref}
        poiId="ENV-1"
        type="env"
        coordinateBasicInfo={coordinateBasicInfo}
      />
    );

    expect(screen.getByTestId('env-information')).toBeInTheDocument();
    expect(screen.queryByTestId('point-information')).not.toBeInTheDocument();
    expect(envInfoRender).toHaveBeenCalledWith(
      expect.objectContaining({
        poiId: 'ENV-1',
        type: 'env',
        coordinateBasicInfo,
        hasRef: true,
      })
    );
  });

  // --- Default information selection ---
  // Renders the point-potential information form and preserves update props.
  it('renders the point information component for the default type', () => {
    const ref = React.createRef<any>();

    render(<BasicInfo ref={ref} poiId="POI-7" isUpdateForm someExtraProp="extra" />);

    expect(screen.getByTestId('point-information')).toBeInTheDocument();
    expect(screen.queryByTestId('env-information')).not.toBeInTheDocument();
    expect(pointInfoRender).toHaveBeenCalledWith(
      expect.objectContaining({
        poiId: 'POI-7',
        isUpdateForm: true,
        someExtraProp: 'extra',
        hasRef: true,
      })
    );
  });
});
