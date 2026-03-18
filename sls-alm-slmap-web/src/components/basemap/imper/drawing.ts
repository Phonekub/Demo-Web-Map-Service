// import VectorLayer from 'ol/layer/Vector';
// import VectorSource from 'ol/source/Vector';
// import { useImperativeHandle, useRef } from 'react';

// export const Drawing = ({ ref }) => {
//   const mapRef = useRef(null);
//   const map = mapRef.current;

//   useImperativeHandle(ref, () => {
//     const circleSource = new VectorSource();
//     const circleLayer = new VectorLayer({
//       source: circleSource,
//       zIndex: 5, // Below polygon edit layer but above base layers
//     });

//     circleLayer.set('layerId', 'edit-radius-circles');
//     circleLayerRef.current = circleLayer;
//     map.addLayer(circleLayer);
//   });
// };
