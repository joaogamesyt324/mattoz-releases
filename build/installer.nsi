Unicode true
CRCCheck force
SetCompressor zlib
!include "MUI2.nsh"
!include "x64.nsh"
Name "MATTOZ MUSIC PLAYER"
InstallDir "$LOCALAPPDATA\Programs\MATTOZ Music Player"
RequestExecutionLevel user
!define MUI_ABORTWARNING
!define /redef MUI_ICON "${BUILD_RESOURCES_DIR}/icon.ico"
!define /redef MUI_UNICON "${BUILD_RESOURCES_DIR}/icon.ico"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "PortugueseBR"
Function .onInit
  ${IfNot} ${RunningX64}
    MessageBox MB_OK "Esta versão requer Windows de 64 bits."
    Abort
  ${EndIf}
  MessageBox MB_OKCANCEL "Feche o MATTOZ antes de instalar ou atualizar. Seus dados e MP3s serão preservados." IDOK +2
  Abort
FunctionEnd
Section "MATTOZ"
  SetShellVarContext current
  SetOutPath "$INSTDIR\app"
  File /r /x ".*" "${PROJECT_DIR}/dist/win-unpacked/*"
  SetOutPath "$INSTDIR"
  File "${BUILD_RESOURCES_DIR}/icon.ico"
  WriteUninstaller "$INSTDIR\Desinstalar.exe"
  CreateShortcut "$DESKTOP\MATTOZ Music Player.lnk" "$INSTDIR\app\MATTOZ MUSIC PLAYER.exe" "" "$INSTDIR\icon.ico"
  CreateShortcut "$SMPROGRAMS\MATTOZ Music Player.lnk" "$INSTDIR\app\MATTOZ MUSIC PLAYER.exe" "" "$INSTDIR\icon.ico"
  CreateShortcut "$SMPROGRAMS\MATTOZ Launcher.lnk" "$INSTDIR\app\MATTOZ MUSIC PLAYER.exe" "--launcher" "$INSTDIR\icon.ico"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\MATTOZMusicPlayer" "DisplayName" "MATTOZ MUSIC PLAYER"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\MATTOZMusicPlayer" "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\MATTOZMusicPlayer" "UninstallString" '"$INSTDIR\Desinstalar.exe"'
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\MATTOZMusicPlayer" "DisplayIcon" "$INSTDIR\icon.ico"
SectionEnd
Section "Uninstall"
  SetShellVarContext current
  MessageBox MB_OKCANCEL "Feche o MATTOZ para desinstalar. Sua biblioteca e seus MP3s serão mantidos." IDOK +2
  Abort
  RMDir /r "$INSTDIR\app"
  Delete "$INSTDIR\icon.ico"
  Delete "$INSTDIR\Desinstalar.exe"
  Delete "$DESKTOP\MATTOZ Music Player.lnk"
  Delete "$SMPROGRAMS\MATTOZ Music Player.lnk"
  Delete "$SMPROGRAMS\MATTOZ Launcher.lnk"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\MATTOZMusicPlayer"
  RMDir "$INSTDIR"
SectionEnd
