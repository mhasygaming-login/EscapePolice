package com.escapepolice.game

import android.annotation.SuppressLint
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.webkit.ConsoleMessage
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ProgressBar
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity

/**
 * MainActivity for Escape Police: Cyber Pursuit
 * High-performance Native Android WebView wrapper with:
 * - Full audio autoplay unblocking (mediaPlaybackRequiresUserGesture = false)
 * - Hardware acceleration & DOM storage enabled
 * - Immersive Fullscreen Sticky Mode
 * - Safe navigation & deep linking handling
 */
class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar
    private lateinit var offlineContainer: LinearLayout
    private lateinit var btnRetry: Button

    companion object {
        // Default production game URL (can be updated to your custom domain or local IP)
        const val DEFAULT_GAME_URL = "https://ais-dev-ohvu3ldljbu2zszu353vkc-311469337722.asia-southeast1.run.app"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        initViews()
        enableImmersiveFullscreen()
        setupWebView()
        setupBackNavigation()

        // Handle incoming deep link or load default game URL
        val targetUrl = intent?.dataString ?: DEFAULT_GAME_URL
        loadGameUrl(targetUrl)
    }

    private fun initViews() {
        webView = findViewById(R.id.webView)
        progressBar = findViewById(R.id.progressBar)
        offlineContainer = findViewById(R.id.offlineContainer)
        btnRetry = findViewById(R.id.btnRetry)

        btnRetry.setOnClickListener {
            offlineContainer.visibility = View.GONE
            webView.visibility = View.VISIBLE
            webView.reload()
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        webView.settings.apply {
            // 1. Core Web Execution
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true

            // 2. Audio & Media Autoplay (CRITICAL: enables instant engine rev SFX & synth audio without initial click)
            mediaPlaybackRequiresUserGesture = false

            // 3. Performance & Caching
            cacheMode = WebSettings.LOAD_DEFAULT
            setRenderPriority(WebSettings.RenderPriority.HIGH)

            // 4. Zoom & Viewport Discipline (Lock zoom for consistent canvas scaling)
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false
            useWideViewPort = true
            loadWithOverviewMode = true

            // 5. File & Asset Access
            allowFileAccess = true
            allowContentAccess = true

            // 6. Modern User-Agent App Identifier
            userAgentString = "$userAgentString EscapePoliceApp/2.5.0 Android"

            // 7. Mixed content compatibility if needed
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        }

        // Enable hardware acceleration layer on the WebView
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null)

        // WebChromeClient: Progress bar & Console message tracking
        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                if (newProgress < 100) {
                    progressBar.visibility = View.VISIBLE
                    progressBar.progress = newProgress
                } else {
                    progressBar.visibility = View.GONE
                }
            }

            override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                // Log JS errors for easy debugging via logcat
                return super.onConsoleMessage(consoleMessage)
            }
        }

        // WebViewClient: Intercept navigation & handle connection failures
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false

                // If external link (e.g., social share, external help docs), open in device browser
                if (!url.contains("run.app") && !url.contains("localhost") && !url.startsWith("file:///")) {
                    try {
                        val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                        startActivity(browserIntent)
                        return true
                    } catch (e: Exception) {
                        // Fallback: stay inside WebView
                    }
                }
                return false
            }

            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                offlineContainer.visibility = View.GONE
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
                // Show offline retry screen only for main frame navigation failures
                if (request?.isForMainFrame == true) {
                    webView.visibility = View.GONE
                    offlineContainer.visibility = View.VISIBLE
                }
            }
        }
    }

    private fun loadGameUrl(url: String) {
        offlineContainer.visibility = View.GONE
        webView.visibility = View.VISIBLE
        webView.loadUrl(url)
    }

    /**
     * Handles Android System Back Button:
     * - If WebView has internal history, navigates back
     * - If at the root lobby, presents a clean confirmation exit dialog
     */
    private fun setupBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    showExitDialog()
                }
            }
        })
    }

    private fun showExitDialog() {
        AlertDialog.Builder(this)
            .setTitle(R.string.exit_confirm_title)
            .setMessage(R.string.exit_confirm_message)
            .setPositiveButton(R.string.yes_text) { _, _ ->
                finish()
            }
            .setNegativeButton(R.string.cancel_text, null)
            .show()
    }

    /**
     * Immersive Sticky Fullscreen (Hides Status Bar & Navigation Bar for Pure Arcade Experience)
     */
    private fun enableImmersiveFullscreen() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.insetsController?.let { controller ->
                controller.hide(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())
                controller.systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            }
        } else {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_FULLSCREEN
            )
        }
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            enableImmersiveFullscreen()
        }
    }

    // Lifecycle Management for Clean Audio/Render Performance
    override fun onResume() {
        super.onResume()
        webView.onResume()
    }

    override fun onPause() {
        super.onPause()
        webView.onPause()
    }

    override fun onDestroy() {
        webView.apply {
            loadUrl("about:blank")
            clearHistory()
            removeAllViews()
            destroy()
        }
        super.onDestroy()
    }
}
