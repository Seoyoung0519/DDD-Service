const { withMainActivity } = require('@expo/config-plugins');

const MARKER = 'Daedokdan: lock fontScale';

const KT_IMPORTS = `import android.content.Context
import android.content.res.Configuration
`;

const KT_METHOD = `
  // ${MARKER} — ignore Samsung/system font size
  override fun attachBaseContext(newBase: Context) {
    val config = Configuration(newBase.resources.configuration)
    config.fontScale = 1f
    applyOverrideConfiguration(config)
    super.attachBaseContext(newBase)
  }
`;

const JAVA_IMPORTS = `import android.content.Context;
import android.content.res.Configuration;
`;

const JAVA_METHOD = `
  // ${MARKER} — ignore Samsung/system font size
  @Override
  protected void attachBaseContext(Context newBase) {
    Configuration config = new Configuration(newBase.getResources().getConfiguration());
    config.fontScale = 1f;
    applyOverrideConfiguration(config);
    super.attachBaseContext(newBase);
  }
`;

/**
 * 삼성/안드로이드 시스템 글자 크기를 앱에 적용하지 않습니다.
 * JS allowFontScaling만으로는 New Architecture + React 19에서 빠져나가는 네이티브 위젯이 있습니다.
 */
function withDisableSystemFontScale(config) {
  return withMainActivity(config, (modConfig) => {
    let src = modConfig.modResults.contents;
    if (src.includes(MARKER)) {
      return modConfig;
    }

    const isKotlin =
      modConfig.modResults.language === 'kt' ||
      /class MainActivity\s*:/.test(src);

    if (src.includes('attachBaseContext(') && !src.includes(MARKER)) {
      return modConfig;
    }

    if (isKotlin && /class MainActivity/.test(src)) {
      if (!src.includes('import android.content.Context')) {
        src = src.replace(/(package [^\n]+\n)/, `$1\n${KT_IMPORTS}`);
      }
      if (!src.includes('import android.content.res.Configuration')) {
        src = src.replace(/(package [^\n]+\n)/, `$1import android.content.res.Configuration\n`);
      }
      src = src.replace(/class MainActivity[^{]*\{/, (match) => `${match}\n${KT_METHOD}`);
    } else {
      if (!src.includes('import android.content.Context')) {
        src = src.replace(/(package [^\n]+\n)/, `$1\n${JAVA_IMPORTS}`);
      }
      src = src.replace(/public class MainActivity[^{]*\{/, (match) => `${match}\n${JAVA_METHOD}`);
    }

    modConfig.modResults.contents = src;
    return modConfig;
  });
}

module.exports = withDisableSystemFontScale;
