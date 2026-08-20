const { withAndroidColors, withAndroidColorsNight, withAndroidManifest, withAndroidStyles, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

function setColor(modResults, name, value) {
  if (!modResults.resources) {
    modResults.resources = { color: [] };
  }
  if (!modResults.resources.color) {
    modResults.resources.color = [];
  }
  const colors = modResults.resources.color;
  const existingColorIndex = colors.findIndex(c => c.$ && c.$.name === name);
  if (existingColorIndex > -1) {
    colors[existingColorIndex]._ = value;
  } else {
    colors.push({ $: { name }, _: value });
  }
  return modResults;
}

function setStyle(modResults, styleName, parentName, items) {
  if (!modResults.resources) {
    modResults.resources = {};
  }
  if (!modResults.resources.style) {
    modResults.resources.style = [];
  }
  
  const styles = modResults.resources.style;
  let styleObject = styles.find(s => s.$ && s.$.name === styleName);
  
  if (!styleObject) {
    styleObject = {
      $: { name: styleName },
      item: []
    };
    styles.push(styleObject);
  }
  
  if (parentName) {
    styleObject.$.parent = parentName;
  }
  
  if (!styleObject.item) {
    styleObject.item = [];
  }
  
  for (const [key, itemVal] of Object.entries(items)) {
    const name = key;
    let val = itemVal;
    let extraAttrs = {};
    if (typeof itemVal === 'object') {
      val = itemVal.value;
      extraAttrs = itemVal.attrs || {};
    }
    
    const existingItemIndex = styleObject.item.findIndex(i => i.$ && i.$.name === name);
    const itemObj = { $: { name, ...extraAttrs }, _: val };
    if (existingItemIndex > -1) {
      styleObject.item[existingItemIndex] = itemObj;
    } else {
      styleObject.item.push(itemObj);
    }
  }
  
  return modResults;
}

/**
 * Writes android/app/src/main/res/values-v35/styles.xml with a CustomUCropTheme
 * override scoped to API 35+. This is the *only* reliable way to apply
 * android:windowOptOutEdgeToEdgeEnforcement on Android 15, because with
 * edgeToEdgeEnabled:true the main process forces window flags at a level that
 * the tools:targetApi attribute in values/styles.xml cannot override in time.
 *
 * The values-v35 qualifier wins over values/ on API 35 devices, so Android's
 * resource resolution picks up the opt-out automatically — no manifest changes
 * needed.
 */
const UCROP_VALUES_V35_STYLES = `<?xml version="1.0" encoding="utf-8"?>
<resources>
  <!--
    API-35-specific override for the crop activity theme.
    Opting out of mandatory edge-to-edge enforcement so the toolbar and
    bottom crop button are not drawn behind the status / navigation bars.
  -->
  <style name="CustomUCropTheme" parent="Theme.AppCompat.DayNight.NoActionBar">
    <!-- Opt out of Android 15 mandatory edge-to-edge (API 35 only) -->
    <item name="android:windowOptOutEdgeToEdgeEnforcement">true</item>
    <!-- Reserve space for status bar at the top -->
    <item name="android:fitsSystemWindows">true</item>
    <!-- Allow drawing system bar backgrounds -->
    <item name="android:windowDrawsSystemBarBackgrounds">true</item>
    <!-- Match status bar to crop toolbar color -->
    <item name="android:statusBarColor">@color/expoCropToolbarColor</item>
    <!-- Match nav bar to crop toolbar color (prevents bottom button overlap) -->
    <item name="android:navigationBarColor">@color/expoCropToolbarColor</item>
    <!-- Disable translucent system bars -->
    <item name="android:windowTranslucentStatus">false</item>
    <item name="android:windowTranslucentNavigation">false</item>
    <item name="android:windowFullscreen">false</item>
  </style>
</resources>
`;

const withImagePickerColors = (config) => {
  // 0. Write values-v35/styles.xml for API-35-specific edge-to-edge opt-out
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const v35Dir = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'res',
        'values-v35'
      );
      if (!fs.existsSync(v35Dir)) {
        fs.mkdirSync(v35Dir, { recursive: true });
      }
      const stylesPath = path.join(v35Dir, 'styles.xml');
      fs.writeFileSync(stylesPath, UCROP_VALUES_V35_STYLES, 'utf8');
      return config;
    },
  ]);

  // 1. Update Light Mode resources
  config = withAndroidColors(config, (config) => {
    config.modResults = setColor(config.modResults, 'expoCropToolbarColor', '#00615E');
    config.modResults = setColor(config.modResults, 'expoCropToolbarIconColor', '#ffffff');
    config.modResults = setColor(config.modResults, 'expoCropToolbarActionTextColor', '#ffffff');
    config.modResults = setColor(config.modResults, 'expoCropBackButtonIconColor', '#ffffff');
    config.modResults = setColor(config.modResults, 'expoCropBackgroundColor', '#FCF7EA');
    return config;
  });

  // 2. Update Dark Mode resources
  config = withAndroidColorsNight(config, (config) => {
    config.modResults = setColor(config.modResults, 'expoCropToolbarColor', '#00615E');
    config.modResults = setColor(config.modResults, 'expoCropToolbarIconColor', '#ffffff');
    config.modResults = setColor(config.modResults, 'expoCropToolbarActionTextColor', '#ffffff');
    config.modResults = setColor(config.modResults, 'expoCropBackButtonIconColor', '#ffffff');
    config.modResults = setColor(config.modResults, 'expoCropBackgroundColor', '#111827');
    return config;
  });

  // 3. Override Activity Theme in AndroidManifest
  config = withAndroidManifest(config, (config) => {
    const mainApplication = config.modResults.manifest.application[0];
    if (!mainApplication.activity) {
      mainApplication.activity = [];
    }
    
    const existingActivity = mainApplication.activity.find(
      (a) => a.$ && a.$['android:name'] === 'expo.modules.imagepicker.ExpoCropImageActivity'
    );
    
    if (existingActivity) {
      existingActivity.$['android:theme'] = '@style/CustomUCropTheme';
      existingActivity.$['tools:replace'] = 'android:theme';
    } else {
      mainApplication.activity.push({
        $: {
          'android:name': 'expo.modules.imagepicker.ExpoCropImageActivity',
          'android:theme': '@style/CustomUCropTheme',
          'tools:replace': 'android:theme',
          'android:exported': 'false',
        }
      });
    }
    
    if (!config.modResults.manifest.$['xmlns:tools']) {
      config.modResults.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }
    
    return config;
  });

  // 4. Declare custom style in styles.xml
  config = withAndroidStyles(config, (config) => {
    config.modResults = setStyle(config.modResults, 'CustomUCropTheme', 'Theme.AppCompat.DayNight.NoActionBar', {
      'android:windowFullscreen': 'false',
      'android:fitsSystemWindows': 'true',
      'android:windowDrawsSystemBarBackgrounds': 'true',
      'android:statusBarColor': '#00615E',
      'android:windowTranslucentStatus': 'false',
      'android:windowTranslucentNavigation': 'false',
      'android:windowOptOutEdgeToEdgeEnforcement': {
        value: 'true',
        attrs: { 'tools:targetApi': '35' }
      }
    });
    return config;
  });

  return config;
};

module.exports = withImagePickerColors;
