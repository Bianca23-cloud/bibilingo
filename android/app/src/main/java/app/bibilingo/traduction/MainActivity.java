package app.bibilingo.traduction;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.speech.tts.TextToSpeech;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.webkit.WebViewAssetLoader;

import com.google.mlkit.common.model.DownloadConditions;
import com.google.mlkit.common.model.RemoteModelManager;
import com.google.mlkit.nl.translate.TranslateLanguage;
import com.google.mlkit.nl.translate.TranslateRemoteModel;
import com.google.mlkit.nl.translate.Translation;
import com.google.mlkit.nl.translate.Translator;
import com.google.mlkit.nl.translate.TranslatorOptions;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Bibilingo – traduction automatique.
 * L'interface (HTML/CSS/JS) est embarquée dans l'application ; ce code Java lui donne accès,
 * sans internet, à la traduction (Google ML Kit), au micro (SpeechRecognizer) et à la voix (TextToSpeech).
 */
public class MainActivity extends Activity implements TextToSpeech.OnInitListener {

    private static final String ORIGIN = "https://appassets.androidplatform.net";
    private static final String START = ORIGIN + "/assets/www/index.html";
    private static final int REQ_MIC = 42;
    /** Langues proposées : roumain, français + 10 langues cibles (codes ML Kit). */
    private static final String[] LANGS = {"ro", "fr", "en", "pt", "it", "es", "el", "de", "ru", "ja", "zh", "nl"};

