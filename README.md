# react-native-dp3t-sdk

DP3T SDK bindings for React Native.

## Status

Pre-alpha. Requires some manual setup to work. Not tested yet. Can change without notice.

The [iOS SDK][ios sdk] and [Android SDK][android sdk] themselves are in alpha state.

This project is bootstraped from [bob][bob], see [implementation notes][implementation notes].

## Installation

```sh
yarn add react-native-dp3t-sdk@alpha
```

This lib does not work on emulators or simulators, because Bluetooth. Run on physical devices.

If you use Fiber to display the Android SDK database, note that the ephID column is always blank.
This is because ephIDs are encrypted BLOBs, they are _not_ missing.

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

Until we have a way of initializing the background sync manager on iOS, you need to ass this line to your Podfile:
```
pod 'DP3TSDK', :git => "https://github.com/fmauquie/dp3t-sdk-ios.git", :branch => 'develop'
```
<strike>
You have to add `pod 'DP3TSDK', :git => "https://github.com/DP-3T/dp3t-sdk-ios.git", :commit => 'COMMIT_ID'` in your Podfile until the SDK stabilizes, and a version is pushed on the Pods repo.
Replace `COMMIT_ID` with `53a8a68fa4fa655a9159eb2bc2c29384a461fc16` (latest version supported, watch this file to follow the changes)
</strike>

This implementation does not yet support requesting the permissions to use Bluetooth in iOS.

## Usage

```js
import * as Dp3t from 'react-native-dp3t-sdk';

// or

import { useDp3tStatus } from 'react-native-dp3t-sdk';
```

### Initialization

You need to initialize the SDK before calling most methods. You have 2 ways:

#### initWithDiscovery(backendAppId: string, dev?: string): Promise&lt;void>

Initialize the SDK with the GitHub discovery service.

The discovery service is a JSON file on GitHub:

- for production: https://github.com/DP-3T/dp3t-discovery/blob/master/discovery.json
- for dev: https://github.com/DP-3T/dp3t-discovery/blob/master/discovery_dev.json

Params:

- `backendAppId`: The `appId` in the discovery service
- `dev` Should use the dev or production service ? Defaults to `false` (production)

#### initManually(backendAppId: string, reportBaseUrl: string, bucketBaseUrl: string): Promise&lt;void>

Initialize the SDK by passing the backend URLs.

Params:

- `backendAppId`: Unique ID for the backend, used internally by the SDK to reset the sync caches when it changes (I think)
- `reportBaseUrl`: Report URL for the backend (should be provided by your backend provider)
- `bucketBaseUrl`: Bucket URL for the backend (should be provided by your backend provider)

### API

#### isInitialized(): Promise&lt;boolean>

Is the SDK initialized ?

Use this to know if you can call the main methods or if you need to call the `init*` methods first.

Resolves promise with `true` when the SDK is initialized

#### start(): Promise&lt;void>

Start tracing.

The phone will start advertising EphIDs with Bluetooth.

The phone will start listening to EphIDs from other devices.

This will only work if all Bluetooth and permission errors have been managed (see `TracingStatus.errors` below)

#### stop(): Promise&lt;void>

Stop tracing.

This will stop advertising EphIDs and stop collecting them.

#### currentTracingStatus(): Promise&lt;TracingStatus>

Fetch the status of the SDK.

Resolves the promise with the current `TracingStatus` (see below)

This will throw an error if the SDK has not been initialized.

#### sendIAmInfected(onset: Date, authString: string): Promise&lt;void>

Report the user as infected.

Use this when the user has been tested positive to the virus.

ALPHA WARNING there are 2 ways in the SDKs to send the authentication code.
This implementation assumes HTTP auth method until more info is known.

- `onset` The date when the user was tested positive
- `authString` The code given by the physician to the user for authentication.

#### sync(): Promise&lt;boolean>

Force a sync.

The SDKs sync the known cases periodically. You can force a sync now.

Resolves promise with `true` if the sync was forced,
`false` if a sync was already in progress.

#### clearData(): Promise&lt;void>

Clear all data and reset the service.

You will need to call a `init*` method again.

#### addStatusUpdatedListener(listener: (status: TracingStatus) => any): EmitterSubscription

Listen to status changes.

You certainly should use `useDp3tStatus()` instead.

Do not ever forget to unregister the listener on unmount with subscription.remove():

```js
useEffect(() => {
  const subscription = addStatusUpdatedListener(setStatus);
  return () => subscription.remove();
}, [])
```

