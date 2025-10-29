import { Injectable } from '@angular/core';

declare global {
  interface Window {
    gapi: any;
  }
}

@Injectable({
  providedIn: 'root'
})
export class GoogleDriveService {

  // 🔧 CONFIGURACIÓN REQUERIDA:
  // 1. Ve a: https://console.cloud.google.com/
  // 2. Crea un proyecto nuevo
  // 3. Habilita: Google Drive API y Google Picker API
  // 4. Crea credenciales OAuth 2.0 y API Key
  // 5. Reemplaza los valores de abajo con tus credenciales reales
  
  private CLIENT_ID = 'TU_CLIENT_ID.apps.googleusercontent.com'; // ⚠️ REEMPLAZAR CON TU CLIENT_ID
  private API_KEY = 'TU_API_KEY'; // ⚠️ REEMPLAZAR CON TU API_KEY
  private DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
  private SCOPES = 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file';

  private gapi: any;
  private isInitialized = false;

  constructor() {}

  /**
   * Inicializar Google Drive API
   */
  async initializeGapi(): Promise<boolean> {
    try {
      if (this.isInitialized) return true;

      // Verificar credenciales
      if (this.CLIENT_ID.includes('TU_CLIENT_ID') || this.API_KEY.includes('TU_API_KEY')) {
        console.error('❌ GOOGLE DRIVE NO CONFIGURADO');
        console.error('🔧 Para usar Google Drive necesitas configurar las credenciales:');
        console.error('   1. Ve a: https://console.cloud.google.com/');
        console.error('   2. Sigue las instrucciones en GOOGLE_DRIVE_SETUP.md');
        console.error('   3. O usa "URL manual (temporal)" para probar');
        console.error('📋 Archivo de configuración: src/app/services/google-drive.service.ts');
        throw new Error('Google Drive API no configurado - usa URL manual temporal');
      }

      // Cargar GAPI script si no está cargado
      if (!window.gapi) {
        await this.loadGapiScript();
      }

      this.gapi = window.gapi;

      // Inicializar GAPI
      await new Promise((resolve, reject) => {
        this.gapi.load('client:auth2:picker', {
          callback: resolve,
          onerror: (error: any) => {
            console.error('❌ Error cargando GAPI:', error);
            reject(error);
          }
        });
      });

      // Inicializar cliente
      await this.gapi.client.init({
        apiKey: this.API_KEY,
        clientId: this.CLIENT_ID,
        discoveryDocs: [this.DISCOVERY_DOC],
        scope: this.SCOPES
      });

      this.isInitialized = true;
      console.log('✅ Google Drive API inicializada correctamente');
      return true;
    } catch (error: any) {
      console.error('❌ Error al inicializar Google Drive API:', error);
      
      // Diagnóstico específico de errores
      if (error.message?.includes('400')) {
        console.error('🔧 ERROR 400: Problema con las credenciales o configuración');
        console.error('📋 Verifica que:');
        console.error('   1. CLIENT_ID es válido y termina en .apps.googleusercontent.com');
        console.error('   2. API_KEY es válida');
        console.error('   3. Las APIs están habilitadas en Google Cloud Console');
        console.error('   4. El dominio está autorizado (localhost:8100 para desarrollo)');
      }
      
      return false;
    }
  }

  /**
   * Cargar script de Google API
   */
  private loadGapiScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google API script'));
      document.head.appendChild(script);
    });
  }

  /**
   * Verificar si el usuario está autenticado
   */
  async isSignedIn(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initializeGapi();
      }

      const authInstance = this.gapi.auth2.getAuthInstance();
      return authInstance.isSignedIn.get();
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      return false;
    }
  }

  /**
   * Iniciar sesión en Google Drive
   */
  async signIn(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initializeGapi();
      }

      const authInstance = this.gapi.auth2.getAuthInstance();
      
      if (!authInstance.isSignedIn.get()) {
        await authInstance.signIn();
      }

      return authInstance.isSignedIn.get();
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      return false;
    }
  }

  /**
   * Cerrar sesión de Google Drive
   */
  async signOut(): Promise<void> {
    try {
      if (!this.isInitialized) return;

      const authInstance = this.gapi.auth2.getAuthInstance();
      if (authInstance.isSignedIn.get()) {
        await authInstance.signOut();
      }
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }

  /**
   * Abrir el selector de archivos de Google Drive
   */
  async openFilePicker(): Promise<{ id: string; name: string; url: string; mimeType: string } | null> {
    try {
      if (!await this.signIn()) {
        throw new Error('No se pudo autenticar con Google Drive');
      }

      return new Promise((resolve, reject) => {
        // Cargar Google Picker
        this.gapi.load('picker', () => {
          const accessToken = this.gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token;
          
          const picker = new this.gapi.picker.PickerBuilder()
            .enableFeature(this.gapi.picker.Feature.NAV_HIDDEN)
            .enableFeature(this.gapi.picker.Feature.MULTISELECT_ENABLED)
            .setAppId(this.CLIENT_ID.split('.')[0])
            .setOAuthToken(accessToken)
            .addView(new this.gapi.picker.DocsView(this.gapi.picker.ViewId.DOCS_VIDEOS))
            .addView(new this.gapi.picker.DocsView(this.gapi.picker.ViewId.DOCS_IMAGES))
            .setCallback((data: any) => {
              if (data[this.gapi.picker.Response.ACTION] === this.gapi.picker.Action.PICKED) {
                const file = data[this.gapi.picker.Response.DOCUMENTS][0];
                
                const fileInfo = {
                  id: file[this.gapi.picker.Document.ID],
                  name: file[this.gapi.picker.Document.NAME],
                  url: file[this.gapi.picker.Document.URL],
                  mimeType: file[this.gapi.picker.Document.MIME_TYPE]
                };

                resolve(fileInfo);
              } else if (data[this.gapi.picker.Response.ACTION] === this.gapi.picker.Action.CANCEL) {
                resolve(null);
              }
            })
            .build();

          picker.setVisible(true);
        });
      });
    } catch (error) {
      console.error('Error al abrir selector de archivos:', error);
      return null;
    }
  }

  /**
   * Obtener información de un archivo de Google Drive
   */
  async getFileInfo(fileId: string): Promise<any> {
    try {
      if (!this.isInitialized) {
        await this.initializeGapi();
      }

      const response = await this.gapi.client.drive.files.get({
        fileId: fileId,
        fields: 'id,name,mimeType,size,webViewLink,webContentLink,thumbnailLink'
      });

      return response.result;
    } catch (error) {
      console.error('Error obteniendo información del archivo:', error);
      return null;
    }
  }

  /**
   * Crear enlace de vista directa para video
   */
  createDirectViewLink(fileId: string): string {
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }

  /**
   * Verificar si el archivo es un video válido
   */
  isValidVideoFile(mimeType: string): boolean {
    const validVideoTypes = [
      'video/mp4',
      'video/avi',
      'video/mov',
      'video/wmv',
      'video/webm',
      'video/mkv'
    ];
    return validVideoTypes.includes(mimeType);
  }

  /**
   * Verificar si el archivo es una imagen válida
   */
  isValidImageFile(mimeType: string): boolean {
    const validImageTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ];
    return validImageTypes.includes(mimeType);
  }
}