    private WebView web;
    private WebViewAssetLoader loader;
    private TextToSpeech tts;
    private boolean ttsReady = false;
    private SpeechRecognizer recognizer;
    private final Handler ui = new Handler(Looper.getMainLooper());
    private final Map<String, Translator> translators = new HashMap<>();
    private String pendingListenLang = null;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setMediaPlaybackRequiresUserGesture(false);
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return loader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri u = request.getUrl();
                if (ORIGIN.equals(u.getScheme() + "://" + u.getHost())) return false;
                // Liens externes (ex. Google Traduction) : ouverts dans le navigateur, jamais dans l'appli.
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception ignored) { }
                return true;
            }
        });
        web.addJavascriptInterface(new Bridge(), "BibiNative");
        setContentView(web);
        web.loadUrl(START);

        tts = new TextToSpeech(this, this);
    }

    @Override
    public void onInit(int status) { ttsReady = status == TextToSpeech.SUCCESS; }

    @Override
    public void onBackPressed() {
        if (web != null && web.canGoBack()) web.goBack(); else super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        for (Translator t : translators.values()) t.close();
        if (tts != null) tts.shutdown();
        if (recognizer != null) recognizer.destroy();
        if (web != null) web.destroy();
        super.onDestroy();
    }

    /* ---------- renvoi des résultats vers JavaScript ---------- */
    private void callback(String id, boolean ok, String data) {
        final String js = "window.BibiBridge&&BibiBridge.cb(" + JSONObject.quote(id) + "," + ok + ","
                + JSONObject.quote(data == null ? "" : data) + ")";
        ui.post(() -> { if (web != null) web.evaluateJavascript(js, null); });
    }

    private void listenEvent(String type, String text) {
        try {
            JSONObject o = new JSONObject();
            o.put("type", type);
            o.put("text", text == null ? "" : text);
            callback("listen", true, o.toString());
        } catch (Exception ignored) { }
    }

    private Translator translatorFor(String src, String tgt) {
        String key = src + ">" + tgt;
        Translator t = translators.get(key);
        if (t == null) {
            t = Translation.getClient(new TranslatorOptions.Builder()
                    .setSourceLanguage(src).setTargetLanguage(tgt).build());
            translators.put(key, t);
        }
        return t;
    }

    /* ---------- micro ---------- */
    private void startListening(String langTag) { startListening(langTag, false); }

    /** standard = true : micro classique du téléphone (si la langue hors ligne n'est pas installée). */
    private void startListening(String langTag, boolean standard) {
        if (!SpeechRecognizer.isRecognitionAvailable(this)) {
            listenEvent("error", "no-recognizer");
            return;
        }
        if (recognizer != null) recognizer.destroy();
        boolean onDevice = !standard && Build.VERSION.SDK_INT >= 31 && SpeechRecognizer.isOnDeviceRecognitionAvailable(this);
        recognizer = onDevice ? SpeechRecognizer.createOnDeviceSpeechRecognizer(this)
                : SpeechRecognizer.createSpeechRecognizer(this);
        Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, langTag);
        i.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
        i.putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true);
        i.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
        recognizer.setRecognitionListener(new RecognitionListener() {
            @Override public void onReadyForSpeech(Bundle b) { listenEvent(onDevice ? "ready-local" : "ready", ""); }
            @Override public void onBeginningOfSpeech() { }
            @Override public void onRmsChanged(float v) { }
            @Override public void onBufferReceived(byte[] b) { }
            @Override public void onEndOfSpeech() { }
            @Override public void onEvent(int t, Bundle b) { }
            @Override public void onError(int error) {
                if (onDevice && (error == 12 || error == 13)) {
                    // Langue hors ligne absente : on demande son téléchargement, puis on passe au micro classique.
                    if (Build.VERSION.SDK_INT >= 33) {
                        try { recognizer.triggerModelDownload(i); } catch (Exception ignored) { }
                    }
                    listenEvent("info", "fallback");
                    ui.post(() -> startListening(langTag, true));
                    return;
                }
                String e;
                switch (error) {
                    case SpeechRecognizer.ERROR_NO_MATCH:
                    case SpeechRecognizer.ERROR_SPEECH_TIMEOUT: e = "no-speech"; break;
                    case SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS: e = "not-allowed"; break;
                    case SpeechRecognizer.ERROR_NETWORK:
                    case SpeechRecognizer.ERROR_NETWORK_TIMEOUT: e = "network"; break;
                    case 12: /* ERROR_LANGUAGE_NOT_SUPPORTED */
                    case 13: /* ERROR_LANGUAGE_UNAVAILABLE */ e = "language-unavailable"; break;
                    default: e = "error-" + error;
                }
                listenEvent("error", e);
                listenEvent("end", "");
            }
            @Override public void onPartialResults(Bundle b) { listenEvent("partial", first(b)); }
            @Override public void onResults(Bundle b) { listenEvent("final", first(b)); listenEvent("end", ""); }
        });
        recognizer.startListening(i);
    }

    private static String first(Bundle b) {
        ArrayList<String> r = b == null ? null : b.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
        return (r == null || r.isEmpty()) ? "" : r.get(0);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(requestCode, permissions, results);
        if (requestCode == REQ_MIC) {
            if (results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED && pendingListenLang != null) {
                startListening(pendingListenLang);
            } else {
                listenEvent("error", "not-allowed");
                listenEvent("end", "");
            }
            pendingListenLang = null;
        }
    }

    /** Méthodes accessibles depuis JavaScript sous le nom window.BibiNative. */
    public class Bridge {

        @JavascriptInterface
        public String info() {
            try {
                JSONObject o = new JSONObject();
                o.put("native", true);
                o.put("version", "1.0.3");
                o.put("onDeviceSpeech", Build.VERSION.SDK_INT >= 31
                        && SpeechRecognizer.isOnDeviceRecognitionAvailable(MainActivity.this));
                return o.toString();
            } catch (Exception e) { return "{}"; }
        }

        @JavascriptInterface
        public void translate(String id, String text, String src, String tgt) {
            String s = TranslateLanguage.fromLanguageTag(src), t = TranslateLanguage.fromLanguageTag(tgt);
            if (s == null || t == null || text == null || text.length() > 2000) { callback(id, false, "unsupported"); return; }
            ui.post(() -> {
                Translator tr = translatorFor(s, t);
                tr.downloadModelIfNeeded(new DownloadConditions.Builder().build())
                        .continueWithTask(task -> {
                            if (!task.isSuccessful()) throw (task.getException() != null ? task.getException() : new Exception("download"));
                            return tr.translate(text);
                        })
                        .addOnSuccessListener(out -> callback(id, true, out))
                        .addOnFailureListener(e -> callback(id, false, "model-missing"));
            });
        }

        @JavascriptInterface
        public void downloadAll(String id, boolean wifiOnly) {
            ui.post(() -> {
                RemoteModelManager mm = RemoteModelManager.getInstance();
                DownloadConditions.Builder c = new DownloadConditions.Builder();
                if (wifiOnly) c.requireWifi();
                DownloadConditions cond = c.build();
                List<String> todo = new ArrayList<>();
                for (String l : LANGS) if (!"en".equals(l)) todo.add(l); // l'anglais est toujours présent
                final int[] done = {0};
                final int[] failed = {0};
                for (String l : todo) {
                    mm.download(new TranslateRemoteModel.Builder(l).build(), cond)
                            .addOnCompleteListener(task -> {
                                done[0]++;
                                if (!task.isSuccessful()) failed[0]++;
                                callback(id + ":progress", true, done[0] + "/" + todo.size());
                                if (done[0] == todo.size()) callback(id, failed[0] == 0, failed[0] + "");
                            });
                }
            });
        }

        @JavascriptInterface
        public void listModels(String id) {
            ui.post(() -> RemoteModelManager.getInstance().getDownloadedModels(TranslateRemoteModel.class)
                    .addOnSuccessListener(models -> {
                        JSONArray a = new JSONArray();
                        for (TranslateRemoteModel m : models) a.put(m.getLanguage());
                        callback(id, true, a.toString());
                    })
                    .addOnFailureListener(e -> callback(id, false, "[]")));
        }

        @JavascriptInterface
        public void speak(String text, String langTag, float rate) {
            ui.post(() -> {
                if (!ttsReady || text == null) return;
                tts.setLanguage(Locale.forLanguageTag(langTag));
                tts.setSpeechRate(Math.max(0.4f, Math.min(rate, 1.6f)));
                tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "bibi");
            });
        }

        @JavascriptInterface
        public boolean hasVoice(String langTag) {
            if (!ttsReady) return false;
            return tts.isLanguageAvailable(Locale.forLanguageTag(langTag)) >= TextToSpeech.LANG_AVAILABLE;
        }

        @JavascriptInterface
        public void listen(String langTag) {
            ui.post(() -> {
                if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                    pendingListenLang = langTag;
                    requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, REQ_MIC);
                } else {
                    startListening(langTag);
                }
            });
        }

        @JavascriptInterface
        public void stopListening() {
            ui.post(() -> { if (recognizer != null) recognizer.stopListening(); });
        }

        @JavascriptInterface
        public void openVoiceSettings() {
            ui.post(() -> {
                try {
                    Intent i = new Intent("com.android.settings.TTS_SETTINGS");
                    i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(i);
                } catch (Exception ignored) { }
            });
        }
    }
}
