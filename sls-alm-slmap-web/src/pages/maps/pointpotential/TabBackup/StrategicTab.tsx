import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HoverDropdown, type DropdownOption } from '@/components/base/HoverDropdown';
import { Input } from '@/components';
import { type BackupProfile } from '@/services/backup.service';
import { fetchCommonCodes } from '@/services/master.service';
import type { LocationInfo } from '@/services/location.service';
import { BackupHeader } from './BackupHeader';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface StrategicTabRef {
  getData: () => {
    strategicLocation: string;
    strategicSupport: string;
    strategicPlace: string;
    strategicPlaceName: string;
    strategicPosition: string;
    strategicFloor: string;
  };
}

interface StrategicTabProps {
  backupData?: BackupProfile;
  location: LocationInfo | null;
  formLocNumber?: string;
}

// ============================================================================
// Constants
// ============================================================================

const QUERY_STALE_TIME = 30 * 60 * 1000; // 30 minutes

// ============================================================================
// Component
// ============================================================================

const StrategicTab = forwardRef<StrategicTabRef, StrategicTabProps>(
  ({ backupData, location, formLocNumber }, ref) => {
    // ============================================================================
    // Local State
    // ============================================================================
    const [strategicLocation, setStrategicLocation] = useState('');
    const [supportStrategic, setSupportStrategic] = useState('');
    const [locationCode, setLocationCode] = useState('');
    const [locationName, setLocationName] = useState('');
    const [pointLocation, setPointLocation] = useState('');
    const [namePointLocation, setNamePointLocation] = useState('');

    // ============================================================================
    // Data Fetching
    // ============================================================================
    const { data: strategicOptions = [] } = useQuery({
      queryKey: ['commonCodes', 'STRATEGIC_LOCATION'],
      queryFn: async () => {
        const result = await fetchCommonCodes('STRATEGIC_LOCATION');
        return result.map<DropdownOption>(item => ({
          value: item.value,
          label: item.text,
        }));
      },
      staleTime: QUERY_STALE_TIME,
    });

    // ============================================================================
    // Effects
    // ============================================================================
    useEffect(() => {
      if (backupData) {
        setStrategicLocation(backupData.strategicLocation || '');
        setSupportStrategic(backupData.strategicSupport || '');
        setLocationCode(backupData.strategicPlace || '');
        setLocationName(backupData.strategicPlaceName || '');
        setPointLocation(backupData.strategicPosition || '');
        setNamePointLocation(backupData.strategicFloor || '');
      }
    }, [backupData]);

    // ============================================================================
    // Exposed Methods
    // ============================================================================
    useImperativeHandle(ref, () => ({
      getData: () => ({
        strategicLocation,
        strategicSupport: supportStrategic,
        strategicPlace: locationCode,
        strategicPlaceName: locationName,
        strategicPosition: pointLocation,
        strategicFloor: namePointLocation,
      }),
    }));

    // ============================================================================
    // Render
    // ============================================================================
    return (
      <div className="px-4 py-3 pr-4">
        <BackupHeader location={location} formLocNumber={formLocNumber} />

        {/* Strategic Location Selection */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-600 mb-1">
              กลุ่ม Strategic Location
            </label>
            <HoverDropdown
              options={strategicOptions}
              value={strategicLocation}
              onChange={setStrategicLocation}
              placeholder="-กรุณาเลือก-"
              hoverBehavior="shadow"
              searchable
              maxHeight="200px"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-600 mb-1">
              Support กลุ่ม Strategic
            </label>
            <HoverDropdown
              options={strategicOptions}
              value={supportStrategic}
              onChange={setSupportStrategic}
              placeholder="-กรุณาเลือก-"
              hoverBehavior="shadow"
              searchable
              maxHeight="200px"
            />
          </div>
        </div>

        {/* Location Fields */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-600 mb-1">สถานที่ตั้ง</label>
            <HoverDropdown
              options={[]}
              value={locationCode}
              onChange={setLocationCode}
              placeholder="-กรุณาเลือก-"
              hoverBehavior="shadow"
              searchable={true}
              maxHeight="200px"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-600 mb-1">
              ชื่อสถานที่ตั้ง
            </label>
            <Input
              type="text"
              value={locationName}
              onChange={e => setLocationName(e.target.value)}
              placeholder=""
              className="w-full border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Position Fields */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-600 mb-1">
              ตำแหน่งที่ตั้ง
            </label>
            <HoverDropdown
              options={[]}
              value={pointLocation}
              onChange={setPointLocation}
              placeholder="-กรุณาเลือก-"
              hoverBehavior="shadow"
              searchable={true}
              maxHeight="200px"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-600 mb-1">
              ชื่อตำแหน่งที่ตั้ง
            </label>
            <Input
              type="text"
              value={namePointLocation}
              onChange={e => setNamePointLocation(e.target.value)}
              placeholder=""
              className="w-full border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    );
  }
);

export default StrategicTab;
