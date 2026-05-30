#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// Define the plugin methods that will be accessible to JavaScript
CAP_PLUGIN(ProximityReaderPlugin, "ProximityReader",
           CAP_PLUGIN_METHOD(checkAvailability, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(startScanning, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(stopScanning, CAPPluginReturnPromise);
)
