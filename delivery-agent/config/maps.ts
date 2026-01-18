import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

export const GOOGLE_MAPS_API_KEY = extra.googleMapsApiKey;
export const MAP_DEFAULT_LATITUDE = extra.mapDefaultLatitude || -1.2921;
export const MAP_DEFAULT_LONGITUDE = extra.mapDefaultLongitude || 32.5781;
export const MAP_DEFAULT_ZOOM = extra.mapDefaultZoom || 15;