#import <React/RCTBridgeModule.h>
#import "React/RCTEventEmitter.h"

@interface RCT_EXTERN_MODULE(Dp3t, RCTEventEmitter)

RCT_EXTERN_METHOD(
                  initWithDiscovery: (NSString)backendAppId
                  dev: (NSBoolean) dev
                  resolve: (RCTPromiseResolveBlock)resolve
                  reject: (RCTPromiseRejectBlock)reject
                  )

RCT_EXTERN_METHOD(
                  initManually: (NSString)backendAppId
                  backendBaseUrl: (NSString) backendBaseUrl
                  resolve: (RCTPromiseResolveBlock)resolve
                  reject: (RCTPromiseRejectBlock)reject
                  )

RCT_EXTERN_METHOD(
                  start: (RCTPromiseResolveBlock)resolve
                  reject: (RCTPromiseRejectBlock)reject
                  )

RCT_EXTERN_METHOD(
                  stop: (RCTPromiseResolveBlock)resolve
                  reject: (RCTPromiseRejectBlock)reject
                  )

RCT_EXTERN_METHOD(
                  currentTracingStatus: (RCTPromiseResolveBlock)resolve
                  reject: (RCTPromiseRejectBlock)reject
                  )

RCT_EXTERN_METHOD(
                  sendIWasExposed: (NSDate)onset
                  authString: (NSString)authString
                  resolve: (RCTPromiseResolveBlock)resolve
                  reject: (RCTPromiseRejectBlock)reject
                  )

RCT_EXTERN_METHOD(
                  clearData: (RCTPromiseResolveBlock)resolve
                  reject: (RCTPromiseRejectBlock)reject
                  )

@end
