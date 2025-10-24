import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'RetoFitness',
  webDir: 'www',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2500,
      backgroundColor: '#0a0a0a',
      showSpinner: false,
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true
    },
    Keyboard: {
      "resizeOnFullScreen": false
    },
    EdgeToEdge: {
      "backgroundColor": "#000000ff"
    }
  }
};

export default config;
