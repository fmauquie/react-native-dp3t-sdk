import Foundation
import DP3TSDK

@objc(Dp3t)
class Dp3t: RCTEventEmitter, DP3TTracingDelegate {
    var initialized: Bool = false
    var observing: Bool = false
    
    override func supportedEvents() -> [String]! {
      return ["Dp3tStatusUpdated"]
    }
    
    override func constantsToExport() -> [AnyHashable : Any]! {
      return [
        "errorStates": [],
        "Dp3tStatusUpdated": "Dp3tStatusUpdated"
      ]
    }
    
    override static func requiresMainQueueSetup() -> Bool {
      return true
    }
    
    override func startObserving() -> Void {
        observing = true
    }
    
    func DP3TTracingStateChanged(_ state: TracingState) {
        if (observing) {
            sendEvent(withName: "Dp3tStatusUpdated", body: toJSStatus(state))
        }
    }
    
    override func stopObserving() -> Void {
        observing = false
    }
    
    func toJSStatus(_ state: TracingState) -> [AnyHashable : Any]! {
        var errors: [String] = []
        var nativeErrors: [String] = []
        var nativeErrorArg: Any? = nil
        var tracingState = ""
        switch state.trackingState {
        case .active:
            tracingState = "started"
        case .stopped:
            tracingState = "stopped"
        case let .inactive(error):
            tracingState = "error"
            nativeErrors.append(error.localizedDescription)
            switch error {
            case .bluetoothTurnedOff:
                errors.append("bluetoothDisabled")
            case .permissonError:
                errors.append("permissionMissing")
            case let .caseSynchronizationError(syncError):
                nativeErrorArg = syncError
                errors.append("sync")
            case let .networkingError(netError):
                nativeErrorArg = netError
                errors.append("sync")
            case let .timeInconsistency(shift):
                nativeErrorArg = String(format: "%d", shift)
                errors.append("sync")
            case let .cryptographyError(cError):
                nativeErrorArg = cError
                errors.append("other")
            case let .databaseError(dError):
                nativeErrorArg = dError
                errors.append("other")
            case .jwtSignitureError:
                errors.append("other")
            }
        }
        
        var healthStatus = ""
        var nativeStatusArg: Int? = nil
        switch state.infectionStatus {
        case .healthy:
            healthStatus = "healthy"
        case .infected:
            healthStatus = "infected"
        case let .exposed(days):
            healthStatus = "exposed"
            nativeStatusArg = days.count
        }
        
        var res = [
            "tracingState": tracingState,
            "numberOfContacts": state.numberOfContacts,
            "healthStatus": healthStatus,
            "errors": errors,
            "nativeErrors": nativeErrors
        ] as [String : Any]
        if (state.lastSync != nil) {
            res["lastSyncDate"] = (state.lastSync!.timeIntervalSince1970 * 1000).description
        }
        if (nativeErrorArg != nil) {
            res["nativeErrorArg"] = nativeErrorArg
        }
        if (nativeStatusArg != nil) {
            res["nativeStatusArg"] = nativeStatusArg
        }
        
        return res
    }
    
    @objc
    func isInitialized(_ resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
        resolve(initialized);
    }
    
    @objc
    func initWithDiscovery(_ backendAppId: String, dev: Bool, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        do {
            try DP3TTracing.initialize(with: .discovery(backendAppId, enviroment: dev ? .dev : .prod))
            initialized = true
            DP3TTracing.delegate = self
            resolve(nil)
        } catch {
            reject("DP3TError", "DP3TError in initWithDiscovery", error)
        }
    }

    @objc
    func initManually(_ backendAppId: String, reportBaseUrl: String, bucketBaseUrl: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        do {
            let reportUrl = URL(string: reportBaseUrl)!
            let bucketUrl = URL(string: bucketBaseUrl)!
            try DP3TTracing.initialize(with: .manual(.init(appId: backendAppId, bucketBaseUrl: bucketUrl, reportBaseUrl: reportUrl, jwtPublicKey: nil)))
            initialized = true
            DP3TTracing.delegate = self
            resolve(nil)
        } catch {
            reject("DP3TError", "DP3TError in initManually", error)
        }
    }

    @objc
    func start(_ resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
        guard initialized else {
            reject("DP3TNotInitialized", "DP3T was not initialized.", nil)
            return
        }
        
        do {
            try DP3TTracing.startTracing()
            resolve(nil)
        } catch {
            reject("DP3TError", "DP3TError in start", error)
        }
    }

    @objc
    func stop(_ resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
        guard initialized else {
            reject("DP3TNotInitialized", "DP3T was not initialized.", nil)
            return
        }
        
        DP3TTracing.stopTracing()
        resolve(nil)
    }
    
    @objc
    func currentTracingStatus(_ resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
        guard initialized else {
            reject("DP3TNotInitialized", "DP3T was not initialized.", nil)
            return
        }
        
        DP3TTracing.status { result in
            switch result {
            case let .success(state):
                resolve(toJSStatus(state))
            case let .failure(error):
                reject("DP3TError", "Failed to get currentTracingStatus", error)
            }
        }
    }
    
    @objc
    func sendIAmInfected(_ onset: Date, authString: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        guard initialized else {
            reject("DP3TNotInitialized", "DP3T was not initialized.", nil)
            return
        }
        
        DP3TTracing.iWasExposed(onset: onset, authentication: .HTTPAuthorizationBearer(token: authString)) { result in
            switch result {
            case .success:
                resolve(nil)
            case let .failure(error):
                reject("DP3TError", "Failed to sendIWasExposed", error)
            }
        }
    }
    
    @objc
    func sync(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        DP3TTracing.sync { result in
            switch result {
            case .success:
                resolve(nil)
            case let .failure(error):
                print(error)
                reject("DP3TError", "Failed to sync", error)
            }
        }
    }
    
    @objc
    func clearData(_ resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
        guard initialized else {
            reject("DP3TNotInitialized", "DP3T was not initialized.", nil)
            return
        }
        
        do {
            try DP3TTracing.reset()
            resolve(nil)
        } catch {
            reject("DP3TError", "DP3TError in clearData", error)
        }
    }
}
