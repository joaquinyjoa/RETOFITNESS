package io.ionic.starter;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Habilitar debugging de WebView para Chrome DevTools
        WebView.setWebContentsDebuggingEnabled(true);
    }
}
