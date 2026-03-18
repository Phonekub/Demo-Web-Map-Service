import { fireEvent, render, screen } from '@testing-library/react';
import Modal from './Modal';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => ({ close: 'Close' })[key] ?? key,
  }),
}));

describe('Modal', () => {
  // Section: base rendering and close actions
  it('renders title, content, actions, and close controls when open', () => {
    const handleClose = vi.fn();

    const { container } = render(
      <Modal
        id="sample-modal"
        title="Edit quota"
        isOpen
        onClose={handleClose}
        actions={<button type="button">Save</button>}
      >
        <div>Modal body</div>
      </Modal>
    );

    const dialog = container.querySelector('dialog');
    const toggle = container.querySelector('#sample-modal') as HTMLInputElement;

    expect(dialog).toHaveClass('modal', 'modal-middle');
    expect(toggle).toHaveAttribute('id', 'sample-modal');
    expect(toggle).toBeChecked();
    expect(screen.getByText('Edit quota')).toBeInTheDocument();
    expect(screen.getByText('Modal body')).toBeInTheDocument();
    expect(screen.getByText('Save', { selector: 'button' })).toBeInTheDocument();

    fireEvent.click(screen.getByText('✕', { selector: 'button' }));
    fireEvent.click(screen.getByText('Close', { selector: 'button' }));
    fireEvent.click(screen.getByText('Close', { selector: 'label' }));

    expect(handleClose).toHaveBeenCalledTimes(3);
  });

  // Section: size, location, and custom close text
  it('applies requested size and location classes and uses custom close text', () => {
    const { container } = render(
      <Modal id="top-modal" isOpen size="xxl" location="top" closeText="Dismiss">
        <span>Top content</span>
      </Modal>
    );

    const dialog = container.querySelector('dialog');
    const modalBox = container.querySelector('.modal-box');

    expect(dialog).toHaveClass('modal-top');
    expect(screen.getByText('Top content').closest('div')).toHaveClass(
      'flex-1',
      'overflow-y-auto'
    );
    expect(screen.getByText('Dismiss')).toBeInTheDocument();
    expect(modalBox).toHaveClass('max-w-[90vw]', 'max-h-full');
  });

  // Section: close button opt-out
  it('omits close controls when closeButton is disabled', () => {
    render(
      <Modal id="no-close" title="Read only" isOpen closeButton={false}>
        <span>Read only content</span>
      </Modal>
    );

    expect(screen.getByText('Read only')).toBeInTheDocument();
    expect(screen.getByText('Read only content')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '✕' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
    expect(screen.getByText('Close', { selector: 'label' })).toBeInTheDocument();
  });
});
