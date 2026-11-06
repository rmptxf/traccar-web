import { parse, stringify } from 'wellknown';
import turfCircle from '@turf/circle';
import gcoord from 'gcoord';
import { map } from './MapView';

const coordinateSystem = (id) => {
  switch (id) {
    case 'gcj02':
      return gcoord.GCJ02;
    default:
      return gcoord.WGS84;
  }
};

export const toMapCoordinates = (longitude, latitude) =>
  map.coordinateSystem
    ? gcoord.transform([longitude, latitude], gcoord.WGS84, coordinateSystem(map.coordinateSystem))
    : [longitude, latitude];

export const fromMapCoordinates = (longitude, latitude) =>
  map.coordinateSystem
    ? gcoord.transform([longitude, latitude], coordinateSystem(map.coordinateSystem), gcoord.WGS84)
    : [longitude, latitude];

const transformGeometry = (geometry, from, to) =>
  gcoord.transform(structuredClone(geometry), from, to);

export const loadImage = (url) =>
  new Promise((imageLoaded) => {
    const image = new Image();
    image.onload = () => imageLoaded(image);
    image.src = url;
  });

const canvasTintImage = (image, color) => {
  const canvas = document.createElement('canvas');
  canvas.width = image.width * devicePixelRatio;
  canvas.height = image.height * devicePixelRatio;
  canvas.style.width = `${image.width}px`;
  canvas.style.height = `${image.height}px`;

  const context = canvas.getContext('2d');

  context.save();
  context.fillStyle = color;
  context.globalAlpha = 1;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.globalCompositeOperation = 'destination-atop';
  context.globalAlpha = 1;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  context.restore();

  return canvas;
};

export const prepareIcon = (background, icon, color) => {
  const canvas = document.createElement('canvas');
  canvas.width = background.width * devicePixelRatio;
  canvas.height = background.height * devicePixelRatio;
  canvas.style.width = `${background.width}px`;
  canvas.style.height = `${background.height}px`;

  const context = canvas.getContext('2d');
  context.drawImage(background, 0, 0, canvas.width, canvas.height);

  if (icon) {
    const iconRatio = 0.5;
    const imageWidth = canvas.width * iconRatio;
    const imageHeight = canvas.height * iconRatio;
    context.drawImage(
      canvasTintImage(icon, color),
      (canvas.width - imageWidth) / 2,
      (canvas.height - imageHeight) / 2,
      imageWidth,
      imageHeight,
    );
  }

  return context.getImageData(0, 0, canvas.width, canvas.height);
};

// Teardrop pin geometry (logical px). The tip touches the bottom edge, so markers use icon-anchor: bottom.
export const PIN_WIDTH = 44;
export const PIN_HEIGHT = 56;
const PIN_HEAD_Y = 20;
const PIN_HEAD_RADIUS = 16;
const PIN_TIP_Y = 51;
// Distance from the pin tip (anchor point) up to the head center, used to place the direction arrow
export const PIN_HEAD_OFFSET = PIN_HEIGHT - PIN_HEAD_Y;

const pinPath = (scale) => {
  const cx = PIN_WIDTH / 2;
  const angle = Math.acos(PIN_HEAD_RADIUS / (PIN_TIP_Y - PIN_HEAD_Y));
  const path = new Path2D();
  path.arc(
    cx * scale,
    PIN_HEAD_Y * scale,
    PIN_HEAD_RADIUS * scale,
    Math.PI / 2 + angle,
    Math.PI / 2 - angle,
  );
  path.lineTo(cx * scale, PIN_TIP_Y * scale);
  path.closePath();
  return path;
};

