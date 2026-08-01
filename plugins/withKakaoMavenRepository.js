const { withProjectBuildGradle } = require('@expo/config-plugins');

const KAKAO_MAVEN_MARKER = 'devrepo.kakao.com';
const KAKAO_MAVEN_LINE =
  "    maven { url 'https://devrepo.kakao.com/nexus/content/groups/public/' }";

/** @react-native-kakao Android SDK — Kakao 전용 Maven 저장소 */
function withKakaoMavenRepository(config) {
  return withProjectBuildGradle(config, (gradleConfig) => {
    if (gradleConfig.modResults.contents.includes(KAKAO_MAVEN_MARKER)) {
      return gradleConfig;
    }

    gradleConfig.modResults.contents = gradleConfig.modResults.contents.replace(
      /allprojects\s*\{\s*\n\s*repositories\s*\{/,
      `allprojects {\n  repositories {\n${KAKAO_MAVEN_LINE}`,
    );

    return gradleConfig;
  });
}

module.exports = withKakaoMavenRepository;
