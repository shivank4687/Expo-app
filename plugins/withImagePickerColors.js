const { withAndroidColors, withAndroidColorsNight, withAndroidManifest, withAndroidStyles } = require('@expo/config-plugins');

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

const withImagePickerColors = (config) => {
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
