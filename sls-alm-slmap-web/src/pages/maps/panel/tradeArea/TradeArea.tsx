import React, { useCallback, useEffect, useState } from 'react';
import type { LocationInfo } from '@/services/location.service';
import { DeliveryArea } from './DeliveryArea';
import { StoreHub } from './StoreHub';
import { findTradeareaTypes } from '@/services/tradeArea.service';
import { useTranslation } from 'react-i18next';

interface TradeAreaProps {
  poiId?: string;
  location: LocationInfo;
}

export const TradeArea: React.FC<TradeAreaProps> = props => {
  const { t } = useTranslation(['tradearea']);
  const [activeTab, setActiveTab] = useState<string>('delivery_area');
  const [types, setTypes] = useState<string[]>([]);

  const MENU_ITEMS = {
    delivery_area: { id: 'delivery_area', label: t('delivery_area') },
    store_hub: { id: 'store_hub', label: t('store_hub') },
  };

  const fetchTradeAreaTypes = useCallback(async () => {
    try {
      const res = await findTradeareaTypes();
      setTypes(res.data.map(type => type.name));
    } catch (error) {
      console.error('Error fetching trade area types:', error);
    }
  }, []);

  useEffect(() => {
    fetchTradeAreaTypes();
    // console.log('TradeArea props:', props);
  }, [fetchTradeAreaTypes]);

  return (
    <div className="flex w-full h-[calc(100vh-340px)] bg-white border border-blue-100 rounded-lg shadow-sm overflow-hidden">
      {' '}
      {/*  เติม sticky top-0 self-start */}
      <div className="w-40 bg-blue-50/50 border-r border-blue-100 flex flex-col shrink-0 overflow-y-auto">
        {types.map(item => {
          const isActive = activeTab === item;
          return (
            <button
              key={item}
              onClick={() => setActiveTab(item)}
              className={`flex items-center justify-between px-6 py-4 pl-4 text-left font-medium transition-all shrink-0 ${
                isActive ? 'bg-blue-600 text-white' : 'text-blue-800 hover:bg-blue-100'
              }`}
            >
              <span>{MENU_ITEMS[item as keyof typeof MENU_ITEMS]?.label || 'Other'}</span>
              {isActive && <span>›</span>}
            </button>
          );
        })}
      </div>
      {/* จบส่วน Sidebar */}
      {/* ส่วน Content */}
      <div className="flex-1 bg-white overflow-y-auto relative">
        <div className="p-2 pb-2">
          <div className="p-2 pb-2">
            {activeTab === 'delivery_area' && <DeliveryArea {...props} />}
            {activeTab === 'store_hub' && <StoreHub {...props} />}
          </div>
        </div>
      </div>
    </div>
  );
};
