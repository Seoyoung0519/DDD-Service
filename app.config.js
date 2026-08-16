/** @type {import('expo/config').ExpoConfig} */
const appJson = require('./app.json');

const kakaoNativeAppKey = (process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY ?? '').trim();
const googleMapsApiKey = (process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '').trim();

const skipCommuteRouteSearch =
  String(process.env.EXPO_PUBLIC_SKIP_COMMUTE_ROUTE_SEARCH ?? '').trim().toLowerCase() ===
  'true';

const plugins = [
  './plugins/withKakaoMavenRepository.js',
  './plugins/withDisableSystemFontScale.js',
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