export const preparePin = (icon, color) => {
  const scale = devicePixelRatio;
  const canvas = document.createElement('canvas');
  canvas.width = PIN_WIDTH * scale;
  canvas.height = PIN_HEIGHT * scale;

  const context = canvas.getContext('2d');
  const path = pinPath(scale);

  context.save();
  context.shadowColor = 'rgba(0, 0, 0, 0.35)';
  context.shadowBlur = 3 * scale;
  context.shadowOffsetY = 1.5 * scale;
  context.fillStyle = color;
  context.fill(path);
  context.restore();

  context.lineWidth = 2 * scale;
  context.lineJoin = 'round';
  context.strokeStyle = 'white';
  context.stroke(path);

  const cx = (PIN_WIDTH / 2) * scale;
  const cy = PIN_HEAD_Y * scale;
  if (icon) {
    const size = 20 * scale;
    context.drawImage(canvasTintImage(icon, 'white'), cx - size / 2, cy - size / 2, size, size);
  } else {
    context.beginPath();
    context.arc(cx, cy, 6 * scale, 0, 2 * Math.PI);
    context.fillStyle = 'white';
    context.fill();
  }

  return context.getImageData(0, 0, canvas.width, canvas.height);
};

// Rounded "pill" behind marker titles, stretched around the text with icon-text-fit
export const prepareLabel = () => {
  const scale = devicePixelRatio;
  const width = 26;
  const height = 24;
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;

  const context = canvas.getContext('2d');
  const path = new Path2D();
  path.roundRect(3 * scale, 2 * scale, 20 * scale, 18 * scale, 6 * scale);

  context.save();
  context.shadowColor = 'rgba(0, 0, 0, 0.3)';
  context.shadowBlur = 2.5 * scale;
  context.shadowOffsetY = 1 * scale;
  context.fillStyle = 'white';
  context.fill(path);
  context.restore();

  context.lineWidth = 1 * scale;
  context.strokeStyle = 'rgba(15, 23, 42, 0.15)';
  context.stroke(path);

  const px = (value) => Math.round(value * scale);
  return {
    image: context.getImageData(0, 0, canvas.width, canvas.height),
    // Only the straight middle stretches, so the rounded ends keep their shape
    options: {
      stretchX: [[px(9), px(17)]],
      stretchY: [[px(8), px(14)]],
      content: [px(5), px(4), px(21), px(18)],
    },
  };
};

export const reverseCoordinates = (it) => {
  if (!it) {
    return it;
  }
  if (Array.isArray(it)) {
    if (it.length === 2 && typeof it[0] === 'number' && typeof it[1] === 'number') {
      return [it[1], it[0]];
    }
    return it.map((it) => reverseCoordinates(it));
  }
  return {
    ...it,
    coordinates: reverseCoordinates(it.coordinates),
  };
};

export const geofenceToFeature = (theme, item) => {
  let geometry;
  if (item.area.indexOf('CIRCLE') > -1) {
    const coordinates = item.area
      .replace(/CIRCLE|\(|\)|,/g, ' ')
      .trim()
      .split(/ +/);
    const options = { steps: 32, units: 'meters' };
    const polygon = turfCircle(
      toMapCoordinates(Number(coordinates[1]), Number(coordinates[0])),
      Number(coordinates[2]),
      options,
    );
    geometry = polygon.geometry;
  } else {
    geometry = reverseCoordinates(parse(item.area));
    if (map.coordinateSystem) {
      geometry = transformGeometry(geometry, gcoord.WGS84, coordinateSystem(map.coordinateSystem));
    }
  }
  return {
    id: item.id,
    type: 'Feature',
    geometry,
    properties: {
      name: item.name,
      color: item.attributes.color || theme.palette.geometry.main,
      width: item.attributes.mapLineWidth || 2,
      opacity: item.attributes.mapLineOpacity || 1,
    },
  };
};

export const geometryToArea = (geometry) => {
  const normalized = map.coordinateSystem
    ? transformGeometry(geometry, coordinateSystem(map.coordinateSystem), gcoord.WGS84)
    : geometry;
  return stringify(reverseCoordinates(normalized));
};

export const findFonts = (map) => {
  const { glyphs } = map.getStyle();
  if (glyphs.startsWith('https://tiles.openfreemap.org')) {
    return ['Noto Sans Regular'];
  }
  if (glyphs.startsWith('https://api.os.uk')) {
    return ['Source Sans Pro Regular'];
  }
  return ['Open Sans Regular', 'Arial Unicode MS Regular'];
};
