import React, { useEffect, useState } from 'react';
import { Button, Input, Modal } from '@/components';
import {
  fetchSevenNearby,
  fetchLocations,
  type fetchSeven,
  type Location,
} from '@/services/location.service';
import { useTranslation } from 'react-i18next';

interface SevenElevenSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selectSeven: fetchSeven | null) => void;
  lat: number;
  long: number;
}

const SevenElevenSelector: React.FC<SevenElevenSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
  lat,
  long,
}) => {
  const { t } = useTranslation(['common', 'maps']);
  const [selectedSeven, setSelectedSeven] = useState<fetchSeven | null>(null);
  const [sevenNearby, setSevenNearby] = useState<fetchSeven[]>([]);
  const [branchCodeForSearch, setBranchCodeForSearch] = useState<string>('');
  const [branchNameForSearch, setBranchNameForSearch] = useState<string>('');

  const loadNearbyStores = async () => {
    const data = await fetchSevenNearby(lat, long, 1000);
    setSevenNearby(data);
  };

  const searchByText = async (searchText: string) => {
    const response = await fetchLocations({
      type: 'sevenEleven',
      text: searchText,
      lat,
      long,
      displayOnMap: false,
    });

    const mappedData: fetchSeven[] = (response?.data?.search || []).map(
      (item: Location) => ({
        id: item.id,
        branchName: item.branchName,
        branchCode: item.branchCode,
        distance: (item as any).distance || 0,
      })
    );

    setSevenNearby(mappedData);
  };

  useEffect(() => {
    loadNearbyStores();
  }, [lat, long]);

  const handleSelect = (seven: fetchSeven) => {
    if (selectedSeven?.id === seven.id) {
      setSelectedSeven(null);
    } else {
      setSelectedSeven(seven);
    }
  };

  const handleSearch = async () => {
    const searchText = branchCodeForSearch || branchNameForSearch;

    if (!searchText.trim()) {
      // If no search text, reload nearby stores
      await loadNearbyStores();
      return;
    }

    await searchByText(searchText);
    setBranchCodeForSearch('');
    setBranchNameForSearch('');
  };

  const footerActions = (
    <div className="w-full flex justify-center">
      <Button
        className="btn btn-sm px-8 bg-gray-200 hover:bg-gray-300 text-black border-gray-400"
        onClick={() => {
          onSelect(selectedSeven);
          onClose();
        }}
      >
        {t('common:choose')}
      </Button>
    </div>
  );

  return (
    <Modal
      id="seven-eleven-modal"
      title={t('maps:seven_selector_title')}
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      actions={footerActions}
      closeButton={true}
    >
      <div className="flex flex-col gap-4 text-sm text-gray-800">
        <div className="flex flex-wrap items-center justify-center gap-4 py-2">
          <div className="flex items-center gap-2">
            <label className="font-bold whitespace-nowrap">
              {t('maps:seven_store_code')}:
            </label>
            <Input
              type="text"
              placeholder={t('maps:seven_selector_enter_store_code')}
              className="input input-sm h-8 border-b border-t-0 border-x-0 rounded-none focus:outline-none focus:border-blue-500 w-48 px-1 placeholder-gray-400 italic bg-transparent border-gray-400"
              value={branchCodeForSearch}
              onChange={e => setBranchCodeForSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="font-bold whitespace-nowrap">
              {t('maps:seven_store_name')}:
            </label>
            <Input
              type="text"
              placeholder={t('maps:seven_selector_enter_store_name')}
              className="input input-sm h-8 border-b border-t-0 border-x-0 rounded-none focus:outline-none focus:border-blue-500 w-48 px-1 placeholder-gray-400 italic bg-transparent border-gray-400"
              value={branchNameForSearch}
              onChange={e => setBranchNameForSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
        </div>

        <div className="flex justify-center mb-2">
          <Button
            className="btn btn-sm bg-gray-100 border-gray-300 shadow-sm hover:bg-gray-200 text-black px-6"
            onClick={handleSearch}
          >
            {t('common:search')}
          </Button>
        </div>

        <div className="text-black font-semibold">
          {t('maps:seven_selector_radius')}{' '}
          <span className="text-red-600 font-bold">
            ({t('maps:seven_selector_radius_message')})
          </span>
        </div>

        {/* ตารางข้อมูล */}
        <div className="border border-gray-300 overflow-x-auto overflow-y-auto max-h-[300px] relative">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#EBE8D8] text-black">
                <th className="p-2 border border-gray-300 w-10 text-center"></th>
                <th className="p-2 border border-gray-300 font-bold text-center">
                  {t('maps:seven_store_code')}
                </th>
                <th className="p-2 border border-gray-300 font-bold text-center">
                  {t('maps:seven_store_name')}
                </th>
                <th className="p-2 border border-gray-300 font-bold text-center w-32">
                  {t("maps:seven_selector_Distance")}
                </th>
              </tr>
            </thead>
            <tbody>
              {sevenNearby.map(item => (
                <tr
                  key={item.id}
                  className={`cursor-pointer hover:bg-blue-50 ${
                    selectedSeven?.id === item.id ? 'bg-blue-100' : ''
                  }`}
                  onClick={() => handleSelect(item)}
                >
                  <td className="p-1 border border-gray-300 text-center"></td>
                  <td className="p-1 px-2 border border-gray-300">{item.branchCode}</td>
                  <td className="p-1 px-2 border border-gray-300">{item.branchName}</td>
                  <td className="p-1 px-2 border border-gray-300">{item.distance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
};

export default SevenElevenSelector;
