/**
 * @deprecated 대독단은 Pretendard + maxFontSizeMultiplier 정책으로 전환했습니다.
 * 시스템 fontScale을 1로 잠그면 접근성 확대가 막히므로 app.config.js에서 제거했습니다.
 * 파일은 히스토리용으로만 남겨 둡니다.
 */
function withDisableSystemFontScale(config) {
  return config;
}

module.exports = withDisableSystemFontScale;
