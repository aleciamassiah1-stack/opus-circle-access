import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.opulencetalentcollective.app',
  appName: 'Opulence Talent Collective',
  webDir: 'dist',
  // App Store builds must always load the bundled files from `dist/`.
  // Do not add a `server.url` here; a stale live-reload URL causes a blank
  // WebView on Apple review devices when that remote preview is unavailable.
  ...(process.env.CAP_SIMULATOR_LIVE === '1'
    ? {
        server: {
          url: 'http://localhost:8080',
          cleartext: true,
        },
      }
    : {}),
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
