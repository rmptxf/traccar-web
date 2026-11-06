import { grey } from '@mui/material/colors';

// GPSFlot brand: one navy brand colour; green, amber and red stay reserved for vehicle status
const brand = {
  primary: { light: '#1E3A8A', dark: '#60A5FA' },
  secondary: { light: '#0369A1', dark: '#7DD3FC' },
};

const validatedColor = (color) => (/^#([0-9A-Fa-f]{3}){1,2}$/.test(color) ? color : null);

export default (server, darkMode) => ({
  mode: darkMode ? 'dark' : 'light',
  background: {
    default: darkMode ? grey[900] : grey[50],
  },
  primary: {
    main:
      validatedColor(server?.attributes?.colorPrimary) ||
      (darkMode ? brand.primary.dark : brand.primary.light),
  },
  secondary: {
    main:
      validatedColor(server?.attributes?.colorSecondary) ||
      (darkMode ? brand.secondary.dark : brand.secondary.light),
  },
  neutral: {
    main: grey[500],
  },
  geometry: {
    main: '#3bb2d0',
  },
  alwaysDark: {
    main: grey[900],
  },
});
