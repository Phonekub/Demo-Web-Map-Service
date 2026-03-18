import React, { useState } from 'react';
import BaseMap from './BaseMap';
import type { PointLayer, PointLayerManager } from './BaseMap';
import Map from 'ol/Map';

const BaseMapPointExample: React.FC = () => {
  const [pointLayers, setPointLayers] = useState<PointLayer[]>([]);

  // Example point data
  const samplePointData: PointLayer = {
    id: 'sample-points',
    name: 'Sample Cities',
    data: [
      {
        id: 'bangkok',
        coordinates: [100.5018, 13.7563], // Bangkok
        properties: { name: 'Bangkok', population: 8000000, type: 'capital' },
      },
      {
        id: 'chiang-mai',
        coordinates: [98.9817, 18.7883], // Chiang Mai
        properties: { name: 'Chiang Mai', population: 200000, type: 'city' },
      },
      {
        id: 'pattaya',
        coordinates: [100.9925, 12.9236], // Pattaya
        properties: { name: 'Pattaya', population: 120000, type: 'city' },
      },
    ],
    style: {
      radius: 8,
      fill: 'red',
      stroke: {
        color: 'white',
        width: 2,
      },
    },
  };

  const bluePointData: PointLayer = {
    id: 'blue-points',
    name: 'Blue Points',
    data: [
      {
        id: 'point-1',
        coordinates: [100.45, 13.65],
        properties: { name: 'Point 1', category: 'A' },
      },
      {
        id: 'point-2',
        coordinates: [100.55, 13.75],
        properties: { name: 'Point 2', category: 'B' },
      },
    ],
    style: {
      radius: 6,
      fill: 'blue',
      stroke: {
        color: 'navy',
        width: 1,
      },
    },
  };

  const handleMapInit = (map: Map) => {
    // Access point layer manager if needed
    const pointLayerManager = (map as Map & { pointLayerManager: PointLayerManager })
      .pointLayerManager;
    if (pointLayerManager) {
      console.log('🔧 Point Layer Manager available:', pointLayerManager);
    }
  };

  const addSamplePoints = () => {
    setPointLayers(prev => [...prev, samplePointData]);
  };

  const addBluePoints = () => {
    setPointLayers(prev => [...prev, bluePointData]);
  };

  const clearAllLayers = () => {
    setPointLayers([]);
  };

  const toggleSamplePointsVisibility = () => {
    setPointLayers(prev =>
      prev.map(layer =>
        layer.id === 'sample-points' ? { ...layer, visible: !layer.visible } : layer
      )
    );
  };

  const addRandomPoint = () => {
    const randomPoint: PointLayer = {
      id: `random-point-${Date.now()}`,
      name: 'Random Point',
      data: [
        {
          id: `point-${Date.now()}`,
          coordinates: [
            100.3 + Math.random() * 0.5, // Random longitude around Bangkok
            13.6 + Math.random() * 0.3, // Random latitude around Bangkok
          ],
          properties: { name: 'Random Point', timestamp: Date.now() },
        },
      ],
      style: {
        radius: 5,
        fill: 'green',
        stroke: {
          color: 'darkgreen',
          width: 1,
        },
      },
    };

    setPointLayers(prev => [...prev, randomPoint]);
  };

  const updateSamplePointStyle = () => {
    setPointLayers(prev =>
      prev.map(layer =>
        layer.id === 'sample-points'
          ? {
              ...layer,
              style: {
                radius: 12,
                fill: 'orange',
                stroke: {
                  color: 'darkorange',
                  width: 3,
                },
              },
            }
          : layer
      )
    );
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>BaseMap Point Layers Example</h2>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={addSamplePoints} style={{ marginRight: '10px' }}>
          Add Sample Cities
        </button>
        <button onClick={addBluePoints} style={{ marginRight: '10px' }}>
          Add Blue Points
        </button>
        <button onClick={addRandomPoint} style={{ marginRight: '10px' }}>
          Add Random Point
        </button>
        <button onClick={toggleSamplePointsVisibility} style={{ marginRight: '10px' }}>
          Toggle Cities Visibility
        </button>
        <button onClick={updateSamplePointStyle} style={{ marginRight: '10px' }}>
          Change Cities Style
        </button>
        <button onClick={clearAllLayers}>Clear All Layers</button>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <strong>Current Point Layers:</strong> {pointLayers.length}
        {pointLayers.length > 0 && (
          <ul>
            {pointLayers.map(layer => (
              <li key={layer.id}>
                {layer.name} ({layer.data.length} points) -{' '}
                {layer.visible !== false ? 'Visible' : 'Hidden'}
              </li>
            ))}
          </ul>
        )}
      </div>

      <BaseMap
        height="500px"
        width="100%"
        center={[100.5018, 13.7563]} // Bangkok center
        zoom={11}
        pointLayers={pointLayers}
        onMapInit={handleMapInit}
        onLayersUpdate={count => console.log('Layer count updated:', count)}
        radiusArea={null} // เพิ่ม prop radiusArea ให้ BaseMap
      />

      <div style={{ marginTop: '20px' }}>
        <h3>Key Benefits:</h3>
        <ul>
          <li>
            ✅ <strong>No Re-initialization</strong>: Map initializes only ONCE, even when
            adding layers
          </li>
          <li>
            ✅ <strong>Dynamic Layers</strong>: Add point layers without map refresh
          </li>
          <li>
            ✅ <strong>Performance</strong>: Fast layer updates, no DOM recreation
          </li>
          <li>
            ✅ <strong>State Preservation</strong>: Map view state (zoom/pan) is preserved
          </li>
          <li>✅ Custom styling for each point layer</li>
          <li>✅ Toggle layer visibility</li>
          <li>✅ Update layer styles dynamically</li>
          <li>✅ Remove individual layers or clear all</li>
          <li>✅ Point properties for additional data</li>
        </ul>

        <div
          style={{
            backgroundColor: '#e8f5e8',
            border: '1px solid #4caf50',
            borderRadius: '4px',
            padding: '10px',
            margin: '10px 0',
          }}
        >
          <strong>🚀 Performance Note:</strong> Watch the console - you'll see "Map
          initialized ONCE" message only appears once, even when you add multiple layers.
          This proves the map is not re-creating itself!
        </div>

        <h3>Point Layer Structure:</h3>
        <pre
          style={{
            backgroundColor: '#f5f5f5',
            padding: '10px',
            fontSize: '12px',
          }}
        >
          {`interface PointLayer {
  id: string;                    // Unique identifier
  name: string;                  // Display name
  data: PointData[];            // Array of points
  style?: {                     // Optional styling
    radius?: number;
    fill?: string;
    stroke?: {
      color: string;
      width: number;
    };
  };
  visible?: boolean;            // Show/hide layer
}`}
        </pre>
      </div>
    </div>
  );
};

export default BaseMapPointExample;
