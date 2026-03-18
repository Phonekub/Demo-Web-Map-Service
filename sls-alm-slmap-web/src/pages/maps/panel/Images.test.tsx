import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

const getPoiImages = vi.fn();
const uploadPoiImages = vi.fn();
const deletePoiImage = vi.fn();

vi.mock('@/services/poi.service', () => ({
  getPoiImages: (...args: unknown[]) => getPoiImages(...args),
  uploadPoiImages: (...args: unknown[]) => uploadPoiImages(...args),
  deletePoiImage: (...args: unknown[]) => deletePoiImage(...args),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/components/base/PopupAlert', () => ({
  __esModule: true,
  default: ({
    open,
    type,
    message,
    confirmText,
    cancelText,
    onConfirm,
    onCancel,
    onClose,
  }: any) =>
    open ? (
      <div data-testid={`popup-${type}`}>
        <div>{message}</div>
        {confirmText ? <button onClick={onConfirm}>{confirmText}</button> : null}
        {cancelText ? <button onClick={onCancel}>{cancelText}</button> : null}
        <button onClick={onClose}>close-popup</button>
      </div>
    ) : null,
}));

import { Images } from './Images';

describe('Images', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Section: loading and empty state
  it('loads images for the poi and shows the empty state when none are returned', async () => {
    let resolveImages: (value: unknown) => void = () => {};
    getPoiImages.mockReturnValue(
      new Promise(resolve => {
        resolveImages = resolve;
      })
    );

    render(<Images poiId="12" />);

    expect(screen.getByText('images')).toBeInTheDocument();
    expect(screen.getByText('loading_images')).toBeInTheDocument();
    expect(getPoiImages).toHaveBeenCalledWith(12);

    resolveImages([]);

    expect(await screen.findByText('no_images')).toBeInTheDocument();
  });

  // Section: image grid and preview flow
  it('renders fetched images and opens then closes the preview overlay', async () => {
    getPoiImages.mockResolvedValue([
      { id: 1, name: 'front-store', url: 'https://img.test/front.jpg' },
    ]);

    render(<Images poiId="99" />);

    const image = await screen.findByRole('img', { name: 'front-store' });
    expect(image).toHaveAttribute('src', 'https://img.test/front.jpg');
    expect(screen.getByText('common:delete')).toBeInTheDocument();

    await userEvent.click(image);

    const previewImage = screen.getAllByRole('img')[1];
    expect(previewImage).toHaveAttribute('src', 'https://img.test/front.jpg');

    fireEvent.click(previewImage.parentElement as HTMLElement);

    await waitFor(() => {
      expect(screen.getAllByRole('img')).toHaveLength(1);
    });
  });

  // Section: upload success and error flows
  it('uploads selected files, refreshes images, and shows success feedback', async () => {
    const user = userEvent.setup();
    getPoiImages
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { id: 7, name: 'after-upload', url: 'https://img.test/new.jpg' },
      ]);
    uploadPoiImages.mockResolvedValue(true);

    const { container } = render(<Images poiId="55" />);

    await screen.findByText('no_images');

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const fileA = new File(['a'], 'a.png', { type: 'image/png' });
    const fileB = new File(['b'], 'b.jpg', { type: 'image/jpeg' });

    fireEvent.change(fileInput, { target: { files: [fileA, fileB] } });

    expect(screen.getByText('a.png')).toBeInTheDocument();
    expect(screen.getByText('b.jpg')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'upload 2 files' }));

    await waitFor(() => {
      expect(uploadPoiImages).toHaveBeenCalledWith(55, [fileA, fileB]);
      expect(getPoiImages).toHaveBeenCalledTimes(2);
    });

    expect(await screen.findByText('alert.upload_success')).toBeInTheDocument();
    expect(screen.getByTestId('popup-success')).toBeInTheDocument();
    expect(await screen.findByRole('img', { name: 'after-upload' })).toBeInTheDocument();
  });

  // Section: delete and failure flows
  it('confirms deletion and shows an error popup when upload fails', async () => {
    const user = userEvent.setup();
    getPoiImages.mockResolvedValue([{ id: 3, name: 'to-delete', url: '/delete.jpg' }]);
    deletePoiImage.mockResolvedValue(true);
    uploadPoiImages.mockResolvedValue(false);

    const { container } = render(<Images poiId="88" />);

    await screen.findByRole('img', { name: 'to-delete' });

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['x'], 'broken.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await user.click(screen.getByRole('button', { name: 'upload 1 files' }));
    expect(await screen.findByText('alert.upload_error')).toBeInTheDocument();

    const card = screen
      .getByRole('img', { name: 'to-delete' })
      .closest('div') as HTMLElement;
    await user.click(within(card).getByRole('button', { name: 'common:delete' }));

    expect(await screen.findByText('alert.delete_image')).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: 'common:delete' }).at(-1)!);

    await waitFor(() => {
      expect(deletePoiImage).toHaveBeenCalledWith(3);
    });
    expect(await screen.findByText('alert.delete_success')).toBeInTheDocument();
  });
});
