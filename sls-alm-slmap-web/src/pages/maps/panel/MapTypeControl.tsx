import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export type MapType = 'street' | 'terrain' | 'hybrid' | 'outdoors';

interface MapTypeControlProps {
  currentType: MapType;
  onToggle: (type: MapType) => void;
}

interface MapTypeOption {
  type: MapType;
  label: string;
  icon: React.ReactNode;
}

export const MapTypeControl: React.FC<MapTypeControlProps> = ({
  currentType,
  onToggle,
}) => {
  const { t } = useTranslation(['maps']);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const mapTypes: MapTypeOption[] = [
    {
      type: 'street',
      label: t('street_map'),
      icon: (
        <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none">
          <rect width="48" height="48" rx="4" fill="#F5F5F5" />
          <path d="M12 20h24M12 24h24M12 28h24" stroke="#666" strokeWidth="2" />
          <circle cx="18" cy="18" r="3" fill="#4285F4" />
        </svg>
      ),
    },
    {
      type: 'terrain',
      label: t('terrain_map'),
      icon: (
        <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none">
          <defs>
            <pattern
              id="terrain-pattern"
              x="0"
              y="0"
              width="8"
              height="8"
              patternUnits="userSpaceOnUse"
            >
              <rect width="4" height="4" fill="#8B7355" />
              <rect x="4" y="4" width="4" height="4" fill="#8B7355" />
              <rect x="4" width="4" height="4" fill="#A08968" />
              <rect y="4" width="4" height="4" fill="#A08968" />
            </pattern>
          </defs>
          <rect width="48" height="48" rx="4" fill="url(#terrain-pattern)" />
        </svg>
      ),
    },
    {
      type: 'hybrid',
      label: t('hybrid_map'),
      icon: (
        <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none">
          <defs>
            <pattern
              id="hybrid-pattern"
              x="0"
              y="0"
              width="8"
              height="8"
              patternUnits="userSpaceOnUse"
            >
              <rect width="4" height="4" fill="#8B7355" />
              <rect x="4" y="4" width="4" height="4" fill="#8B7355" />
              <rect x="4" width="4" height="4" fill="#A08968" />
              <rect y="4" width="4" height="4" fill="#A08968" />
            </pattern>
          </defs>
          <rect width="48" height="48" rx="4" fill="url(#hybrid-pattern)" />
          <path d="M8 28h32M8 32h32" stroke="white" strokeWidth="1.5" opacity="0.8" />
          <text
            x="24"
            y="20"
            fontSize="8"
            fill="white"
            textAnchor="middle"
            fontWeight="bold"
          >
            ถนน
          </text>
        </svg>
      ),
    },
    {
      type: 'outdoors',
      label: t('outdoor_map'),
      icon: (
        <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none">
          <rect width="48" height="48" rx="4" fill="#E8F5E9" />
          <path d="M8 32c0-8 8-16 16-16s16 8 16 16" fill="#81C784" />
          <path d="M12 36c0-6 6-12 12-12s12 6 12 12" fill="#66BB6A" />
          <circle cx="24" cy="18" r="4" fill="#FDD835" />
        </svg>
      ),
    },
  ];

  const currentOption =
    mapTypes.find(option => option.type === currentType) || mapTypes[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (type: MapType) => {
    onToggle(type);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Toggle Button */}
      <div className="tooltip tooltip-left" data-tip={currentOption.label}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-white rounded-lg shadow-lg p-2 flex items-center justify-center border border-gray-200 transition-all duration-200 ease-in-out hover:bg-[#f5f5f5] hover:shadow-[0_2px_8px_rgba(0,0,0,0.15)] hover:border-gray-500"
          title={currentOption.label}
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </button>
      </div>

      {/* Horizontal Dropdown Menu - slides to the left */}
      {isOpen && (
        <div className="absolute bottom-0 right-full mr-2 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden z-50">
          <div className="p-2">
            {/* Horizontal layout */}
            <div className="flex gap-2">
              {mapTypes.map(option => (
                <button
                  key={option.type}
                  onClick={() => handleSelect(option.type)}
                  className={`flex flex-col items-center p-1 rounded-lg transition-all hover:bg-gray-50 ${
                    currentType === option.type
                      ? 'bg-blue-50 ring-2 ring-blue-500'
                      : 'bg-white'
                  }`}
                >
                  <div className="relative">
                    {option.icon}
                    {currentType === option.type && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <div
                      className={`text-xs font-medium whitespace-nowrap ${
                        currentType === option.type ? 'text-blue-600' : 'text-gray-700'
                      }`}
                    >
                      {option.label}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
