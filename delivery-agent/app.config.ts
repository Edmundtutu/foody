import 'dotenv/config';

export default {
    expo: {
        name: 'delivery agent',
        slug: 'imenu-agent',
        version: '1.0.0',
        orientation: 'portrait',
        icon: './assets/images/icon.png',
        scheme: 'myapp',
        userInterfaceStyle: 'automatic',
        newArchEnabled: true,
        ios: {
            supportsTablet: true,
            bundleIdentifier: 'com.edmundtutu.imenuagent',
        },
        android: {
            package: 'com.edmundtutu.imenuagent',
            adaptiveIcon: {
                foregroundImage: './assets/images/icon.png',
                backgroundColor: '#ffffff',
            },
        },
        web: {
            bundler: 'metro',
            output: 'single',
            favicon: './assets/images/favicon.png',
        },
        plugins: ['expo-router', 'expo-font', 'expo-web-browser'],
        experiments: {
            typedRoutes: true,
        },
        extra: {
            // Firebase configuration
            firebaseApiKey: process.env.FIREBASE_API_KEY,
            firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
            firebaseDatabaseUrl: process.env.FIREBASE_DATABASE_URL,
            firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
            firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
            firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
            firebaseAppId: process.env.FIREBASE_APP_ID,
            firebaseMeasurementId: process.env.FIREBASE_MEASUREMENT_ID,
            // Google Maps configuration
            googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
            mapDefaultLatitude: process.env.MAP_DEFAULT_LATITUDE,
            mapDefaultLongitude: process.env.MAP_DEFAULT_LONGITUDE,
            mapDefaultZoom: process.env.MAP_DEFAULT_ZOOM,
        },
    },
};
