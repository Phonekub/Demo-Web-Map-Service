import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

const envBackupRender = vi.fn();
const pointBackupRender = vi.fn();

// --- Child component mocks ---
// Replace the heavy backup forms with lightweight forwardRef test doubles.
vi.mock('../envpointpotential/Backup', () => {
  return {
    __esModule: true,
    default: React.forwardRef((props: any, ref: any) => {
      envBackupRender({ ...props, hasRef: Boolean(ref) });
      return <div data-testid="env-backup">env-backup-{String(props.formId)}</div>;
    }),
  };
});

vi.mock('../pointpotential/Backup', () => {
  return {
    __esModule: true,
    default: React.forwardRef((props: any, ref: any) => {
      pointBackupRender({ ...props, hasRef: Boolean(ref) });
      return <div data-testid="point-backup">point-backup-{props.poiId}</div>;
    }),
  };
});

import { BackupProfile } from './BackupProfile';

describe('BackupProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Env backup selection ---
  // Renders the environment backup form when the env type is selected.
  it('renders the env backup component for env type', () => {
    const ref = React.createRef<HTMLDivElement>();

    render(<BackupProfile ref={ref} poiId="POI-1" type="env" formId={44} />);

    expect(screen.getByTestId('env-backup')).toBeInTheDocument();
    expect(screen.queryByTestId('point-backup')).not.toBeInTheDocument();
    expect(envBackupRender).toHaveBeenCalledWith(
      expect.objectContaining({ formId: 44, hasRef: true })
    );
  });

  // --- Default backup selection ---
  // Falls back to the point-potential backup form for the default branch.
  it('renders the point backup component for the default type', () => {
    const ref = React.createRef<HTMLDivElement>();
    const location = { branchCode: 'B001' } as any;

    render(<BackupProfile ref={ref} poiId="POI-9" location={location} />);

    expect(screen.getByTestId('point-backup')).toBeInTheDocument();
    expect(screen.queryByTestId('env-backup')).not.toBeInTheDocument();
    expect(pointBackupRender).toHaveBeenCalledWith(
      expect.objectContaining({ poiId: 'POI-9', location, hasRef: true })
    );
  });
});
