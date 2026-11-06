import { loadImage, prepareIcon, prepareLabel, preparePin } from './mapUtil';

import directionSvg from '../../resources/images/direction.svg';
import backgroundSvg from '../../resources/images/background.svg';
import animalSvg from '@material-symbols/svg-600/outlined/pets-fill.svg';
import bicycleSvg from '@material-symbols/svg-600/outlined/directions_bike-fill.svg';
import boatSvg from '@material-symbols/svg-600/outlined/sailing-fill.svg';
import busSvg from '@material-symbols/svg-600/outlined/directions_bus-fill.svg';
import carSvg from '@material-symbols/svg-600/outlined/directions_car-fill.svg';
import camperSvg from '@material-symbols/svg-600/outlined/rv_hookup-fill.svg';
import craneSvg from '@material-symbols/svg-600/outlined/precision_manufacturing-fill.svg';
import defaultSvg from '@material-symbols/svg-600/outlined/location_on.svg';
import startSvg from '@material-symbols/svg-600/outlined/play_circle-fill.svg';
import finishSvg from '@material-symbols/svg-600/outlined/stop_circle-fill.svg';
import helicopterSvg from '@material-symbols/svg-600/outlined/helicopter-fill.svg';
import motorcycleSvg from '@material-symbols/svg-600/outlined/motorcycle-fill.svg';
import personSvg from '@material-symbols/svg-600/outlined/person-fill.svg';
import planeSvg from '@material-symbols/svg-600/outlined/flight-fill.svg';
import scooterSvg from '@material-symbols/svg-600/outlined/moped-fill.svg';
import shipSvg from '@material-symbols/svg-600/outlined/directions_boat-fill.svg';
import tractorSvg from '@material-symbols/svg-600/outlined/agriculture-fill.svg';
import trailerSvg from '@material-symbols/svg-600/outlined/auto_towing-fill.svg';
import trainSvg from '@material-symbols/svg-600/outlined/train-fill.svg';
import tramSvg from '@material-symbols/svg-600/outlined/tram-fill.svg';
import truckSvg from '@material-symbols/svg-600/outlined/local_shipping-fill.svg';
import vanSvg from '@material-symbols/svg-600/outlined/airport_shuttle-fill.svg';

import warningSvg from '@material-symbols/svg-600/outlined/warning-fill.svg';
import taskAltSvg from '@material-symbols/svg-600/outlined/task_alt-fill.svg';
import arrowCircleDownSvg from '@material-symbols/svg-600/outlined/arrow_circle_down-fill.svg';
import arrowCircleUpSvg from '@material-symbols/svg-600/outlined/arrow_circle_up-fill.svg';
import bedtimeSvg from '@material-symbols/svg-600/outlined/bedtime-fill.svg';
import cloudOffSvg from '@material-symbols/svg-600/outlined/cloud_off-fill.svg';
import cloudDoneSvg from '@material-symbols/svg-600/outlined/cloud_done-fill.svg';
import speedSvg from '@material-symbols/svg-600/outlined/speed-fill.svg';
import cloudAlertSvg from '@material-symbols/svg-600/outlined/cloud_alert-fill.svg';
import distanceSvg from '@material-symbols/svg-600/outlined/distance-fill.svg';
import powerOffSvg from '@material-symbols/svg-600/outlined/power_off-fill.svg';
import powerSvg from '@material-symbols/svg-600/outlined/power-fill.svg';
import buildSvg from '@material-symbols/svg-600/outlined/build-fill.svg';
import imageSvg from '@material-symbols/svg-600/outlined/image-fill.svg';
import connectWithoutContactSvg from '@material-symbols/svg-600/outlined/connect_without_contact-fill.svg';
import smsSvg from '@material-symbols/svg-600/outlined/sms-fill.svg';

export const mapIcons = {
  animal: animalSvg,
  bicycle: bicycleSvg,
  boat: boatSvg,
  bus: busSvg,
  car: carSvg,
  camper: camperSvg,
  crane: craneSvg,
  default: defaultSvg,
  finish: finishSvg,
  helicopter: helicopterSvg,
  motorcycle: motorcycleSvg,
  person: personSvg,
  plane: planeSvg,
  scooter: scooterSvg,
  ship: shipSvg,
  start: startSvg,
  tractor: tractorSvg,
  trailer: trailerSvg,
  train: trainSvg,
  tram: tramSvg,
  truck: truckSvg,
  van: vanSvg,
};

export const mapIconKey = (category) => {
  switch (category) {
    case 'offroad':
    case 'pickup':
      return 'car';
    case 'trolleybus':
      return 'bus';
    default:
      return mapIcons.hasOwnProperty(category) ? category : 'default';
  }
};

export const eventIcons = {
  alarm: warningSvg,
  commandResult: taskAltSvg,
  deviceFuelDrop: arrowCircleDownSvg,
  deviceFuelIncrease: arrowCircleUpSvg,
  deviceInactive: bedtimeSvg,
  deviceMoving: startSvg,
  deviceOffline: cloudOffSvg,
  deviceOnline: cloudDoneSvg,
  deviceOverspeed: speedSvg,
  deviceStopped: finishSvg,
  deviceUnknown: cloudAlertSvg,
  driverChanged: personSvg,
  geofenceCrossed: distanceSvg,
  geofenceEnter: distanceSvg,
  geofenceExit: distanceSvg,
  ignitionOff: powerOffSvg,
  ignitionOn: powerSvg,
  maintenance: buildSvg,
  media: imageSvg,
  proximityEnter: connectWithoutContactSvg,
  proximityExit: connectWithoutContactSvg,
  queuedCommandSent: taskAltSvg,
  textMessage: smsSvg,
  unaccompaniedMotion: connectWithoutContactSvg,
};

export const eventIconKey = (type) => (eventIcons.hasOwnProperty(type) ? type : 'alarm');

export const mapImages = {};

// Extra addImage options (stretch areas) for images that need them
export const mapImageOptions = {};

// Pin fill per status (online = success, offline = error, unknown = neutral)
const pinColors = {
  info: '#2563EB',
  success: '#16A34A',
  error: '#DC2626',
  neutral: '#64748B',
};

export default async () => {
  const background = await loadImage(backgroundSvg);
  mapImages.background = await prepareIcon(background);
  mapImages.direction = await prepareIcon(await loadImage(directionSvg));
  const label = prepareLabel();
  mapImages.label = label.image;
  mapImageOptions.label = label.options;
  await Promise.all(
    Object.keys(mapIcons).map(async (key) => {
      // The generic pin gets a plain white dot rather than a pin inside a pin
      const icon = key === 'default' ? null : await loadImage(mapIcons[key]);
      Object.entries(pinColors).forEach(([color, fill]) => {
        mapImages[`${key}-${color}`] = preparePin(icon, fill);
      });
    }),
  );
  await Promise.all(
    Object.keys(eventIcons).map((key) =>
      loadImage(eventIcons[key]).then((icon) => {
        mapImages[key] = preparePin(icon, pinColors.neutral);
      }),
    ),
  );
};
