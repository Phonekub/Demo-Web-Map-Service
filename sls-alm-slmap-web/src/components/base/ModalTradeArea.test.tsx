import { fireEvent, render, screen } from '@testing-library/react';
import ModalTradeArea from './ModalTradeArea';

vi.mock('./TabModalTradeArea/InformationTradeArea', () => ({
  __esModule: true,
  default: ({ view, poiId, tradeareaId }: any) => (
    <div>{`Information view=${view} poi=${poiId} tradearea=${tradeareaId}`}</div>
  ),
}));

vi.mock('./TabModalTradeArea/HistoryTradeArea', () => ({
  __esModule: true,
  default: ({ tradeareaId }: any) => <div>{`History tradearea=${tradeareaId}`}</div>,
}));

describe('ModalTradeArea', () => {
  // Section: closed state
  it('renders nothing when the modal is closed', () => {
    const { container } = render(
      <ModalTradeArea isOpen={false} poiId={11} tradeareaId={22} view="view" />
    );

    expect(container).toBeEmptyDOMElement();
  });

  // Section: initial tab rendering and close action
  it('shows the information tab by default and forwards the close action', () => {
    const handleClose = vi.fn();

    render(
      <ModalTradeArea
        isOpen
        poiId={11}
        tradeareaId={22}
        view="edit"
        onClose={handleClose}
      />
    );

    expect(screen.getByText('Information')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(
      screen.getByText('Information view=edit poi=11 tradearea=22')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  // Section: tab switching
  it('switches to the history tab content when the sidebar tab is clicked', () => {
    render(<ModalTradeArea isOpen poiId={77} tradeareaId={88} view="info" />);

    fireEvent.click(screen.getByRole('button', { name: 'History' }));

    expect(screen.getByText('History tradearea=88')).toBeInTheDocument();
    expect(
      screen.queryByText('Information view=info poi=77 tradearea=88')
    ).not.toBeInTheDocument();
  });
});
