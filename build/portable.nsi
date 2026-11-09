Unicode true
!ifdef NSIS_WIN32_MAKENSIS
  !define MATTOZ_ICON "${BUILD_RESOURCES_DIR}\icon.ico"
!else
  !define MATTOZ_ICON "${BUILD_RESOURCES_DIR}/icon.ico"
!endif
CRCCheck force
SetCompressor zlib
RequestExecutionLevel user
SilentInstall silent
AutoCloseWindow true
Name "MATTOZ Music Player Portátil"
Icon "${MATTOZ_ICON}"
!include "FileFunc.nsh"
Section
  InitPluginsDir
  SetOutPath "$PLUGINSDIR\app"
!ifdef NSIS_WIN32_MAKENSIS
  File /r /x ".*" "${PROJECT_DIR}\dist\win-unpacked\*"
!else
  File /r /x ".*" "${PROJECT_DIR}/dist/win-unpacked/*"
!endif
  System::Call 'Kernel32::SetEnvironmentVariable(t "PORTABLE_EXECUTABLE_DIR", t "$EXEDIR")'
  ${GetParameters} $0
  ExecWait '"$PLUGINSDIR\app\MATTOZ MUSIC PLAYER.exe" $0' $1
  SetErrorLevel $1
SectionEnd
