import { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import { Input, type DropdownOption } from '../../../components';
import PopupAlert from '../../../components/base/PopupAlert';
import { fetchLayers } from '../../../services/master.service';
import { useQuery } from '@tanstack/react-query';
import { createPoiPotential } from '../../../services/location.service';
import type { CoordinateBasicInfo } from '@/components/base/LocationClickPopup';

interface EnvInformationProps {
  type?: 'default' | 'env';
  poiId: string;
  coordinateBasicInfo?: CoordinateBasicInfo | null;
}

export const EnvInformation = forwardRef<any, EnvInformationProps>(
  ({ type, coordinateBasicInfo }, ref) => {
    const [formData, setFormData] = useState({
      name: '',
      address: '',
      category: 0,
      poi: { latitude: 0, longitude: 0 },
      // subCategory: 0,
    });
    const [showAlert, setShowAlert] = useState(false);
    const [popupType, setPopupType] = useState<'success' | 'error'>('success');
    const [popupMessage, setPopupMessage] = useState('');
    const [invalidFields, setInvalidFields] = useState<string[]>([]);

    const requiredFields = ['name', 'address', 'category'];

    useEffect(() => {
      refetchLayers();
    }, []);

    const validate = () => {
      const invalid = requiredFields.filter(field => {
        const value = formData[field as keyof typeof formData];
        if (typeof value === 'number') {
          return !value;
        }
        return !value || value.toString().trim() === '';
      });
      setInvalidFields(invalid);
      if (invalid.length > 0) {
        setPopupType('error');
        setPopupMessage('กรุณากรอกข้อมูลที่มีเครื่องหมาย * ให้ครบถ้วน');
        setShowAlert(true);
        return false;
      }
      setInvalidFields([]);
      return true;
    };

    const handleLayerFetch = async (): Promise<DropdownOption[]> => {
      try {
        const result = await fetchLayers();
        // const result = await fetchLayers({ canCreatePoi: 'Y' });
        return result.map<DropdownOption>(layer => ({
          value: layer.value,
          label: layer.text,
        }));
      } catch (error) {
        console.error('Failed to fetch layers:', error);
        return [];
      }
    };
    const { data: layerData, refetch: refetchLayers } = useQuery({
      queryKey: ['layerId'],
      queryFn: handleLayerFetch,
      enabled: false,
    });

    const handleUpdate = (field: string, value: string | number) => {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    };

    const handleSave = async () => {
      if (!validate()) return;

      try {
        const latitude = coordinateBasicInfo?.latitude || 0;
        const longitude = coordinateBasicInfo?.longitude || 0;

        // Fetch zone and subzone from coordinate info
        const zone = coordinateBasicInfo?.zone || '';
        const subzone = coordinateBasicInfo?.subzone || '';

        // Prepare data according to CreatePoiRequest interface
        const data = {
          type: 'ENVIRONMENT' as const,
          latitude,
          longitude,
          zone,
          subzone,
          environment: {
            name: formData.name,
            address: formData.address,
            category: formData.category,
          },
        };

        await createPoiPotential(data);

        setPopupType('success');
        setPopupMessage('บันทึกข้อมูลเรียบร้อย!');
        setShowAlert(true);
      } catch (error) {
        console.error('[API Error]', error);
        setPopupType('error');
        setPopupMessage('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        setShowAlert(true);
      }
    };

    useImperativeHandle(
      ref,
      () => ({
        handleSave,
      }),
      [formData]
    );

    if (type !== 'env') return null;
    return (
      <div className="flex-1 flex flex-col border p-2 ">
        {/* Show poiId on top like PointPotential */}
        {/* <div className="px-4 py-2 text-xs text-gray-500 font-mono">POI ID: {poiId || '-'}</div> */}
        <div className="overflow-y-auto">
          <div className="form-control w-full mb-3 pr-2 pl-2">
            <label className="text-sm font-semibold text-gray-500">
              ประเภท<span className="text-red-500">*</span>{' '}
            </label>
            <select
              className={`select select-bordered w-full font-normal bg-white text-ellipsis overflow-hidden whitespace-nowrap ${!formData.category ? 'text-gray-400' : 'text-gray-700'} ${invalidFields.includes('category') ? 'border-red-500' : 'border-gray-300'}`}
              value={formData.category || ''}
              onChange={e => handleUpdate('category', Number(e.target.value))}
            >
              <option value="" hidden>
                -กรุณาเลือก-
              </option>
              {layerData?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {invalidFields.includes('category') && (
              <div className="text-xs text-red-500 ">*กรุณาเลือกประเภท</div>
            )}
          </div>

          {/* <div className="form-control w-full mb-3 pr-2 pl-2">
          <label className="text-sm font-semibold text-gray-500">
            ประเภทย่อย<span className="text-red-500">*</span>{' '}
          </label>
          <select
            className={`select select-bordered w-full font-normal bg-white text-ellipsis overflow-hidden whitespace-nowrap ${!formData.subCategory ? 'text-gray-400' : 'text-gray-700'} ${invalidFields.includes('subCategory') ? 'border-red-500' : 'border-gray-300'}`}
            value={formData.subCategory || ''}
            onChange={e => handleUpdate('subCategory', Number(e.target.value))}
          >
            <option value="" disabled hidden>
              -กรุณาเลือก-
            </option>
            <option value={1}>โรงเรียนสามัญ</option>
            <option value={2}>โรงเรียน2</option>
          </select>
          {invalidFields.includes('subCategory') && (
            <div className="text-xs text-red-500 ">*กรุณาเลือกประเภทย่อย</div>
          )}
        </div> */}

          <div className="form-control w-full mb-3 pr-2 pl-2">
            <label className="text-sm font-semibold text-gray-500">
              ชื่อสถานที่<span className="text-red-500">*</span>{' '}
            </label>
            <Input
              type="text"
              placeholder="ชื่อสถานที่"
              value={formData.name}
              onChange={e => handleUpdate('name', e.target.value)}
              className={`w-full p-2 border rounded-md outline-none focus:border-blue-400 ${invalidFields.includes('name') ? 'border-red-500' : 'border-gray-300'}`}
            />
            {invalidFields.includes('name') && (
              <div className="text-xs text-red-500 ">*กรุณากรอกชื่อสถานที่</div>
            )}
          </div>

          <div className="form-control w-full mb-3 pr-2 pl-2">
            <label className="text-sm font-semibold text-gray-500">
              ที่ตั้ง<span className="text-red-500">*</span>{' '}
            </label>
            <Input
              type="text"
              placeholder="ที่ตั้ง"
              value={formData.address}
              onChange={e => handleUpdate('address', e.target.value)}
              className={`w-full p-2 border rounded-md outline-none focus:border-blue-400 ${invalidFields.includes('address') ? 'border-red-500' : 'border-gray-300'}`}
            />
            {invalidFields.includes('address') && (
              <div className="text-xs text-red-500 ">*กรุณากรอกที่ตั้ง</div>
            )}
          </div>
        </div>
        <PopupAlert
          open={showAlert}
          type={popupType}
          message={popupMessage}
          onClose={() => setShowAlert(false)}
        />
      </div>
    );
  }
);

export default EnvInformation;
