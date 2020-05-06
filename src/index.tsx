import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  EmitterSubscription,
  NativeEventEmitter,
  NativeModules,
  PermissionsAndroid,
  Platform,
  Rationale,
} from 'react-native';

const Dp3t = NativeModules.Dp3t;
const dp3tEmitter = new NativeEventEmitter(Dp3t);

/**
 * Name of the event that is sent when tracing status changes.
 *
 * Do not use it directly, use `addStatusUpdatedListener()` as there are Date conversions to do.
 */
export const Dp3tStatusUpdated: string = Dp3t.Dp3tStatusUpdated;

/**
 * Errors that can arise in the SDK
 */
type Dp3TError =
  /**
   * Other error (check nativeErrors for more information)
   *
   * Only in iOS
   */
  | 'other'
  /**
   * Bluetooth is disabled on device. Ask user to enable bluetooth.
   */
  | 'bluetoothDisabled'
  /**
   * Missing permissions.
   *
   * On iOS this is bluetooth permission,
   * on Android this is both location permission and battery optimization disabling.
   *
   * Call requestPermissions() to fix for Android, display an error in iOS.
   */
  | 'permissionMissing'
  /**
   * Error while syncing. See nativeErrors for more information.
   */
  | 'sync';

/**
 * Possible tracing states
 */
type TracingState =
  /**
   * SDK is exchanging EphIDs with people around
   */
  | 'started'
  /**
   * SDK is not started, but can be
   */
  | 'stopped'
  /**
   * SDK is not started, and there are errors that prevent SDK from starting
   *
   * See `errors` attribute from `TracingStatus`
   */
  | 'error';

/**
 * Possible health statuses
 */
type HealthStatus =
  /**
   * The user has not been tested positive and has not contacted anyone that has been.
   *
   * There as no reason to believe that they are at risk _as far as tracking is concerned_
   */
  | 'healthy'
  /**
   * The phone has made a handshake with a contact that was tested positive.
   *
   * You will see the list of expositions in `exposedDays`
   */
  | 'exposed'
  /**
   * The user has declared they have been tested positive using sendIAmInfected().
   */
  | 'infected';

/**
 * A contact with an exposed person
 */
type ExposedDay = {
  /**
   * Some internal unique ID. Can not be used to identify a contact, but can serve as a React `key`
   */
  id: number;
  /**
   * Date we saw this contact. This is set to a start of day, e.g. midnight GMT
   */
  exposedDate: Date;
  /**
   * Date the contact reported themselves as exposed.
   */
  reportDate: Date;
};

/**
 * Status of the tracing SDK
 */
interface TracingStatus {
  /**
   * Current tracing state.
   */
  tracingState: TracingState;
  /**
   * Number of handshakes.
   *
   * This is the number of signals your phone received from other phones.
   *
   * You may need to manually refresh the status to see this value change.
   *
   * THIS IS DEBUG DATA and it will be removed in beta (Android removed it in 0.1.9)
   */
  numberOfHandshakes: number;
  /**
   * Number of contacts.
   *
   * This is the number of unique IDs your phone saw.
   *
   * This will always be lower than the number of handshakes.
   *
   * This is only updated on sync. Do not consider this information real-time.
   *
   * As of 2020-04-27 this stays 0 in iOS, no idea why.
   */
  numberOfContacts: number;
  /**
   * Current health status
   */
  healthStatus: HealthStatus;
  /**
   * In iOS the health status can have an argument. It is provided there. See iOS SDK for details.
   */
  nativeStatusArg?: Object;
  /**
   * Last time the SDK synced with the backend server.
   *
   * `null` if never synced
   */
  lastSyncDate: Date | null;
  /**
   * The SDK is not ready. See individual errors to know what to do.
   *
   * On iOS, there is only one error at a time.
   */
  errors: Dp3TError[];
  /**
   * Native errors that corresponds to the error above.
   * These are different in iOS and Android, see the individual SDKs for more information.
   *
   * On iOS, there is only one error at a time.
   */
  nativeErrors: string[];
  /**
   * On iOS, the error can have an argument. It is there. See iOS SDK for details.
   */
  nativeErrorArg?: Object;
  /**
   * The days you were exposed.
   *
   * The array always carry a value, but it will only be filled if `healthStatus === 'exposed'`
   */
  exposedDays: ExposedDay[];
}

