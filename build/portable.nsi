Unicode true
CRCCheck force
SetCompressor zlib
RequestExecutionLevel user
SilentInstall silent
AutoCloseWindow true
Name "MATTOZ Music Player Portátil"
Icon "${BUILD_RESOURCES_DIR}/icon.ico"
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
