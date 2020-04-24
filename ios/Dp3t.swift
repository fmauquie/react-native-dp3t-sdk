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
        if (initialized) {
            DP3TTracing.delegate = self
        }
    }
    
    func DP3TTracingStateChanged(_ state: TracingState) {
        sendEvent(withName: "Dp3tStatusUpdated", body: state)
    }
    
    override func stopObserving() -> Void {
        observing = false
        if (initialized) {
            DP3TTracing.delegate = nil
        }
    }
    
    @objc
    func initWithDiscovery(_ backendAppId: String, dev: Bool, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        do {
            try DP3TTracing.initialize(with: .discovery(backendAppId, enviroment: dev ? .dev : .prod))
            resolve(nil)
            initialized = true
            if (observing) {
                DP3TTracing.delegate = self
            }
        } catch {
            reject("DP3TError", "DP3TError in initWithDiscovery", error)
        }
    }

    @objc
    func initManually(_ backendAppId: String, backendBaseUrl: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        do {
            let url = URL(string: backendBaseUrl)!
            try DP3TTracing.initialize(with: .manual(.init(appId: backendAppId, backendBaseUrl: url)))
            resolve(nil)
            initialized = true
            if (observing) {
                DP3TTracing.delegate = self
            }
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
    func currentTracingStatus(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        guard initialized else {
            reject("DP3TNotInitialized", "DP3T was not initialized.", nil)
            return
        }
        
        DP3TTracing.status { result in
            switch result {
            case let .success(state):
                resolve(state)
            case let .failure(error):
                reject("DP3TError", "Failed to get currentTracingStatus", error)
            }
        }
    }
    
    @objc
    func sendIWasExposed(_ onset: Date, authString: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        guard initialized else {
            reject("DP3TNotInitialized", "DP3T was not initialized.", nil)
            return
        }
        
        DP3TTracing.iWasExposed(onset: Date(), authString: "") { result in
            switch result {
            case .success:
                resolve(nil)
            case let .failure(error):
                reject("DP3TError", "Failed to sendIWasExposed", error)
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
