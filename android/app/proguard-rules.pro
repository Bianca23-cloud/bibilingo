# Garder les méthodes appelées depuis JavaScript
-keepclassmembers class app.bibilingo.traduction.MainActivity$Bridge {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes JavascriptInterface
