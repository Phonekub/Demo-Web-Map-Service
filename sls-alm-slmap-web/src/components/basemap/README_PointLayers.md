# BaseMap Component - Point Layers Only (No Re-initialization)

## Overview

BaseMap component ได้รับการปรับแต่งให้รองรับเฉพาะ **Point Layers** เท่านั้น โดย **Map จะ initialize เพียงครั้งเดียว** และการเพิ่ม/ลบ layers จะทำงานแบบ dynamic โดยไม่ต้อง re-create map instance

## 🚀 Key Performance Features

### ✅ **No Re-initialization**

- Map initialize **เพียงครั้งเดียว** เมื่อ component mount
- การเพิ่ม/ลบ point layers **ไม่ทำให้ map re-create**
- Preserves map state (zoom level, pan position)
- ประสิทธิภาพสูง แม้จะมี layer เปลี่ยนแปลงบ่อย

### ✅ **Optimized useEffect Structure**

```typescript
// Map initializes only once
useEffect(() => {
  // Create map instance
}, []); // Empty dependencies!

// Separate effect for layer management
useEffect(() => {
  // Add/remove/update layers only
}, [pointLayers]); // Only when layers change

// Separate effects for view updates
useEffect(() => {
  // Update center without re-creating map
}, [center]);
```

## 🔄 Before vs After Optimization

### ❌ Before (Re-initialization Problem)

```typescript
useEffect(() => {
  // Create map
  const map = new Map({...});
  // Map re-creates every time dependencies change!
}, [center, zoom, layers, onMapInit, callbacks...]); // Too many dependencies
```

**Problems:**

- Map re-creates when any dependency changes
- Poor performance with frequent updates
- Loses map state (zoom/pan position)
- Unnecessary DOM manipulations

### ✅ After (Optimized)

```typescript
// Initialize once
useEffect(() => {
  const map = new Map({
    center: fromLonLat(initialCenterRef.current),
    zoom: initialZoomRef.current,
  });
}, []); // Empty dependencies = initialize once only!

// Layer management separate
useEffect(() => {
  // Only add/remove layers, don't recreate map
  pointLayers.forEach(layer => addOrUpdatePointLayer(layer));
}, [pointLayers]); // Only when layers change

// View updates separate
useEffect(() => {
  map.getView().setCenter(fromLonLat(center));
}, [center]); // Update view, not map
```

**Benefits:**

- ✅ Map initializes only once
- ✅ High performance layer updates
- ✅ Preserves map state
- ✅ Minimal DOM operations

### ✅ Point Layer Only

- รองรับเฉพาะ point data
- ลบ polygon และ drawing functions ออกทั้งหมด
- Interface ที่เรียบง่ายและเข้าใจง่าย

### ✅ Dynamic Layer Management

- เพิ่ม/ลบ/อัปเดต point layers โดยไม่ต้อง init map ใหม่
- จัดการ visibility ของแต่ละ layer
- Performance optimized สำหรับ layer updates

### ✅ Custom Styling

- กำหนด style แต่ละ layer ได้อิสระ
- รองรับ radius, fill color, stroke
- Default style หากไม่ระบุ

## Interface Definition

```typescript
// Point data structure
interface PointData {
  id: string;
  coordinates: [number, number]; // [longitude, latitude]
  properties?: Record<string, unknown>; // Additional data
}

// Point layer structure
interface PointLayer {
  id: string; // Unique identifier
  name: string; // Display name
  data: PointData[]; // Array of points
  style?: {
    // Optional styling
    radius?: number; // Point radius (default: 6)
    fill?: string; // Fill color (default: 'red')
    stroke?: {
      color: string; // Stroke color (default: 'white')
      width: number; // Stroke width (default: 2)
    };
  };
  visible?: boolean; // Show/hide layer (default: true)
}

// Layer manager interface (exposed through map instance)
interface PointLayerManager {
  addOrUpdatePointLayer: (layer: PointLayer) => void;
  removePointLayer: (layerId: string) => void;
  clearAllPointLayers: () => void;
}
```

## Props

```typescript
interface BaseMapProps {
  className?: string; // Map container CSS class
  center?: [number, number]; // Initial center [lng, lat]
  zoom?: number; // Initial zoom level
  height?: string; // Map height (default: '400px')
  width?: string; // Map width (default: '100%')
  pointLayers?: PointLayer[]; // Point layers to display
  layers?: BaseLayer[]; // Additional OpenLayers base layers
  onMapInit?: (map: Map) => void; // Map initialization callback
  onLayersUpdate?: (count: number) => void; // Layer update callback
}
```

