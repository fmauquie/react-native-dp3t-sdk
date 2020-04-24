import {
  EmitterSubscription,
  NativeEventEmitter,
  NativeModules,
  Platform,
} from 'react-native';
import { useEffect, useState } from 'react';

const Dp3t = NativeModules.Dp3t;
const dp3tEmitter = new NativeEventEmitter(Dp3t);

export const errorStates = {};
export const Dp3tStatusUpdated = 'Dp3tStatusUpdated' as const;

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

export async function start(): Promise<void> {
  return Dp3t.start();
}

export async function stop(): Promise<void> {
  return Dp3t.stop();
}

export async function currentTracingStatus(): Promise<any> {
  return Dp3t.currentTracingStatus();
}

export async function sendIWasExposed(
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

export async function sync(): Promise<boolean> {
  return Dp3t.sync();
}

export async function clearData(): Promise<void> {
  return Dp3t.clearData();
}

export function addStatusUpdatedListener(
  listener: (status: any) => any // FIXME: any
): EmitterSubscription {
  return dp3tEmitter.addListener(Dp3t.Dp3tStatusUpdated, listener);
}

export function useDp3tStatusUpdates(): any /* FIXME any */ {
  const [status, setStatus] = useState(null);

  useEffect(function registerDp3tEventListener() {
    currentTracingStatus().then(setStatus, setStatus);
    const subscription = addStatusUpdatedListener(setStatus);

    return function clearDp3tEventListener() {
      subscription.remove();
    };
  }, []);

  return status;
}
