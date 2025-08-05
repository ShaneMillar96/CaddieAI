package com.caddieaimobile

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.google.android.gms.maps.MapsInitializer
import com.google.android.gms.maps.OnMapsSdkInitializedCallback
import com.google.android.gms.common.GoogleApiAvailability
import com.google.android.gms.common.ConnectionResult
import android.util.Log

class MainActivity : ReactActivity(), OnMapsSdkInitializedCallback {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "CaddieAIMobile"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    
    // Check Google Play Services availability first
    val googleApiAvailability = GoogleApiAvailability.getInstance()
    val resultCode = googleApiAvailability.isGooglePlayServicesAvailable(this)
    
    when (resultCode) {
      ConnectionResult.SUCCESS -> {
        Log.d("MainActivity", "Google Play Services available - initializing Maps SDK")
        initializeGoogleMaps()
      }
      ConnectionResult.SERVICE_VERSION_UPDATE_REQUIRED,
      ConnectionResult.SERVICE_UPDATING -> {
        Log.w("MainActivity", "Google Play Services needs update - attempting to make available")
        googleApiAvailability.makeGooglePlayServicesAvailable(this)
          .addOnSuccessListener {
            Log.d("MainActivity", "Google Play Services updated successfully")
            initializeGoogleMaps()
          }
          .addOnFailureListener { exception ->
            Log.e("MainActivity", "Failed to update Google Play Services", exception)
          }
      }
      else -> {
        Log.e("MainActivity", "Google Play Services not available: $resultCode")
        if (googleApiAvailability.isUserResolvableError(resultCode)) {
          Log.d("MainActivity", "User can resolve Google Play Services issue")
        }
      }
    }
  }
  
  private fun initializeGoogleMaps() {
    try {
      MapsInitializer.initialize(applicationContext, MapsInitializer.Renderer.LATEST, this)
      Log.d("MainActivity", "Google Maps SDK initialization started")
    } catch (e: Exception) {
      Log.e("MainActivity", "Failed to initialize Google Maps SDK", e)
    }
  }

  override fun onMapsSdkInitialized(renderer: MapsInitializer.Renderer) {
    when (renderer) {
      MapsInitializer.Renderer.LATEST -> Log.d("MainActivity", "Google Maps SDK initialized with latest renderer")
      MapsInitializer.Renderer.LEGACY -> Log.d("MainActivity", "Google Maps SDK initialized with legacy renderer") 
    }
  }
}
