import { useCallback, useRef } from 'react';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import { map } from './core/MapView';
import useMapLayer from './core/useMapLayer';
import { useAttributePreference } from '../common/util/preferences';
import { useCatchCallback } from '../reactHelper';
import { findFonts, PIN_HEAD_OFFSET, PIN_HEIGHT, toMapCoordinates } from './core/mapUtil';

const onMouseEnter = () => (map.getCanvas().style.cursor = 'pointer');
const onMouseLeave = () => (map.getCanvas().style.cursor = '');

const MapMarkers = ({ markers, showTitles, cluster, direction, onClick, disabled }) => {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const iconScale = useAttributePreference('iconScale', desktop ? 0.75 : 1);

  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  const onMarkerClick = useCallback(
    (event) => {
      if (disabledRef.current) return;
      event.preventDefault();
      onClick?.(event.features[0].properties);
    },
    [onClick],
  );

  const onClusterClick = useCatchCallback(async (event) => {
    if (disabledRef.current) return;
    event.preventDefault();
    const feature = event.features[0];
    const zoom = await map
      .getSource(feature.source)
      .getClusterExpansionZoom(feature.properties.cluster_id);
    map.easeTo({ center: feature.geometry.coordinates, zoom });
  }, []);

  const markerEvents = onClick
    ? { on: { mouseenter: onMouseEnter, mouseleave: onMouseLeave, click: onMarkerClick } }
    : {};

  const layers = [
    {
      type: 'symbol',
      filter: ['!has', 'point_count'],
      layout: {
        'icon-image': '{image}',
        'icon-size': iconScale,
        'icon-anchor': 'bottom',
        'icon-allow-overlap': true,
        'symbol-sort-key': ['get', 'id'],
      },
      ...markerEvents,
    },
  ];

  if (direction) {
    layers.push({
      key: 'direction',
      type: 'symbol',
      filter: ['all', ['!has', 'point_count'], ['==', 'direction', true]],
      layout: {
        'icon-image': 'direction',
        'icon-size': iconScale,
        'icon-allow-overlap': true,
        'icon-rotate': ['get', 'rotation'],
        'icon-rotation-alignment': 'map',
      },
      // Rotate around the point, then lift onto the pin head (translate is not rotated, unlike icon-offset)
      paint: {
        'icon-translate': [0, -PIN_HEAD_OFFSET * iconScale],
        'icon-translate-anchor': 'viewport',
      },
    });
  }

  // Titles go in their own layer so they draw above every pin and arrow
  if (showTitles) {
    layers.push({
      key: 'title',
      type: 'symbol',
      filter: ['all', ['!has', 'point_count'], ['!=', 'title', '']],
      layout: {
        'text-field': '{title}',
        'text-font': findFonts(map),
        'text-size': 13,
        'text-anchor': 'bottom',
        // Title sits just above the pin head (offset is in ems of the 13px text)
        'text-offset': [0, -(PIN_HEIGHT * iconScale + 5) / 13],
        'text-max-width': 12,
        'text-allow-overlap': true,
        'icon-image': 'label',
        'icon-text-fit': 'both',
        'icon-text-fit-padding': [2, 5, 2, 5],
        'icon-allow-overlap': true,
        'symbol-sort-key': ['get', 'id'],
      },
      paint: {
        'text-color': '#0F172A',
      },
      ...markerEvents,
    });
  }

  if (cluster) {
    layers.push({
      key: 'clusters',
      type: 'symbol',
      filter: ['has', 'point_count'],
      layout: {
        'icon-image': 'background',
        'icon-size': iconScale,
        'icon-allow-overlap': true,
        'text-field': '{point_count_abbreviated}',
        'text-font': findFonts(map),
        'text-size': 14,
        'text-allow-overlap': true,
      },
      on: { mouseenter: onMouseEnter, mouseleave: onMouseLeave, click: onClusterClick },
    });
  }

  useMapLayer({
    source: cluster ? { cluster: true, clusterMaxZoom: 14, clusterRadius: 50 } : undefined,
    layers,
    layersDeps: [showTitles, cluster, direction, iconScale, onMarkerClick, onClusterClick],
    data: {
      type: 'FeatureCollection',
      features: markers.map(
        ({ latitude, longitude, image, title, rotation, direction: showDirection, ...rest }) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: toMapCoordinates(longitude, latitude),
          },
          properties: {
            ...rest,
            image: image || 'default-neutral',
            title: title || '',
            rotation: rotation || 0,
            direction: showDirection || false,
          },
        }),
      ),
    },
    dataDeps: [markers, showTitles],
  });

  return null;
};

export default MapMarkers;
