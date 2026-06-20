@echo off
echo ===================================================
echo   AirBridge Auto-Start Installer (Silent Mode)
echo ===================================================
echo.
echo Installing AirBridge Daemon to Windows Startup...

set STARTUP_DIR="%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set VBS_FILE=%STARTUP_DIR%\AirBridge_Daemon.vbs

echo Set WshShell = CreateObject("WScript.Shell") > %VBS_FILE%
echo WshShell.Run "cmd.exe /c cd /d ""%~dp0"" && .\venv\Scripts\activate && python laptop_daemon\sync_manager.py", 0, False >> %VBS_FILE%

echo.
echo [SUCCESS] AirBridge will now start silently in the background every time you turn on your PC.
echo No annoying black console windows will pop up!
echo.
pause
