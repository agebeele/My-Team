package com.dreamteam.app

import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.webkit.JavascriptInterface
import android.widget.Toast

/**
 * Native Android Bridge exposed to the WebView JavaScript environment as `window.AndroidNativeBridge`.
 * Enables seamless communication between the app and native Android hardware features,
 * USB debugging notifications, and stories sharing.
 */
class AndroidBridge(
    private val context: Context,
    private val activity: MainActivity
) {

    @JavascriptInterface
    fun isNativeAndroid(): Boolean {
        return true
    }

    @JavascriptInterface
    fun getUsbDebugStatus(): String {
        return "USB_DEBUG_ENABLED_API_34"
    }

    @JavascriptInterface
    fun showToast(message: String) {
        activity.runOnUiThread {
            Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
        }
    }

    @JavascriptInterface
    fun vibrateDevice(milliseconds: Long) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
                vibratorManager?.defaultVibrator?.vibrate(
                    VibrationEffect.createOneShot(milliseconds, VibrationEffect.DEFAULT_AMPLITUDE)
                )
            } else {
                @Suppress("DEPRECATION")
                val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator?.vibrate(
                        VibrationEffect.createOneShot(milliseconds, VibrationEffect.DEFAULT_AMPLITUDE)
                    )
                } else {
                    @Suppress("DEPRECATION")
                    vibrator?.vibrate(milliseconds)
                }
            }
        } catch (_: Exception) {
            // Safe fallback
        }
    }

    @JavascriptInterface
    fun shareStoryNative(title: String, caption: String, imageUrl: String) {
        activity.runOnUiThread {
            val sendIntent = Intent().apply {
                action = Intent.ACTION_SEND
                putExtra(Intent.EXTRA_TITLE, title)
                putExtra(Intent.EXTRA_TEXT, "$title\n$caption\n#DreamTeam #Futbol7")
                type = "text/plain"
            }
            val shareIntent = Intent.createChooser(sendIntent, "Compartir en Historias...")
            activity.startActivity(shareIntent)
        }
    }
}
