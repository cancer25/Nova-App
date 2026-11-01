import React from 'react';

/**
 * AdBanner component:
 * - On Native Android/iOS: Displays Google AdMob Banner via `react-native-google-mobile-ads`.
 * - On Web: Displays a clean, non-intrusive NOVA sponsored banner matching the app's theme.
 */

// Production & Test Ad Unit IDs
const ANDROID_TEST_BANNER_ID = 'ca-app-pub-3940256099942544/6300978111';
const IOS_TEST_BANNER_ID = 'ca-app-pub-3940256099942544/2934735716';

export function AdBanner() {
  // Check if we are running in React Native
  let isReactNative = false;
  let RNPlatform: any = null;
  let RNView: any = null;
  let MobileAds: any = null;

  try {
    const rn = require('react-native');
    RNPlatform = rn.Platform;
    RNView = rn.View;
    isReactNative = RNPlatform && RNPlatform.OS !== 'web';
  } catch {
    isReactNative = false;
  }

  // If running natively on Android or iOS
  if (isReactNative && RNPlatform) {
    try {
      MobileAds = require('react-native-google-mobile-ads');
      const { BannerAd, BannerAdSize, TestIds } = MobileAds;
      const isDev = Boolean((globalThis as any).__DEV__);
      const adUnitId = isDev
        ? TestIds.BANNER
        : (RNPlatform.OS === 'android' ? ANDROID_TEST_BANNER_ID : IOS_TEST_BANNER_ID);

      return (
        <RNView style={{ alignItems: 'center', justifyContent: 'center', width: '100%', marginVertical: 8 }}>
          <BannerAd
            unitId={adUnitId}
            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            requestOptions={{
              requestNonPersonalizedAdsOnly: true,
            }}
          />
        </RNView>
      );
    } catch (err) {
      console.warn('Native AdMob banner load error:', err);
    }
  }

  // Fallback for Web preview
  return (
    <div className="w-full max-w-md mx-auto my-3 px-4">
      <div className="flex items-center justify-between p-2.5 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm text-xs">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Ad
          </span>
          <span className="text-neutral-400">Google AdMob Active on Android APK</span>
        </div>
        <span className="text-[10px] text-neutral-500">Test Mode</span>
      </div>
    </div>
  );
}

export default AdBanner;
