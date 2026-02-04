package io.ionic.starter;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // WebView debugging deshabilitado en producción por seguridad
        // Para habilitar durante desarrollo, descomentar la siguiente línea:
        // WebView.setWebContentsDebuggingEnabled(true);
    }
}