Params:

- `listener` The listener will be called on each status change with the new status.

#### requestPermissions(rationale?: Rationale): Promise&lt;string>

Requests missing permissions.

This only does something on Android.
On iOS the permissions are requested by the SDK for us.

This is still important to monitor the permission error on iOS:
if the user refuses to grant them we need to show them a nice message with some explanations.

Resolves the promise with a PermissionStatus on Android (this is a string: 'granted' | 'denied' | 'never_ask_again')

Resolves the promise with 'ios' on iOS

Params:

- `rationale` The texts to show on some Android devices (on iOS they go in Infos.plist, check iOS specific setup instructions).

#### useDp3tStatus(): [null | false | TracingStatus, () => void]

Listens to the status of the DP3T service.

Usage:

```js
const [status, refreshStatus] = useDp3tStatus();
```

`status` is:

- `null` if the status is loading from the SDK (briefly on mount)
- `false` if the SDK is not initialized (call init\*() methods)
- the `TracingStatus` in normal operation

`refreshStatus` is a function you can call to force a status refresh from the SDK.
You usually do not need to use it (the SDKs are pretty good at keeping this up-to-date),
but it is useful in the following situations:

- You just called `requestPermissions()` (the status will not update on permissions grant)
- To give the user a way to make sure the status is the lastest available

### Types

#### TracingStatus

Status of the tracing SDK

Attributes:

- `tracingState: TracingState`: string that can take the following values:
  - `started`: SDK is exchanging EphIDs with people around
  - `stopped`: SDK is not started, but can be
  - `error`: SDK is not started, and there are errors that prevent SDK from starting (see `errors` attribute)
- `numberOfHandshakes: number`: This is the number of signals your phone received from other phones.
  You may need to manually refresh the status to see this value change.
- `numberOfContacts: number`: This is the number of unique IDs your phone saw.
  This will always be lower than the number of handshakes.
  This is only updated on sync: do not consider this information real-time.
  As of 2020-04-27 this stays 0 in iOS, no idea why.
- `healthStatus: HealthStatus`: string representing the health status of the user. Values can be:
  - `healthy`: The user has not been tested positive and has not contacted anyone that has been.
    There as no reason to believe that they are at risk _as far as tracking is concerned_
  - `exposed`: The phone has made a handshake with a contact that was tested positive.
    You will see the list of these contacts in `matchedContacts`
  - `infected`: The user has declared they have been tested positive using `sendIAmInfected()`.
- `nativeStatusArg?: Object`: In iOS the health status can have an argument. It is provided there. See iOS SDK for details.
- `lastSyncDate: Date | null`: Last time the SDK synced with the backend server.
  `null` if never synced
- `errors: Dp3TError[]`: Array of strings that represent the possible error conditions in the SDK.
  On iOS there is only one error at a time.
  On Android you can have the same string multiple times (they correspond to different `nativeErrors`).
  Possible values are:
  - `bluetoothDisabled`: Bluetooth is disabled on device. Ask user to enable bluetooth (and refresh status).
  - `permissionMissing`: Missing permissions.
    On iOS this is bluetooth permission,
    on Android this is both location permission and battery optimization disabling.
    Call requestPermissions() to fix for Android, display an error in iOS.
  - `sync`: Error while syncing. See `nativeErrors` for more information.
  - `other`: Other error (check `nativeErrors` for more information)
    Only in iOS
- `nativeErrors: string[]`: Native errors that corresponds to the error above.
  These are different in iOS and Android, see the individual SDKs for more information.
  On iOS, there is only one error at a time.
- `nativeErrorArg?: Object`: On iOS, the error can have an argument. It is there. See iOS SDK for details.
- `matchedContacts: { id: number; reportDate: Date }[]`: The contacts that were infected.
  The array always carry a value, but it will only be filled if `healthStatus === 'exposed'`

## Testing / Contributing

- [contributing guidelines](./CONTRIBUTING.md)
- [implementation notes][implementation notes]

## License

MIT

## Alternatives

[Wix incubator](https://github.com/wix-incubator/rn-contact-tracing) is building a RN lib from scratch (they don't use DP3T SDK)

[implementation notes]: ./docs/implementation-notes.md
[ios sdk]: https://github.com/DP-3T/dp3t-sdk-ios
[android sdk]: https://github.com/DP-3T/dp3t-sdk-android
[bob]: https://github.com/react-native-community/bob
