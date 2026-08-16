const { withAndroidStyles } = require('@expo/config-plugins');

const ITEM_NAME = 'android:enforceNavigationBarContrast';

/**
 * 삼성 3버튼 내비게이션의 반투명 회색 스크림을 끕니다.
 * (edge-to-edge에서 기본값 true면 하단 탭 라벨 위에 어두운 바가 겹칩니다)
 */
function withTransparentNavBar(config) {
  return withAndroidStyles(config, (modConfig) => {
    const styles = modConfig.modResults.resources.style ?? [];
    for (const style of styles) {
      const items = style.item ?? [];
      const existing = items.find((item) => item.$?.name === ITEM_NAME);
      if (existing) {
        existing._ = 'false';
      } else if (style.$?.name === 'AppTheme') {
        items.push({ $: { name: ITEM_NAME }, _: 'false' });
        style.item = items;
      }
    }
    return modConfig;
  });
}

module.exports = withTransparentNavBar;
