import React, { useState } from 'react';
import BaseMap from './BaseMap';
import type { PointLayer } from './BaseMap';

const MultiplePointsExample: React.FC = () => {
  const [pointLayers, setPointLayers] = useState<PointLayer[]>([]);

  // ตัวอย่าง: หลายๆ จุดใน layer เดียว
  const addManyPointsInOneLayer = () => {
    const thailandCities: PointLayer = {
      id: 'thailand-cities',
      name: 'Thailand Cities',
      data: [
        {
          id: 'bangkok',
          coordinates: [100.5018, 13.7563],
          properties: {
            name: 'Bangkok',
            population: 8000000,
            region: 'Central',
          },
        },
        {
          id: 'chiang-mai',
          coordinates: [98.9817, 18.7883],
          properties: {
            name: 'Chiang Mai',
            population: 200000,
            region: 'North',
          },
        },
        {
          id: 'pattaya',
          coordinates: [100.9925, 12.9236],
          properties: { name: 'Pattaya', population: 120000, region: 'East' },
        },
        {
          id: 'phuket',
          coordinates: [98.3923, 7.8804],
          properties: { name: 'Phuket', population: 80000, region: 'South' },
        },
        {
          id: 'khon-kaen',
          coordinates: [102.8236, 16.4419],
          properties: {
            name: 'Khon Kaen',
            population: 150000,
            region: 'Northeast',
          },
        },
        {
          id: 'hat-yai',
          coordinates: [100.4686, 7.0061],
          properties: { name: 'Hat Yai', population: 160000, region: 'South' },
        },
      ],
      style: {
        radius: 10,
        fill: 'red',
        stroke: { color: 'white', width: 2 },
      },
    };

    setPointLayers([thailandCities]);
  };

  // ตัวอย่าง: หลาย layers แต่ละ layer มีหลาย points
  const addMultipleLayersWithMultiplePoints = () => {
    const majorCities: PointLayer = {
      id: 'major-cities',
      name: 'Major Cities',
      data: [
        {
          id: 'bangkok',
          coordinates: [100.5018, 13.7563],
          properties: { name: 'Bangkok', type: 'capital' },
        },
        {
          id: 'chiang-mai',
          coordinates: [98.9817, 18.7883],
          properties: { name: 'Chiang Mai', type: 'major' },
        },
        {
          id: 'phuket',
          coordinates: [98.3923, 7.8804],
          properties: { name: 'Phuket', type: 'major' },
        },
      ],
      style: {
        radius: 12,
        fill: 'red',
        stroke: { color: 'darkred', width: 2 },
      },
    };

    const touristSpots: PointLayer = {
      id: 'tourist-spots',
      name: 'Tourist Destinations',
      data: [
        {
          id: 'pattaya',
          coordinates: [100.9925, 12.9236],
          properties: { name: 'Pattaya', type: 'beach' },
        },
        {
          id: 'koh-samui',
          coordinates: [100.049, 9.5018],
          properties: { name: 'Koh Samui', type: 'island' },
        },
        {
          id: 'krabi',
          coordinates: [98.9063, 8.0863],
          properties: { name: 'Krabi', type: 'beach' },
        },
      ],
      style: { radius: 8, fill: 'blue', stroke: { color: 'navy', width: 1 } },
    };

    const businessCenters: PointLayer = {
      id: 'business-centers',
      name: 'Business Centers',
      data: [
        {
          id: 'silom',
          coordinates: [100.5347, 13.7248],
          properties: { name: 'Silom', type: 'financial' },
        },
        {
          id: 'sathorn',
          coordinates: [100.5226, 13.7199],
          properties: { name: 'Sathorn', type: 'business' },
        },
        {
          id: 'sukhumvit',
          coordinates: [100.5692, 13.7308],
          properties: { name: 'Sukhumvit', type: 'commercial' },
        },
      ],
      style: {
        radius: 6,
        fill: 'green',
        stroke: { color: 'darkgreen', width: 1 },
      },
    };

    setPointLayers([majorCities, touristSpots, businessCenters]);
  };

  // เพิ่ม random points หลายจุด
  const addRandomPoints = () => {
    const randomPoints: PointLayer = {
      id: 'random-points',
      name: 'Random Points',
      data: Array.from({ length: 20 }, (_, i) => ({
        id: `random-${i}`,
        coordinates: [
          100.3 + Math.random() * 0.8, // Random longitude around Bangkok
          13.5 + Math.random() * 0.6, // Random latitude around Bangkok
        ] as [number, number],
        properties: { name: `Random Point ${i + 1}`, index: i },
      })),
      style: {
        radius: 5,
        fill: 'orange',
        stroke: { color: 'darkorange', width: 1 },
      },
    };

    setPointLayers(prev => [...prev, randomPoints]);
  };

  const clearAllPoints = () => {
    setPointLayers([]);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Multiple Points Example</h2>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={addManyPointsInOneLayer}
          style={{ marginRight: '10px', padding: '8px 16px' }}
        >
          📍 6 Cities in One Layer
        </button>
        <button
          onClick={addMultipleLayersWithMultiplePoints}
          style={{ marginRight: '10px', padding: '8px 16px' }}
        >
          🏢 Multiple Layers (9 total points)
        </button>
        <button
          onClick={addRandomPoints}
          style={{ marginRight: '10px', padding: '8px 16px' }}
        >
          🎲 Add 20 Random Points
        </button>
        <button onClick={clearAllPoints} style={{ padding: '8px 16px' }}>
          🗑️ Clear All
        </button>
      </div>

      <div
        style={{
          marginBottom: '15px',
          padding: '10px',
          backgroundColor: '#f0f8ff',
          borderRadius: '4px',
        }}
      >
        <strong>Current Status:</strong>
        <br />
        📊 Total Layers: {pointLayers.length}
        <br />
        📍 Total Points:{' '}
        {pointLayers.reduce((sum, layer) => sum + layer.data.length, 0)}
        {pointLayers.length > 0 && (
          <div style={{ marginTop: '10px' }}>
            <strong>Layer Details:</strong>
            <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
              {pointLayers.map(layer => (
                <li key={layer.id}>
                  <strong>{layer.name}</strong>: {layer.data.length} points
                  <span
                    style={{
                      display: 'inline-block',
                      width: '12px',
                      height: '12px',
                      backgroundColor: layer.style?.fill || 'red',
                      borderRadius: '50%',
                      marginLeft: '8px',
                      border: '1px solid #ccc',
                    }}
                  ></span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <BaseMap
        height="600px"
        width="100%"
        center={[100.5018, 13.7563]} // Bangkok center
        zoom={6} // เซ็ต zoom ให้เห็นประเทศไทยทั้งหมด
        pointLayers={pointLayers}
        radiusArea={null} // เพิ่ม prop radiusArea ให้ BaseMap
        onMapInit={_map =>
          console.log('🗺️ Map initialized for multiple points')
        }
        onLayersUpdate={count =>
          console.log(`📈 Total layers on map: ${count}`)
        }
      />

      <div style={{ marginTop: '20px', fontSize: '14px' }}>
        <h3>✨ Features Demonstrated:</h3>
        <ul>
          <li>
            ✅ <strong>Multiple points in single layer</strong> (up to 6 cities)
          </li>
          <li>
            ✅ <strong>Multiple layers with multiple points each</strong> (3
            layers, 9 total points)
          </li>
          <li>
            ✅ <strong>Different styles per layer</strong> (colors, sizes)
          </li>
          <li>
            ✅ <strong>Dynamic point generation</strong> (20 random points)
          </li>
          <li>
            ✅ <strong>Layer management</strong> (add/remove without map
            re-init)
          </li>
          <li>
            ✅ <strong>Point properties</strong> (name, type, region, etc.)
          </li>
        </ul>

        <div
          style={{
            marginTop: '15px',
            padding: '10px',
            backgroundColor: '#e8f5e8',
            borderRadius: '4px',
            border: '1px solid #4caf50',
          }}
        >
          <strong>🚀 Performance Note:</strong> All points are added without
          re-initializing the map. Watch the console - you'll see the map
          initializes only once, even with dozens of points!
        </div>
      </div>
    </div>
  );
};

export default MultiplePointsExample;
