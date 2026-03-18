import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { fetchLayers, type DropdownOption } from '@/services/master.service';
import { useMapStore } from '@/stores';

export interface LayerOption {
  id: string;
  name: string;
  visible: boolean;
  color?: string;
}

interface LayerControlProps {
  onLayersChange?: (
    layerIds: string[],
    layerSpatialTypes?: Record<string, string>
  ) => void;
}

export const LayerControl = ({ onLayersChange }: LayerControlProps) => {
  const { t } = useTranslation(['maps']);
  const [isOpen, setIsOpen] = useState(false);

  // Use Zustand store for layer visibility (persists across remounts)
  const { layerVisibility, setLayerVisibility } = useMapStore(state => ({
    layerVisibility: state.layerVisibility,
    setLayerVisibility: state.setLayerVisibility,
  }));

  // Fetch layers with React Query
  const { data: availableLayers = [], isLoading } = useQuery<DropdownOption[]>({
    queryKey: ['layers'],
    queryFn: () => fetchLayers(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  // Initialize layer visibility when layers are loaded (only once)
  // useEffect(() => {
  //   if (availableLayers.length > 0 && Object.keys(layerVisibility).length === 0) {
  //     console.log('Initializing layer visibility for:', availableLayers);
  //     const visibility = availableLayers.reduce<Record<string, boolean>>((acc, layer) => {
  //       acc[layer.value] = false;
  //       return acc;
  //     }, {});
  //     setLayerVisibility(visibility);
  //   }
  // }, [availableLayers, layerVisibility, setLayerVisibility]);

  // Use store getter inside handlers to avoid stale closures
  const handleToggleLayer = useCallback(
    (layerId: string) => {
      const current = useMapStore.getState().layerVisibility;
      const newVisibility = !current[layerId];

      // อัพเดท UI state
      setLayerVisibility({ ...current, [layerId]: newVisibility });

      // Get all visible layer IDs after this toggle
      const updatedVisibility = { ...current, [layerId]: newVisibility };
      const visibleLayerIds = Object.keys(updatedVisibility).filter(
        id => updatedVisibility[id]
      );

      // Build spatialType map for all visible layers
      const layerSpatialTypes: Record<string, string> = {};
      visibleLayerIds.forEach(id => {
        const layer = availableLayers.find(l => l.value === id);
        layerSpatialTypes[id] = layer?.spatialType || 'deliveryArea';
      });

      // Send all visible layers with their spatialTypes
      onLayersChange?.(visibleLayerIds, layerSpatialTypes);
    },
    [setLayerVisibility, availableLayers, onLayersChange]
  );

  const handleClearAll = useCallback(() => {
    const current = useMapStore.getState().layerVisibility;
    const updated = { ...current };
    Object.keys(updated).forEach(key => {
      updated[key] = false;
    });
    setLayerVisibility(updated);

    // Notify parent that all layers are cleared
    onLayersChange?.([], {});
  }, [setLayerVisibility, onLayersChange]);

  // Compute layer options for display
  const layers: LayerOption[] = availableLayers.map(layer => ({
    id: layer.value,
    name: layer.text,
    visible: layerVisibility[layer.value] ?? false,
    //spatialType: layer.s, // Optional: determine spatial type based on layer ID
  }));

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors min-w-[160px]"
        type="button"
      >
        <svg
          className="w-5 h-5 text-gray-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
          />
        </svg>
        <span className="text-sm font-medium text-gray-700 flex-1">
          {t('maps:layer')}
        </span>
        <svg
          className={`w-4 h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Dropdown Content */}
          <div className="absolute right-0 mt-2 w-60 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            {/* Header - Fixed at top */}
            <div className="px-3 py-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-semibold text-gray-700 whitespace-nowrap">
                  Layer
                </div>
                <div className="flex items-center gap-1.5">
                  {/*<button
                    onClick={handleSelectAll}
                    disabled={isSelectingAll || isLoading}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      isSelectingAll
                        ? 'bg-blue-300 text-blue-700 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {selectAllProgress.isActive
                      ? `Loading ${selectAllProgress.current}/${selectAllProgress.total}...`
                      : isSelectingAll
                        ? 'Selecting...'
                        : 'Select All'}
                  </button>*/}
                  <button
                    onClick={handleClearAll}
                    className="text-xs text-gray-600 hover:text-gray-700 font-medium whitespace-nowrap"
                    type="button"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
            {/* Scrollable content area */}
            <div className="max-h-72 overflow-y-auto">
              <div className="p-3 space-y-1">
                {isLoading ? (
                  <div className="text-sm text-gray-400 py-2 text-center">
                    Loading layers...
                  </div>
                ) : layers.length === 0 ? (
                  <div className="text-sm text-gray-400 py-2 text-center">
                    No layers available
                  </div>
                ) : (
                  layers.map(layer => (
                    <label
                      key={layer.id}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={layer.visible}
                        onChange={() => handleToggleLayer(layer.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      {layer.color && (
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: layer.color }}
                        />
                      )}
                      <span className="text-sm text-gray-700 flex-1">{layer.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
