import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.367c6d40e2e64852a421c1fb20630537',
  appName: 'Opulence Talent Collective',
  webDir: 'dist',
  server: {
    url: 'https://367c6d40-e2e6-4852-a421-c1fb20630537.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  // The custom URL scheme that the app responds to (e.g. otc://talent/123).
  // Universal Links are configured in the native projects (see DEEP_LINKS_SETUP.md):
  //   - iOS: ios/App/App/App.entitlements + apple-app-site-association on the domain
  //   - Android: AndroidManifest.xml intent-filter + assetlinks.json on the domain
  ios: {
    scheme: 'otc',
  },
  android: {
    // Android equivalent — used for `otc://` intent handling.
    // Universal "App Links" (https://) are handled via AndroidManifest intent-filters.
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1800,
      launchAutoHide: true,
      launchFadeOutDuration: 400,
      backgroundColor: '#26221E',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#26221E',
    },
  },
};

export default config;
