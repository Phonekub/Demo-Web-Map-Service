/**
 * Icon Mapper Utility
 * Maps symbol names from API to icon file paths in public/icons/
 */

// Cache for tracking which icons have been loaded successfully
const iconLoadCache = new Map<string, boolean>();
const DEFAULT_ICON = '/icons/potential-01.png';

/**
 * Check if icon can be loaded (with caching)
 * @param iconPath - Path to icon file
 * @returns Promise that resolves to true if icon loads successfully
 */
export const canLoadIcon = async (iconPath: string): Promise<boolean> => {
  // Check cache first
  if (iconLoadCache.has(iconPath)) {
    return iconLoadCache.get(iconPath)!;
  }

  return new Promise<boolean>(resolve => {
    const img = new Image();

    img.onload = () => {
      iconLoadCache.set(iconPath, true);
      resolve(true);
    };

    img.onerror = () => {
      iconLoadCache.set(iconPath, false);
      console.warn(`⚠️ Icon not found: ${iconPath}, will use fallback`);
      resolve(false);
    };

    // Set timeout to prevent hanging
    setTimeout(() => {
      if (!iconLoadCache.has(iconPath)) {
        iconLoadCache.set(iconPath, false);
        resolve(false);
      }
    }, 2000);

    img.src = iconPath;
  });
};

/**
 * Get marker icon path from symbol name
 * @param symbol - Symbol name from API (e.g., 'potential-01', 'seven-eleven')
 * @returns Icon file path (e.g., '/icons/potential-01.png')
 */
export const getMarkerIconPath = (symbol?: string): string => {
  // Handle undefined, null, empty string, or whitespace
  if (!symbol || symbol.trim() === '') {
    return DEFAULT_ICON;
  }

  const cleanSymbol = symbol.trim();

  // SVG icons
  const svgIcons = ['competitor', 'seven'];
  if (svgIcons.includes(cleanSymbol)) {
    return `/icons/${cleanSymbol}.svg`;
  }

  // Check if symbol already has .png extension
  const iconPath = cleanSymbol.endsWith('.png')
    ? `/icons/${cleanSymbol}`
    : `/icons/${cleanSymbol}.png`;

  return iconPath;
};

/**
 * Get marker icon path with fallback support
 * Returns the icon path if it exists, otherwise returns default
 * @param symbol - Symbol name from API
 * @returns Icon file path or default fallback
 */
export const getMarkerIconPathSafe = (symbol?: string): string => {
  const iconPath = getMarkerIconPath(symbol);

  // If we already know this icon failed to load, return default immediately
  if (iconLoadCache.has(iconPath) && !iconLoadCache.get(iconPath)) {
    return DEFAULT_ICON;
  }

  return iconPath;
};

/**
 * Get marker icon scale based on symbol type
 * @param symbol - Symbol name from API
 * @returns Scale factor for icon size (default: 0.5)
 */
export const getMarkerIconScale = (symbol?: string): number => {
  // Custom scales for different icon types if needed
  const scaleMap: Record<string, number> = {
    'seven-eleven': 0.6,
    competitor: 0.5,
    potential: 0.5,
    station: 0.5,
    vending: 0.5,
    'train-route': 0.5,
  };

  return scaleMap[symbol || ''] || 0.8;
};

/**
 * Get marker icon anchor point
 * Icon anchor determines which point of the icon is positioned at the coordinate
 * @param symbol - Symbol name from API
 * @returns Anchor point [x, y] where 0.5 is center, 1 is bottom/right
 */
export const getMarkerIconAnchor = (): [number, number] => {
  // Most marker icons should anchor at bottom-center
  // x: 0.5 = horizontal center
  // y: 1.0 = bottom (pin point)
  return [0.5, 1.0];
};

/**
 * Check if icon file exists (client-side check)
 * This is a helper for debugging - actual file checking happens at runtime
 * @param symbol - Symbol name from API
 * @returns Whether the icon path is valid
 */
export const isValidSymbol = (symbol: string): boolean => {
  // Allow any symbol that doesn't start with dash
  // Or if it starts with dash, check if potential-{suffix} exists
  if (symbol.startsWith('-')) {
    return true; // Will be handled by fallback logic
  }

  const validSymbols = [
    'default',
    'potential',
    'potential-01',
    'seven-eleven',
    'competitor',
    'station',
    'vending',
    'train-route',
    'permanent-closed',
    'competitor-analysis',
  ];

  return validSymbols.includes(symbol);
};

/**
 * Get fallback symbol if the provided symbol is invalid
 * @param symbol - Symbol name from API
 * @returns Valid symbol or 'default'
 */
export const getFallbackSymbol = (symbol?: string): string => {
  if (!symbol || !isValidSymbol(symbol)) {
    return 'potential-01'; // Use existing icon as default
  }
  return symbol;
};
