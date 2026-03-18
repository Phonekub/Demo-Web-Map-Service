# BaseMap Component – Latest Setup & Usage

OpenLayers

## Props Interface

```typescript
interface BaseMapProps {
  className?: string; // Tailwind/DaisyUI classes
  center?: [number, number]; // [longitude, latitude]
  zoom?: number; // Zoom level (1-20)
  height?: string; // e.g. '400px', '100%'
  width?: string; // e.g. '100%', '600px'
  onMapInit?: (map: Map) => void; // Callback when map loads
  showControls?: boolean; // Show/hide OpenLayers controls
  markers?: Array<{ lat: number; lng: number; popup?: string }>; // Optional marker support
  layers?: any[]; // Custom layers (future)
}
```

## Usage Examples

### Basic Map

```tsx
import { BaseMap } from '@/components';

<BaseMap
  center={[100.5018, 13.7563]} // Bangkok
  zoom={10}
  height="400px"
  className="bg-base-200 rounded-lg"
/>;
```

### Advanced Map with Controls & Markers

```tsx
const [mapInstance, setMapInstance] = useState<Map | null>(null);

<BaseMap
  center={[2.3522, 48.8566]} // Paris
  zoom={12}
  height="500px"
  onMapInit={setMapInstance}
  showControls={true}
  className="shadow-lg rounded-lg border border-base-300"
  markers={[{ lat: 48.8566, lng: 2.3522, popup: 'Paris' }]}
/>;
```

## Styling with DaisyUI & Tailwind

- Use `className` to apply DaisyUI and Tailwind utility classes for beautiful, responsive maps.
- Example: `className="bg-base-100 shadow-xl"`

## Future Enhancements

1. **Marker Support**
   ```tsx
   <BaseMap markers={[{ lat: 13.75, lng: 100.5, popup: 'Bangkok' }]} />
   ```
2. **Custom Layers**
   ```tsx
   <BaseMap layers={[customLayer1, customLayer2]} />
   ```
3. **Geolocation**
   ```tsx
   <BaseMap showUserLocation={true} />
   ```
4. **Drawing Tools**
   ```tsx
   <BaseMap enableDrawing={true} onDraw={handleDraw} />
   ```
5. **Different Tile Sources**
   ```tsx
   <BaseMap tileSource="satellite" />
   ```

## OpenLayers Integration Details

- Tile Layer: Uses OpenStreetMap as default
- Projection: Web Mercator (EPSG:3857)
- Controls: Zoom, attribution, rotate
- View: Configurable center and zoom
- Cleanup: Proper React cleanup to prevent memory leaks
- Markers: (Planned) Add marker and popup support
- Layers: (Planned) Add custom layer support

## Mobile Support

The map is responsive and works on mobile devices with touch controls.
