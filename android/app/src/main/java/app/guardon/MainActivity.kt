package app.guardon

import android.annotation.SuppressLint
import android.Manifest
import android.app.Activity
import android.content.pm.PackageManager
import android.os.Build
import android.graphics.Color
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebView

class MainActivity : Activity() {

    private lateinit var web: WebView

    /** index.html の save() から呼ばれ、ウィジェット用に状態を共有する */
    inner class Bridge {
        @JavascriptInterface
        fun save(json: String) {
            Pet.saveRaw(applicationContext, json)
            PetWidget.refresh(applicationContext)
        }

        /** ウィジェットで変わった最新状態をWeb側に渡す */
        @JavascriptInterface
        fun load(): String = Pet.loadRaw(applicationContext) ?: ""
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        web = WebView(this).apply {
            setBackgroundColor(Color.parseColor("#0B1020"))
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            // 同梱のローカルHTMLだけを開く。外部ページは読み込まない。
            settings.allowFileAccess = true
            settings.allowContentAccess = false
            addJavascriptInterface(Bridge(), "GuardonBridge")
        }
        setContentView(web)
        askNotificationPermission()
        Reminder.schedule(this)
        if (savedInstanceState == null) web.loadUrl("file:///android_asset/index.html")
        else web.restoreState(savedInstanceState)
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        web.saveState(outState)
    }

    override fun onResume() {
        super.onResume()
        // ウィジェットで餌をあげた場合などに備え、最新状態を取り込み直す
        if (::web.isInitialized) web.evaluateJavascript("window.guardonReload && window.guardonReload()", null)
    }

    private fun askNotificationPermission() {
        if (Build.VERSION.SDK_INT >= 33 &&
            checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 1)
    }

    override fun onPause() {
        super.onPause()
        PetWidget.refresh(applicationContext)
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (web.canGoBack()) web.goBack() else super.onBackPressed()
    }
}
