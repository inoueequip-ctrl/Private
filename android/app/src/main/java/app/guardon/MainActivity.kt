package app.guardon

import android.annotation.SuppressLint
import android.app.Activity
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
        if (savedInstanceState == null) web.loadUrl("file:///android_asset/index.html")
        else web.restoreState(savedInstanceState)
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        web.saveState(outState)
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
