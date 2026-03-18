import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import HistoryTradeArea from './HistoryTradeArea';
import { getHistoryTradeAreaById } from '../../../services/tradeArea.service';

// Mock getHistoryTradeAreaById
vi.mock('../../../services/tradeArea.service', () => ({
  getHistoryTradeAreaById: vi.fn(),
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

describe('HistoryTradeArea', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const getHistoryMock = getHistoryTradeAreaById as import("vitest").Mock;

  it('renders gracefully when tradeareaId is null', () => {
    render(<HistoryTradeArea tradeareaId={null} />);
    expect(screen.getByText('table.no')).toBeInTheDocument();
    expect(screen.getByText('no_data')).toBeInTheDocument();
  });

  it('shows loading and then data when tradeareaId is provided (array format)', async () => {
    // We delay the response to test loading
    getHistoryMock.mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve([{
        wfStatus: { wfStatusName: 'Approved' },
        createDate: '2023-01-01T00:00:00.000Z',
        remark: 'Test comment'
      }]), 100))
    );

    render(<HistoryTradeArea tradeareaId={1} />);
    
    // Check loading text initially
    expect(screen.getByText('loding')).toBeInTheDocument();

    // Wait for the data table cell
    await waitFor(() => {
      expect(screen.queryByText('loding')).not.toBeInTheDocument();
      expect(screen.getByText('Approved')).toBeInTheDocument();
      expect(screen.getByText('Test comment')).toBeInTheDocument();
      // the date formatting depends on local environment but will render something, just check if '-' is absent in its place
    });
  });

  it('handles response where data is in res.data.histories and empty values', async () => {
    getHistoryMock.mockResolvedValue({
      data: {
        histories: [
          { wfStatus: null, createDate: null, remark: null }
        ]
      }
    });

    render(<HistoryTradeArea tradeareaId={2} />);
    
    await waitFor(() => {
      expect(screen.getAllByText('-').length).toBeGreaterThan(0);
    });
  });

  it('handles response where data is in res.data', async () => {
    getHistoryMock.mockResolvedValue({
      data: [{ wfStatus: { wfStatusName: 'Draft' }, createDate: null, remark: 'Some info' }]
    });

    render(<HistoryTradeArea tradeareaId={3} />);
    
    await waitFor(() => {
      expect(screen.getByText('Draft')).toBeInTheDocument();
      expect(screen.getByText('Some info')).toBeInTheDocument();
    });
  });

  it('handles empty data returned from the API', async () => {
    getHistoryMock.mockResolvedValue([]);

    render(<HistoryTradeArea tradeareaId={4} />);

    await waitFor(() => {
      expect(screen.getByText('no_data')).toBeInTheDocument();
    });
  });

  it('handles an error returned from the API gracefully', async () => {
    getHistoryMock.mockRejectedValue(new Error('Network error'));

    render(<HistoryTradeArea tradeareaId={5} />);
    
    await waitFor(() => {
      expect(screen.getByText('no_data')).toBeInTheDocument();
    });
  });
});
