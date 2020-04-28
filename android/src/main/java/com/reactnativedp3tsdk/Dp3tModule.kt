package com.reactnativedp3tsdk

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
import org.dpppt.android.sdk.InfectionStatus
import org.dpppt.android.sdk.TracingStatus
import org.dpppt.android.sdk.backend.ResponseCallback
import org.dpppt.android.sdk.backend.models.ApplicationInfo
import org.dpppt.android.sdk.backend.models.ExposeeAuthMethodAuthorization
import org.dpppt.android.sdk.internal.database.Database
import java.util.*
import kotlin.concurrent.thread

class Dp3tModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  private var updateIntentReceiverRegistered = false
  private var initialized = false
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

  private fun toJSStatus(context: Context, status: TracingStatus): WritableMap {
    val map = Arguments.createMap()
    val database = Database(context)

    val tracingState = if (status.errors.isNotEmpty()) "error" else if (status.isReceiving) "started" else "stopped"
    val healthStatus = if (status.infectionStatus == InfectionStatus.EXPOSED) "exposed" else if (status.infectionStatus == InfectionStatus.INFECTED) "infected" else "healthy"

    map.putString("tracingState", tracingState)
    map.putInt("numberOfHandshakes", database.handshakes.size)
    map.putInt("numberOfContacts", status.numberOfContacts)
    map.putString("healthStatus", healthStatus)

    if (status.lastSyncDate > 0) {
      map.putString("lastSyncDate", status.lastSyncDate.toString(10))
    }

    val errors = Arguments.createArray();
    val nativeErrors = Arguments.createArray()
    status.errors.forEach {
      nativeErrors.pushString(it.name)
      when (it) {
        TracingStatus.ErrorState.BLE_DISABLED -> errors.pushString("bluetoothDisabled")
        TracingStatus.ErrorState.MISSING_LOCATION_PERMISSION, TracingStatus.ErrorState.BATTERY_OPTIMIZER_ENABLED -> errors.pushString("permissionMissing")
        TracingStatus.ErrorState.NETWORK_ERROR_WHILE_SYNCING -> errors.pushString("sync")
        else -> errors.pushString("other")
      }
    }
    map.putArray("errors", errors)
    map.putArray("nativeErrors", nativeErrors)

    val matchedContacts = Arguments.createArray()
    status.matchedContacts.forEach() {
      val contact = Arguments.createMap()
      contact.putInt("id", it.id)
      contact.putString("reportDate", it.reportDate.toString(10))
      matchedContacts.pushMap(contact)
    }

    map.putArray("matchedContacts", matchedContacts)

    return map
  }

  // See https://facebook.github.io/react-native/docs/native-modules-android
  @ReactMethod
  fun isInitialized(promise: Promise) {
    promise.resolve(initialized);
  }

  @ReactMethod
  fun initWithDiscovery(backendAppId: String, dev: Boolean, promise: Promise) {
    try {
      registerUpdateIntentReceiver()
      DP3T.init(reactApplicationContext.applicationContext, backendAppId, dev)

      initialized = true
      promise.resolve(null)
    } catch (throwable: Throwable) {
      promise.reject(throwable);
    }
  }

  @ReactMethod
  fun initManually(backendAppId: String, reportBaseUrl: String, bucketBaseUrl: String, promise: Promise) {
    try {
      registerUpdateIntentReceiver()
      DP3T.init(reactApplicationContext.applicationContext, ApplicationInfo(backendAppId, reportBaseUrl, bucketBaseUrl))

      initialized = true
      promise.resolve(null)
    } catch (throwable: Throwable) {
      promise.reject(throwable);
    }
  }

  @ReactMethod
  @SuppressLint("BatteryLife") // Reason for using intent Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS is explained in module's Readme
  public fun checkBatteryOptimizationDeactivated(promise: Promise) {
    try {
      val powerManager = reactApplicationContext.getSystemService(Context.POWER_SERVICE) as PowerManager
      val batteryOptimizationDeactivated = powerManager.isIgnoringBatteryOptimizations(reactApplicationContext.packageName)

      if (!batteryOptimizationDeactivated) {
        val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
          Uri.parse("package:" + reactApplicationContext.packageName))
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        reactApplicationContext.startActivity(intent)
      }
      promise.resolve(null)
    } catch (throwable: Throwable) {
      promise.reject(throwable)
    }
  }

  private fun registerUpdateIntentReceiver() {
    if (!updateIntentReceiverRegistered) {
      reactApplicationContext.registerReceiver(object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
          reactApplicationContext
            .getJSModule(RCTDeviceEventEmitter::class.java)
            .emit("Dp3tStatusUpdated", toJSStatus(reactApplicationContext.applicationContext, DP3T.getStatus(reactApplicationContext.applicationContext)))
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

      promise.resolve(toJSStatus(reactApplicationContext.applicationContext, status))
    } catch (throwable: Throwable) {
      promise.reject(throwable)
    }
  }

  @ReactMethod
  fun sendIAmInfected(timestamp: String, authString: String, promise: Promise) {
    try {
      val timestampLong = timestamp.toLong(10);
      val date = Date(timestampLong)

      DP3T.sendIAmInfected(reactApplicationContext, date, ExposeeAuthMethodAuthorization(authString), object : ResponseCallback<Void?> {
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
