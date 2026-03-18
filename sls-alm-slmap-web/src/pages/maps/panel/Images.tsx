import {
  getPoiImages,
  uploadPoiImages,
  deletePoiImage,
  type getPoiImageResponse,
} from '@/services/poi.service';
import React, { useState, useEffect, useRef } from 'react';
import PopupAlert from '@/components/base/PopupAlert';
import { useTranslation } from 'react-i18next';

interface ImagesProps {
  poiId: string;
}

export const Images: React.FC<ImagesProps> = ({ poiId }) => {
  const [images, setImages] = useState<getPoiImageResponse[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupType, setPopupType] = useState<'success' | 'error' | 'info'>('success');
  const [popupMessage, setPopupMessage] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { t } = useTranslation(['image', 'common']);

  const showPopup = (type: 'success' | 'error' | 'info', message: string) => {
    setPopupType(type);
    setPopupMessage(message);
    setPopupOpen(true);
  };

  const fetchImages = async () => {
    if (!poiId) return;

    try {
      setLoading(true);
      const data = await getPoiImages(Number(poiId));
      setImages(data);
    } catch (error) {
      console.error(error);
      showPopup('error', t('alert.load_error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSelectedFiles([]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    fetchImages();
  }, [poiId]);

  const handleSelectFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setSelectedFiles(prev => [...prev, ...Array.from(files)]);
  };

  const handleRemoveSelected = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      const success = await uploadPoiImages(Number(poiId), selectedFiles);

      if (!success) {
        showPopup('error', t('alert.upload_error'));
        return;
      }

      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      fetchImages();

      showPopup('success', t('alert.upload_success'));
    } catch (error) {
      console.error(error);
      showPopup('error', t('alert.upload_error'));
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      const success = await deletePoiImage(deleteId);

      if (!success) {
        showPopup('error', t('alert.delete_error'));
        return;
      }

      fetchImages();
      showPopup('success', t('alert.delete_success'));
    } catch (error) {
      console.error(error);
      showPopup('error', t('alert.delete_error'));
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="p-4 flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{t('images')}</h3>
        <label className="btn btn-md btn-outline btn-sm !bg-[#2563EB] hover:!bg-[#1D4ED8] !border-none text-white rounded-lg cursor-pointer">
          + {t('upload')}
          {t('images')}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            multiple
            onChange={handleSelectFiles}
            className="hidden"
          />
        </label>
      </div>

      {/* Upload Button After Select */}
      {selectedFiles.length > 0 && (
        <div className="mb-4 space-y-3">
          <div className="flex flex-wrap gap-2 border rounded-lg p-3 bg-gray-50 max-h-[80px] overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <span
                key={index}
                className="inline-flex items-center bg-gray-800 text-white text-xs px-3 py-1 rounded-full max-w-[150px]"
              >
                <span className="truncate">{file.name}</span>

                <span
                  onClick={() => handleRemoveSelected(index)}
                  className="ml-2 cursor-pointer hover:text-red-400"
                >
                  ×
                </span>
              </span>
            ))}
          </div>

          <button
            onClick={handleUpload}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
          >
            {t('upload')} {selectedFiles.length} {t('files')}
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && <div>{t('loading_images')}</div>}

      {/* Empty State */}
      {!loading && images.length === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 text-gray-500">
          <p className="mb-4 mt-4">{t('no_images')}</p>
        </div>
      )}

      {/* Images Grid */}
      {!loading && images.length > 0 && (
        <div
          className={`overflow-y-auto pr-2 scrollbar-thin ${
            selectedFiles.length > 0 ? 'max-h-[25vh]' : 'max-h-[45vh]'
          }`}
        >
          <div className="grid grid-cols-3 gap-4">
            {images.map(img => (
              <div
                key={img.id}
                className="relative rounded-lg overflow-hidden border shadow-sm group"
              >
                <img
                  src={img.url}
                  alt={img.name}
                  className="w-full h-40 object-cover cursor-pointer transition-transform group-hover:scale-105"
                  onClick={() => setPreview(img.url)}
                />

                {/* Delete Button */}
                <button
                  onClick={() => setDeleteId(img.id)}
                  className="absolute top-2 right-2 bg-black/60 hover:bg-red-600 text-white text-xs px-2 py-1 rounded opacity-70 group-hover:opacity-100 transition"
                >
                  {t('common:delete')}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => setPreview(null)}
        >
          <img src={preview} className="max-h-[80vh] max-w-[80vw] rounded shadow-lg" />
        </div>
      )}

      {/* Alert Popup */}
      <PopupAlert
        open={popupOpen}
        type={popupType}
        message={popupMessage}
        onClose={() => setPopupOpen(false)}
      />

      {/* Confirm Delete */}
      <PopupAlert
        open={deleteId !== null}
        type="info"
        message={t('alert.delete_image')}
        confirmText={t('common:delete')}
        cancelText={t('common:cancel')}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
};
