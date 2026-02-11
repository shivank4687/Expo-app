# How to Build Android APK for Client Testing

Your project is already configured for EAS (Expo Application Services). Follow these steps to generate an APK file that you can send to your client.

## 1. Install EAS CLI
If you haven't already, install the EAS CLI globally:
```bash
npm install -g eas-cli
```

## 2. Login to Expo
Log in to your Expo account:
```bash
eas login
```

## 3. Configure the Project (If not already done)
The project already has `eas.json`, so you might not need this, but it's good to ensure everything is initialized:
```bash
eas build:configure
```

## 4. Run the Build
To generate an APK for testing, run the build using the `preview` profile:
```bash
eas build -p android --profile preview
```

> [!NOTE]
> The `preview` profile in your `eas.json` is configured to output an `apk` file rather than an `aab`.

## 5. Get the APK
Once the build is finished (this can take 10-20 minutes as it runs on Expo's servers):
1. EAS will provide a download link in the terminal.
2. You can also find the build in your [Expo Dashboard](https://expo.dev/dashboard).
3. Download the `.apk` file and send it to your client.

## Building Locally (Advanced)
If you have Android Studio and a powerful machine, you can build locally to save Expo credits:
```bash
eas build -p android --profile preview --local
```
