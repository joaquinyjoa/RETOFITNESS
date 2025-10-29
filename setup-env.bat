@echo off
echo Configurando variables de entorno para Android...

set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk
set PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%PATH%

echo JAVA_HOME: %JAVA_HOME%
echo ANDROID_HOME: %ANDROID_HOME%
echo.
echo Variables configuradas correctamente!
echo Ahora puedes ejecutar: ionic capacitor run android -l --external
echo.