## Basic Usage

### 1. Simple Point Layer

```tsx
import React, { useState } from 'react';
import { BaseMap, PointLayer } from './components';

const MyMapComponent = () => {
  const [pointLayers, setPointLayers] = useState<PointLayer[]>([]);

  const addCities = () => {
    const citiesLayer: PointLayer = {
      id: 'thai-cities',
      name: 'Thai Cities',
      data: [
        {
          id: 'bangkok',
          coordinates: [100.5018, 13.7563],
          properties: { name: 'Bangkok', population: 8000000 },
        },
        {
          id: 'chiang-mai',
          coordinates: [98.9817, 18.7883],
          properties: { name: 'Chiang Mai', population: 200000 },
        },
      ],
      style: {
        radius: 8,
        fill: 'red',
        stroke: { color: 'white', width: 2 },
      },
    };

    setPointLayers([citiesLayer]);
  };

  return (
    <div>
      <button onClick={addCities}>Add Cities</button>
      <BaseMap
        pointLayers={pointLayers}
        center={[100.5018, 13.7563]}
        zoom={10}
        height="500px"
      />
    </div>
  );
};
```

### 2. Multiple Layers with Different Styles

```tsx
const addMultipleLayers = () => {
  const layers: PointLayer[] = [
    {
      id: 'restaurants',
      name: 'Restaurants',
      data: [
        {
          id: 'rest1',
          coordinates: [100.52, 13.75],
          properties: { name: 'Restaurant 1' },
        },
      ],
      style: { radius: 6, fill: 'orange' },
    },
    {
      id: 'hotels',
      name: 'Hotels',
      data: [
        {
          id: 'hotel1',
          coordinates: [100.51, 13.76],
          properties: { name: 'Hotel 1' },
        },
      ],
      style: { radius: 8, fill: 'blue', stroke: { color: 'navy', width: 2 } },
    },
  ];

  setPointLayers(layers);
};
```

### 3. Layer Visibility Toggle

```tsx
const toggleLayerVisibility = (layerId: string) => {
  setPointLayers(prev =>
    prev.map(layer =>
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    )
  );
};
```

### 4. Update Layer Style

```tsx
const updateLayerStyle = (layerId: string, newStyle: PointLayer['style']) => {
  setPointLayers(prev =>
    prev.map(layer => (layer.id === layerId ? { ...layer, style: newStyle } : layer))
  );
};
```

## Programmatic Layer Management

```tsx
const handleMapInit = (map: Map) => {
  // Access point layer manager
  const layerManager = (map as Map & { pointLayerManager: PointLayerManager })
    .pointLayerManager;

  // Add layer programmatically
  layerManager.addOrUpdatePointLayer({
    id: 'programmatic-layer',
    name: 'Programmatic Points',
    data: [{ id: 'p1', coordinates: [100.5, 13.7] }],
  });

  // Remove specific layer
  layerManager.removePointLayer('layer-id');

  // Clear all point layers
  layerManager.clearAllPointLayers();
};

<BaseMap onMapInit={handleMapInit} />;
```

## Performance Tips

1. **Batch Updates**: Group multiple layer changes together
2. **Layer IDs**: Use consistent, meaningful IDs for layers
3. **Data Size**: For large datasets, consider data pagination
4. **Style Reuse**: Use similar styles across layers when possible

## Example Implementation

See `BaseMapPointExample.tsx` for a complete working example with:

- Adding different point layers
- Toggling visibility
- Updating styles dynamically
- Random point generation
- Layer management controls

## Migration Notes

### From Previous BaseMap

- Remove all polygon-related props and callbacks
- Replace `layers` prop with `pointLayers` for point data
- Update interfaces to use `PointLayer` instead of generic layer types
- Remove drawing and editing functionality

### Benefits of Point-Only Version

- ✅ Simplified API surface
- ✅ Better performance for point data
- ✅ Clearer separation of concerns
- ✅ Easier to understand and maintain
- ✅ Type-safe point operations

## Backward Compatibility

- `layers` prop still supported for OpenLayers BaseLayer objects
- All basic map functionality preserved (center, zoom, etc.)
- `onMapInit` and `onLayersUpdate` callbacks remain the same
