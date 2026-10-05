/** @type {import('expo/config').ExpoConfig} */
const appJson = require('./app.json');

const kakaoNativeAppKey = (process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY ?? '').trim();
const googleMapsApiKey = (process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '').trim();

const skipCommuteRouteSearch =
  String(process.env.EXPO_PUBLIC_SKIP_COMMUTE_ROUTE_SEARCH ?? '').trim().toLowerCase() ===
  'true';

/** Play Console DEX 난독화 기준(25%+) — Android release 빌드(프로덕션 AAB·preview APK) 공통 R8 */
const ANDROID_RELEASE_PROGUARD = `
# @react-native-kakao / Kakao SDK
-keep class com.kakao.sdk.** { *; }
-keep class com.kakao.** { *; }

# @react-native-google-signin/google-signin
-keep class com.reactnativegooglesignin.** { *; }
-dontwarn com.google.android.gms.**
`.trim();

const plugins = [
  [
    'expo-build-properties',
    {
      android: {
        enableMinifyInReleaseBuilds: true,
        enableShrinkResourcesInReleaseBuilds: true,
        extraProguardRules: ANDROID_RELEASE_PROGUARD,
      },
    },
  ],
  './plugins/withKakaoMavenRepository.js',
  // 시스템 fontScale을 1로 잠그면 maxFontSizeMultiplier 정책이 무의미해지므로 사용하지 않습니다.
  // './plugins/withDisableSystemFontScale.js',
  './plugins/withTransparentNavBar.js',
  ...(appJson.expo.plugins ?? []),
];

if (kakaoNativeAppKey) {
  plugins.push([
    '@react-native-kakao/core',
    {
      nativeAppKey: kakaoNativeAppKey,
      android: {
        authCodeHandlerActivity: true,
      },
      ios: {
        handleKakaoOpenUrl: true,
      },
    },
  ]);
}

plugins.push([
  'expo-image-picker',
  {
    cameraPermission: '독서 인증샷 촬영을 위해 카메라 접근이 필요합니다.',
  },
]);

module.exports = {
  expo: {
    ...appJson.expo,
    ios: {
      ...appJson.expo.ios,
      ...(googleMapsApiKey
        ? {
            config: {
              ...appJson.expo.ios?.config,
              googleMapsApiKey,
            },
          }
        : {}),
    },
    android: {
      ...appJson.expo.android,
      ...(googleMapsApiKey
        ? {
            config: {
              ...appJson.expo.android?.config,
              googleMaps: {
                apiKey: googleMapsApiKey,
              },
            },
          }
        : {}),
    },
    plugins,
    extra: {
      ...appJson.expo.extra,
      skipCommuteRouteSearch,
      googleMapsApiKey: googleMapsApiKey || undefined,
      kakaoNativeAppKey: kakaoNativeAppKey || undefined,
    },
  },
};
