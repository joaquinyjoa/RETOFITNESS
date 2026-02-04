# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Capacitor WebView requires these rules
-keepclassmembers class fqcn.of.javascript.interface.for.webview {
   public *;
}

# Keep Capacitor Bridge classes
-keep class com.getcapacitor.** { *; }
-keepclassmembers class com.getcapacitor.** { *; }

# Keep WebView debugging info for production troubleshooting
-keepattributes SourceFile,LineNumberTable

# Keep line numbers for crash reports
-keepattributes *Annotation*

# Ionic/Angular specific
-keep class org.apache.cordova.** { *; }
-keep class com.ionicframework.** { *; }

# Hide original source file name for security
-renamesourcefileattribute SourceFile
