import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

const setBackupRemark = vi.fn();
const backupHeaderMock = vi.fn();
let backupProfileStoreState: any;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/stores/backupProfileStore', () => ({
  useBackupProfileStore: () => backupProfileStoreState,
}));

vi.mock('./BackupHeader', () => ({
  BackupHeader: (props: any) => {
    backupHeaderMock(props);
    return <div data-testid="backup-header">backup-header</div>;
  },
}));

import CommentTab from './commentTab';

describe('CommentTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    backupProfileStoreState = {
      backupRemark: 'existing remark',
      setBackupRemark,
    };
  });

  // --- Header and textarea state ---
  // Renders the shared backup header and binds the textarea to the backup remark state.
  it('renders the backup header and updates the backup remark', () => {
    render(
      <CommentTab location={{ branchName: 'Branch 101' } as any} formLocNumber="FL-100" />
    );

    expect(screen.getByTestId('backup-header')).toBeInTheDocument();
    expect(backupHeaderMock).toHaveBeenCalledWith(
      expect.objectContaining({
        location: expect.objectContaining({ branchName: 'Branch 101' }),
        formLocNumber: 'FL-100',
      })
    );

    const textarea = screen.getByPlaceholderText('backup:commentPlaceholder');
    expect(textarea).toHaveValue('existing remark');

    fireEvent.change(textarea, { target: { value: 'new backup comment' } });

    expect(setBackupRemark).toHaveBeenCalledWith('new backup comment');
  });
});
