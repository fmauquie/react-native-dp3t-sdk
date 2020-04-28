# react-native-dp3t

DP3T bindings for React Native.

## Status

Pre-alpha. Requires some manual setup to work. Not tested yet. Can change without notice.

The [iOS SDK][iOS SDK] and [Android SDK][Android SDK] themselves are in alpha state.

This project is bootstraped from [bob][bob], see [implementation notes][implementation notes].


## Installation

Right now you need to clone it or add it with its Git URL, and build it with `yarn bootstrap`.

<strike>
```sh
npm install react-native-dp3t
```
</strike>

This lib does not work on emulators or simulators, and will crash or burn incomprehensibly. Run on physical devices.

## Necessary manual Android setup

[Customize the tracing notification](https://github.com/DP-3T/dp3t-sdk-android#customize-tracing-notification) as in the Android SDK

You have to make changes in `build.gradle`:

- `minSdkVersion` to 23 or above, as the Android DP3T SDK dos not support lower versions.
- `compileSdkVersion` to 29 or above, to fulfill the requirement for `android:foregroundServiceType` in Android Q (set by the Android DP3T SDK).

The lib automatically sets the `android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` permission.
The lib also ask the user to add your app to the battery optimization whitelist for you when you call `Dp3t.init()`.

The Play Store usually [prohibits this](https://developer.android.com/training/monitoring-device-state/doze-standby.html#support_for_other_use_cases),
so you need to make sure the Play Store filing explains why this is necessary.
This may only be necessary until the Android SDK uses official Google DP3T support, in which case we will adapt the permissions & warnings in this section.

## Necessary manual iOS setup

Minimum iOS version is 11 for DP3T iOS SDK, so you need to change the verison to (at least) 11.0 in your iOS Podfile.

If you are not in v0.62, you have to add the [react-native-swift](https://github.com/rhdeck/react-native-swift) package and run `react-native swiftify` and run `pod install` again, because this native module (and the DP3T iOS SDK) use Swift.
If you are in v0.62 you should be fine just using the module.

[Add bluetooth capabilities](https://github.com/DP-3T/dp3t-sdk-ios#start--stop-tracing) to your Info.plist file.

[Add background fetch configuration](https://github.com/DP-3T/dp3t-sdk-ios#background-tasks) to your Info.plist file.

You have to add `pod 'DP3TSDK', :git => "https://github.com/DP-3T/dp3t-sdk-ios.git", :commit => 'COMMIT_ID''` in your Podfile until the SDK stabilizes, and a version is pushed on the Pods repo.
Replace `COMMIT_ID` with `53a8a68fa4fa655a9159eb2bc2c29384a461fc16` (latest version supported, watch this file to follow the changes)

This implementation does not yet support requesting the permissions to use Bluetooth in iOS.

## Usage

```js
import Dp3t from 'react-native-dp3t';

// ...

const deviceName = await Dp3t.getDeviceName();
```

## Testing / Contributing

- [contributing guidelines](./CONTRIBUTING.md)
- [implementation notes][implementation notes]

## License

MIT

## Alternatives

[Wix incubator](https://github.com/wix-incubator/rn-contact-tracing) is building a RN lib from scratch (they don't use DP3T SDK)



[implementation notes]: ./docs/implementation-notes.md
[iOS SDK]: https://github.com/DP-3T/dp3t-sdk-ios
[Android SDK]: https://github.com/DP-3T/dp3t-sdk-android
[bob]: https://github.com/react-native-community/bob
