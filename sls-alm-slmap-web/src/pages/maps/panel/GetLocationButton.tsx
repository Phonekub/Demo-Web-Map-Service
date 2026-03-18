import React, { useState } from 'react';

import { MapPinIcon } from '@heroicons/react/24/solid';

interface GetLocationButtonProps {
  onLocationFound: (latitude: number, longitude: number) => void;
}

export const GetLocationButton: React.FC<GetLocationButtonProps> = ({
  onLocationFound,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError('เบราว์เซอร์ไม่รองรับการระบุตำแหน่ง');
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        onLocationFound(latitude, longitude);
        setIsLoading(false);
      },
      error => {
        let errorMessage = 'ไม่สามารถระบุตำแหน่งได้';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'กรุณาอนุญาตการเข้าถึงตำแหน่ง';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'ไม่สามารถระบุตำแหน่งได้';
            break;
          case error.TIMEOUT:
            errorMessage = 'หมดเวลาในการระบุตำแหน่ง';
            break;
        }
        setError(errorMessage);
        setIsLoading(false);

        // Clear error after 3 seconds
        setTimeout(() => setError(null), 3000);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="relative">
      <div className="tooltip tooltip-left" data-tip="ระบุตำแหน่งปัจจุบัน">
        <button
          onClick={handleGetLocation}
          disabled={isLoading}
          className={`bg-white rounded-lg shadow-lg p-2 flex items-center justify-center border border-gray-200 transition-all duration-200 ease-in-out hover:bg-[#f5f5f5] hover:shadow-[0_2px_8px_rgba(0,0,0,0.15)] hover:border-gray-500 ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          title="ระบุตำแหน่งปัจจุบัน"
        >
          {isLoading ? (
            <svg
              className="animate-spin h-4 w-4 text-blue-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <MapPinIcon className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Error tooltip */}
      {error && (
        <div className="absolute bottom-full left-0 mb-2 bg-red-500 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
          {error}
          <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-500" />
        </div>
      )}
    </div>
  );
};
