import { fireEvent, render, screen } from '@testing-library/react';
import PopupAlert from './PopupAlert';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => ({ confirm: 'Confirm', cancel: 'Cancel' })[key] ?? key,
  }),
}));

describe('PopupAlert', () => {
  // Section: closed state and default success dialog
  it('renders nothing when closed and shows the default success dialog when open', () => {
    const { rerender, container } = render(
      <PopupAlert open={false} message="Saved successfully" />
    );

    expect(container).toBeEmptyDOMElement();

    rerender(<PopupAlert open message="Saved successfully" />);

    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Saved successfully')).toBeInTheDocument();
    expect(screen.getByText('ปิด', { selector: 'button' })).toBeInTheDocument();
    const outerIcon = screen.getByText('Success').previousElementSibling as HTMLElement;
    const innerIcon = outerIcon.firstElementChild as HTMLElement;

    expect(outerIcon).toHaveClass('bg-[#f0f9f4]');
    expect(innerIcon).toHaveClass('bg-[#43bc82]');
  });

  // Section: confirm and cancel actions
  it('renders custom confirm and cancel actions and forwards callbacks', () => {
    const handleConfirm = vi.fn();
    const handleCancel = vi.fn();

    render(
      <PopupAlert
        open
        type="error"
        title="Delete failed"
        message="Try again later"
        confirmText="Retry"
        cancelText="Dismiss"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );

    expect(screen.getByText('Delete failed')).toBeInTheDocument();
    expect(screen.getByText('Try again later')).toBeInTheDocument();
    expect(screen.getByText('Retry', { selector: 'button' })).toBeInTheDocument();
    expect(screen.getByText('Dismiss', { selector: 'button' })).toBeInTheDocument();

    fireEvent.click(screen.getByText('Retry', { selector: 'button' }));
    fireEvent.click(screen.getByText('Dismiss', { selector: 'button' }));

    expect(handleConfirm).toHaveBeenCalledTimes(1);
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });

  // Section: backdrop cancel and message styling
  it('uses cancel or close handlers for the backdrop and applies custom message classes', () => {
    const handleCancel = vi.fn();
    const handleClose = vi.fn();

    const { container, rerender } = render(
      <PopupAlert
        open
        type="info"
        message="Check your data"
        messageClassName="text-left font-semibold"
        onCancel={handleCancel}
        onConfirm={vi.fn()}
      />
    );

    const backdrop = container.querySelector('[aria-hidden="true"]') as HTMLElement;
    fireEvent.click(backdrop);

    expect(handleCancel).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Check your data')).toHaveClass('text-left', 'font-semibold');

    rerender(<PopupAlert open message="Standalone close" onClose={handleClose} />);

    fireEvent.click(container.querySelector('[aria-hidden="true"]') as HTMLElement);
    fireEvent.click(screen.getByText('ปิด', { selector: 'button' }));

    expect(handleClose).toHaveBeenCalledTimes(2);
  });
});
