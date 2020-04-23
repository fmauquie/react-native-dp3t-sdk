package com.reactnativedp3t

import android.annotation.SuppressLint
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.PowerManager
import android.provider.Settings
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter
import org.dpppt.android.sdk.DP3T
import org.dpppt.android.sdk.TracingStatus
import org.dpppt.android.sdk.internal.backend.CallbackListener
import org.dpppt.android.sdk.internal.backend.models.ApplicationInfo
import org.dpppt.android.sdk.internal.backend.models.ExposeeAuthData
import java.util.*
import kotlin.concurrent.thread

class Dp3tModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  private var updateIntentReceiverRegistered = true
  private var syncThread: Thread? = null

  override fun getName(): String {
    return "Dp3t"
  }

  override fun getConstants(): MutableMap<String, Any> {
    val constants: MutableMap<String, Any> = HashMap()
    val errorStates = Arguments.createMap();
    TracingStatus.ErrorState.values().forEach {
      errorStates.putString(it.name, it.name)
    }
    constants["errorStates"] = errorStates
    constants["Dp3tStatusUpdated"] = "Dp3tStatusUpdated"
    return constants
  }

  // See https://facebook.github.io/react-native/docs/native-modules-android
  @ReactMethod
  fun initWithDiscovery(backendAppId: String, dev: Boolean, promise: Promise) {
    try {
      checkBatteryOptimizationDeactivated()

      DP3T.init(reactApplicationContext.applicationContext, backendAppId, dev)

      registerUpdateIntentReceiver();

      promise.resolve(null)
    } catch (throwable: Throwable) {
      promise.reject(throwable);
    }
  }

  @ReactMethod
  fun initManually(backendAppId: String, backendBaseUrl: String, promise: Promise) {
    try {
      checkBatteryOptimizationDeactivated()

      DP3T.init(reactApplicationContext.applicationContext, ApplicationInfo(backendAppId, backendBaseUrl))

      registerUpdateIntentReceiver();

      promise.resolve(null)
    } catch (throwable: Throwable) {
      promise.reject(throwable);
    }
  }

  @SuppressLint("BatteryLife") // Reason for using intent Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS is explained in module's Readme
  private fun checkBatteryOptimizationDeactivated() {
    val powerManager = reactApplicationContext.getSystemService(Context.POWER_SERVICE) as PowerManager
    val batteryOptimizationDeactivated = powerManager.isIgnoringBatteryOptimizations(reactApplicationContext.packageName)

    if (!batteryOptimizationDeactivated) {
      reactApplicationContext.startActivity(Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
        Uri.parse("package:" + reactApplicationContext.packageName)))
    }
  }

  private fun registerUpdateIntentReceiver() {
    if (!updateIntentReceiverRegistered) {
      reactApplicationContext.registerReceiver(object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
          reactApplicationContext
            .getJSModule(RCTDeviceEventEmitter::class.java)
            .emit("Dp3tStatusUpdated", null)
        }
      }, DP3T.getUpdateIntentFilter())
      updateIntentReceiverRegistered = true
    }
  }

  @ReactMethod
  fun start(promise: Promise) {
    try {
      DP3T.start(reactApplicationContext.applicationContext)
      promise.resolve(null);
    } catch (throwable: Throwable) {
      promise.reject(throwable);
    }
  }

  @ReactMethod
  fun stop(promise: Promise) {
    try {
      DP3T.stop(reactApplicationContext.applicationContext)
      promise.resolve(null);
    } catch (throwable: Throwable) {
      promise.reject(throwable);
    }
  }

  @ReactMethod
  fun currentTracingStatus(promise: Promise) {
    try {
      val status = DP3T.getStatus(reactApplicationContext.applicationContext)

      val map = Arguments.createMap()

      map.putInt("numberOfHandshakes", status.numberOfHandshakes)
      map.putBoolean("advertising", status.isAdvertising)
      map.putBoolean("receiving", status.isReceiving)
      map.putBoolean("wasContactExposed", status.wasContactExposed())
      map.putString("lastSyncDate", status.lastSyncDate.toString(10))
      map.putBoolean("reportedAsExposed", status.isReportedAsExposed)

      val errors = Arguments.createArray();
      status.errors.forEach {
        errors.pushString(it.name)
      }
      map.putArray("errors", errors);

      promise.resolve(map)
    } catch (throwable: Throwable) {
      promise.reject(throwable)
    }
  }

  @ReactMethod
  fun sendIWasExposed(timestamp: String, authString: String, promise: Promise) {
    try {
      val timestampLong = timestamp.toLong(10);
      val date = Date(timestampLong)

      DP3T.sendIWasExposed(reactApplicationContext, date, ExposeeAuthData(authString), object : CallbackListener<Void?> {
        override fun onSuccess(response: Void?) {
          promise.resolve(null)
        }

        override fun onError(throwable: Throwable) {
          promise.reject(throwable)
        }
      })
    } catch (throwable: Throwable) {
      promise.reject(throwable);
    }
  }

  @ReactMethod
  fun sync(promise: Promise) {
    if (syncThread != null) {
      return promise.resolve(false);
    }
    syncThread = thread {
      try {
        DP3T.sync(reactApplicationContext);
        promise.resolve(true)
      } catch (throwable: Throwable) {
        promise.reject(throwable);
      } finally {
        syncThread = null
      }
    }
  }

  @ReactMethod
  fun clearData(promise: Promise) {
    try {
      DP3T.clearData(reactApplicationContext) { promise.resolve(null) }
    } catch (throwable: Throwable) {
      promise.reject(throwable)
    }
  }
}
