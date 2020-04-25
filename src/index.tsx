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
 */
export const Dp3tStatusUpdated: string = Dp3t.Dp3tStatusUpdated;

/**
 * Errors that can arise in the SDK
 */
type Dp3TError =
  /**
   * Other error (check nativeError for more information)
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
   * Call requestPermissions() to fix.
   */
  | 'permissionMissing'
  /**
   * Error while syncing. See nativeError for more information.
   */
  | 'sync';

/**
 * Possible tracing states
 */
type TracingState =
  /**
   * SDK is exchanging keys with people around
   */
  | 'started'
  /**
   * SDK is not started, but can be
   */
  | 'stopped'
  /**
   * SDK is not started, and there are errors that prevent SDK from starting
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
   * THe phone has made a handshake with another user that was tested positive.
   */
  | 'exposed'
  /**
   * The user has declared they have been tested positive using sendIWasExposed().
   */
  | 'testedPositive';

/**
 * Status of the tracing SDK
 */
interface TracingStatus {
  /**
   * Current tracing state.
   */
  tracingState: TracingState;
  /**
   * Number of handshakes with other phones
   */
  numberOfHandshakes: number;
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
   * In iOS the sync is _not_ automatic.
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
}

export async function isInitialized(): Promise<boolean> {
  return Dp3t.isInitialized();
}

export function initWithDiscovery(
  backendAppId: string,
  dev: boolean
): Promise<void> {
  return Dp3t.initWithDiscovery(backendAppId, dev);
}

export function initManually(
  backendAppId: string,
  backendBaseUrl: string
): Promise<void> {
  return Dp3t.initManually(backendAppId, backendBaseUrl);
}

export function start(): Promise<void> {
  return Dp3t.start();
}

export function stop(): Promise<void> {
  return Dp3t.stop();
}

export async function currentTracingStatus(): Promise<TracingStatus> {
  return convertStatus(await Dp3t.currentTracingStatus());
}

const convertStatus = (platformStatus: any) => ({
  ...platformStatus,
  lastSyncDate: platformStatus.lastSyncDate
    ? new Date(parseInt(platformStatus.lastSyncDate, 10) * 1000)
    : null,
});

export function sendIWasExposed(
  onset: Date,
  authString: string
): Promise<void> {
  return Dp3t.sendIWasExposed(
    Platform.select({
      ios: onset.toISOString(),
      android: '' + onset.getTime() / 1000,
    }),
    authString
  );
}

export function sync(): Promise<boolean> {
  return Dp3t.sync();
}

export function clearData(): Promise<void> {
  return Dp3t.clearData();
}

export function addStatusUpdatedListener(
  listener: (status: TracingStatus) => any
): EmitterSubscription {
  return dp3tEmitter.addListener(Dp3tStatusUpdated, status =>
    listener(convertStatus(status))
  );
}

export async function requestPermissions(rationale?: Rationale) {
  if (Platform.OS === 'android') {
    await Dp3t.checkBatteryOptimizationDeactivated();
    return await PermissionsAndroid.request(
      'android.permission.ACCESS_FINE_LOCATION',
      rationale
    );
  }
  return undefined;
}

/**
 * Listens to the status of the DP3T service.
 *
 * @return `null`: The status is loading, `false` The service is not initialized, the status otherwise.
 *   If `false` you need to initialize the service with one of the init* methods.
 */
export function useDp3tStatus(): [
  null | false | Error | TracingStatus,
  () => void
] {
  const [initialized, setInitialized] = useState(false);
  const [status, setStatus] = useState<TracingStatus | null>(null);

  useEffect(function checkInitialized() {
    isInitialized().then(setInitialized);
  }, []);

  const refreshStatus = useCallback(
    function refreshStatus() {
      if (initialized) {
        setStatus(null);
        currentTracingStatus().then(setStatus, setStatus);
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
