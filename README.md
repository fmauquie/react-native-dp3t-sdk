# react-native-dp3t

DP3T native bindings for React Native

## Installation

```sh
npm install react-native-dp3t
```

## Necessary manual Android setup

[Customize the tracing notification](https://github.com/DP-3T/dp3t-sdk-android#customize-tracing-notification) as in the Android SDK

You have to make changes in `build.gradle`:
- `minSdkVersion` to 23 or above, as the Android DP3T SDK dos not support lower versions.
- `compileSdkVersion` to 29 or above, to fulfill the requirement for `android:foregroundServiceType` in Android Q (set by the Android DP3T SDK).

The lib automatically sets the `android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` permission.
The lib also ask the user to add your app to the battery optimization whitelist for you when you call `Dp3t.init()`.

The Play Store usually [prohibits this](https://developer.android.com/training/monitoring-device-state/doze-standby.html#support_for_other_use_cases),
so you need to make sure the Play Store filing explains why this is necessary.
This may only be necessary until the Android SDK uses official Google DP3T support, in which case we will adapt the permissions & warning sin this section.

## Necessary manual iOS setup

Minimum iOS version is 10 for DP3T iOS SDK, so you need to change the verison to (at least) 10.0 in your iOS Podfile.

You have to add the [react-native-swift](https://github.com/rhdeck/react-native-swift) package and run `react-native swiftify` and run `pod install` again, because this native module (and the DP3T iOS SDK) use Swift.

[Add bluetooth capabilities](https://github.com/DP-3T/dp3t-sdk-ios#start--stop-tracing) to your Info.plist file.

This implementation does not yet support requesting the permissions to use Bluetooth in iOS.

iOS SDK does not sync keys automatically. These bindings do not attempt to sync automatically either: you need to call Dp3t.sync() manually.

## Usage

```js
import Dp3t from 'react-native-dp3t';

// ...

const deviceName = await Dp3t.getDeviceName();
```

## License

MIT
