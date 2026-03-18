import React, { useCallback, useEffect, useState } from 'react';
import InformationTradeArea from './TabModalTradeArea/InformationTradeArea';
import HistoryTradeArea from './TabModalTradeArea/HistoryTradeArea';

export type TradeareaView = 'view' | 'info' | 'edit' | 'create' | 'save';

interface ModalTradeAreaProps {
  isOpen: boolean;
  onClose?: () => void;
  poiId: number;
  tradeareaId: number | null;
  view: TradeareaView;
}

const ModalTradeArea: React.FC<ModalTradeAreaProps> = ({
  isOpen,
  poiId,
  tradeareaId,
  view,
  onClose,
}) => {
  const sidebarMenu: string[] = ['Information', 'History'];
  const [activeTab, setActiveTab] = useState(sidebarMenu[0]);
  const [contentTab, setContentTab] = useState<React.ReactNode>(null);
  const contentMap = useCallback(() => {
    const map = new Map<string, React.ReactNode>([
      [
        'information',
        <InformationTradeArea view={view} poiId={poiId} tradeareaId={tradeareaId} />,
      ],
      ['history', <HistoryTradeArea tradeareaId={tradeareaId} />],
    ]);

    const content = map.get(activeTab.toLowerCase());

    if (!content) {
      return;
    }

    setContentTab(content);
  }, [activeTab, poiId, tradeareaId, view]);

  useEffect(() => {
    if (!isOpen) return;
    contentMap();
  }, [contentMap, isOpen]);

  return (
    <>
      {isOpen && (
        <div className="modal modal-open">
          <div
            className={`modal-box w-[800px] ${view === 'view' || view === 'info' ? 'h-[520px]' : 'h-[520px]'} max-w-none p-0 flex flex-row overflow-hidden`}
          >
            {sidebarMenu && (
              <div className="w-32 bg-blue-50 rounded-l-2xl flex flex-col py-3  border-r h-full">
                {sidebarMenu.map(menu => (
                  <button
                    key={menu}
                    className={`text-left px-6 py-3 text-base font-medium border-l-4 transition-colors  mb-1 ${
                      activeTab === menu
                        ? 'bg-blue-600 text-white border-blue-600 font-bold shadow'
                        : 'bg-transparent border-transparent text-blue-900 hover:bg-blue-100'
                    }`}
                    onClick={() => {
                      setActiveTab(menu);
                    }}
                  >
                    {menu}
                  </button>
                ))}
              </div>
            )}
            {/* Main Content */}
            <div className="flex-1 flex flex-col p-4 overflow-auto h-full">
              <div className="flex justify-end">
                {/*{type !== 'create' && (*/}
                <button
                  className="text-gray-400 hover:text-gray-700 text-3xl font-bold mb-2"
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                >
                  ×
                </button>
                {/*)}*/}
              </div>
              <div className="mb-6 h-full">{contentTab}</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ModalTradeArea;