/**
 * Is the SDK initialized ?
 *
 * Use this to know if you can call the main methods or if you need to call the `init*` methods first.
 *
 * Resolves promise with `true` when the SDK is initialized
 */
export async function isInitialized(): Promise<boolean> {
  return Dp3t.isInitialized();
}

/**
 * Initialize the SDK with the GitHub discovery service.
 *
 * The discovery service is a JSON file on GitHub:
 * - for production: https://github.com/DP-3T/dp3t-discovery/blob/master/discovery.json
 * - for dev: https://github.com/DP-3T/dp3t-discovery/blob/master/discovery_dev.json
 *
 * @param backendAppId The `appId` in the discovery service
 * @param publicKeyBase64 The public key of the service. Necessary for sync in Android.
 * @param dev Should use the dev or production service ?
 */
export function initWithDiscovery(
  backendAppId: string,
  publicKeyBase64: string,
  dev = false
): Promise<void> {
  return Dp3t.initWithDiscovery(backendAppId, publicKeyBase64, dev);
}

/**
 * Initialize the SDK by passing the backend URLs.
 *
 * @param backendAppId Unique ID for the backend, used internally by the SDK to reset the sync caches when it changes (I think)
 * @param reportBaseUrl Report URL for the backend (should be provided by your backend provider)
 * @param bucketBaseUrl Bucket URL for the backend (should be provided by your backend provider)
 * @param publicKeyBase64 The public key of the service. Necessary for sync in Android.
 */
export function initManually(
  backendAppId: string,
  reportBaseUrl: string,
  bucketBaseUrl: string,
  publicKeyBase64: string
): Promise<void> {
  return Dp3t.initManually(
    backendAppId,
    reportBaseUrl,
    bucketBaseUrl,
    publicKeyBase64
  );
}

/**
 * Start tracing.
 *
 * The phone will start advertising EphIDs with Bluetooth.
 *
 * The phone will start listening to EphIDs from other devices.
 *
 * This will only work if all Bluetooth and permission errors have been managed (see TracingStatus.errors)
 */
export function start(): Promise<void> {
  return Dp3t.start();
}

/**
 * Stop tracing.
 *
 * This will stop advertising EphIDs and stop collecting them.
 */
export function stop(): Promise<void> {
  return Dp3t.stop();
}

/**
 * Fetch the status of the SDK.
 *
 * This will throw an error if the SDK has not been initialized.
 */
export async function currentTracingStatus(): Promise<TracingStatus> {
  return convertStatus(await Dp3t.currentTracingStatus());
}

const convertStatus = (platformStatus: any) => ({
  ...platformStatus,
  lastSyncDate: platformStatus.lastSyncDate
    ? new Date(parseInt(platformStatus.lastSyncDate, 10))
    : null,
  exposedDays: platformStatus.exposedDays.map(
    ({
      id,
      exposedDate,
      reportDate,
    }: {
      id: number;
      exposedDate: string;
      reportDate: string;
    }) => ({
      id,
      exposedDate: new Date(parseInt(exposedDate, 10)),
      reportDate: new Date(parseInt(reportDate, 10)),
    })
  ),
});

/**
 * Report the user as infected.
 *
 * Use this when the user has been tested positive to the virus.
 *
 * ALPHA WARNING there are 2 ways in the SDKs to send the authentication code.
 * This implementation assumes HTTP auth method until more info is known.
 *
 * @param onset The date when the user was tested positive
 * @param auth The code given by the doctor to the user for authentication,
 *             passed depending on how the server operates.
 */
export function sendIAmInfected(
  onset: Date,
  auth: { authorization: string } | { json: string }
): Promise<void> {
  return Dp3t.sendIAmInfected(
    Platform.select({
      ios: onset.toISOString(),
      android: '' + onset.getTime() / 1000,
    }),
    auth
  );
}

/**
 * Force a sync.
 *
 * The SDKs sync the known cases periodically. You can force a sync now.
 *
 * Resolves promise with `true` if the sync was forced, `false` if a sync was already in progress.
 */
export function sync(): Promise<boolean> {
  return Dp3t.sync();
}

/**
 * Clear all data and reset the service.
 *
 * You will need to call init* method again.
 */
export function clearData(): Promise<void> {
  return Dp3t.clearData();
}

/**
 * Listen to status changes.
 *
 * You certainly should use `useDp3tStatus()` instead.
 *
 * Do not ever forget to unregister the listener on unmount with subscription.remove():
 * ```js
 * useEffect(() => {
 *   const subscription = await addStatusUpdatedListener(setStatus);
 *   return () => subscription.remove();
 * }, [])
 * ```
 *
 * @param listener The listener will be called on each status change with the new status.
 */
export function addStatusUpdatedListener(
  listener: (status: TracingStatus) => any
): EmitterSubscription {
  return dp3tEmitter.addListener(Dp3tStatusUpdated, status =>
    listener(convertStatus(status))
  );
}

/**
 * Requests missing permissions.
 *
 * This only does something on Android.
 * On iOS the permissions are requested by the SDK for us.
 *
 * This is still important to monitor the permission error on iOS:
 * if the user refuses to grant them we need to show them a nice message with some explanations.
 *
 * Resolves the promise with a PermissionStatus on Android (this is a string: 'granted' | 'denied' | 'never_ask_again')
 *
 * Resolves the promise with 'ios' on iOS
 *
 * @param rationale The texts to show on some Android devices (on iOS they go in Infos.plist, check README.md).
 */
export async function requestPermissions(rationale?: Rationale) {
  if (Platform.OS === 'android') {
    const permissionsStatus = await PermissionsAndroid.request(
      'android.permission.ACCESS_FINE_LOCATION',
      rationale
    );
    await Dp3t.checkBatteryOptimizationDeactivated();

    return permissionsStatus;
  }
  return 'ios';
}

/**
 * Listens to the status of the DP3T service.
 *
 * Usage:
 * ```js
 * const [status, refreshStatus] = useDp3tStatus();
 * ```
 *
 * `status` is:
 * - `null` if the status is loading from the SDK (briefly on mount)
 * - `false` if the SDK is not initialized (call init*() methods)
 * - the TracingStatus in normal operation
 *
 * `refreshStatus` is a function you can call to force a status refresh from the SDK.
 * You usually do not need to use it (the SDKs are pretty good at keeping this up-to-date),
 * but it is useful in the following situations:
 * - You just called `requestPermissions()` (the status will not update on permissions grant)
 * - To give the user a way to make sure the status is the lastest available
 */
export function useDp3tStatus(): [null | false | TracingStatus, () => void] {
  const [initialized, setInitialized] = useState<boolean | null>(null);
  const [status, setStatus] = useState<TracingStatus | null>(null);

  useEffect(function checkInitialized() {
    isInitialized().then(setInitialized);
  }, []);

  const refreshStatus = useCallback(
    function refreshStatus() {
      if (initialized) {
        setStatus(null);
        currentTracingStatus().then(setStatus);
      }
    },
    [initialized]
  );

  useEffect(
    function registerDp3tEventListener() {
      if (initialized) {
        refreshStatus();
        const subscription = addStatusUpdatedListener(setStatus);

        return function clearDp3tEventListener() {
          subscription.remove();
        };
      }
      return undefined;
    },
    [initialized, refreshStatus]
  );

  return useMemo(() => [initialized && status, refreshStatus], [
    initialized,
    status,
    refreshStatus,
  ]);
}
