; PLUS ULTRA 「GIF 팩」 설치 파일 — 발견물 원본 GIF를 %APPDATA%\PLUS ULTRA\gifpack 에 깐다.
; 먼저 python tools/build_gifpack.py 로 desktop\gifpack 을 만든 뒤, desktop 폴더에서:  makensis /DVERSION=1.0.N gifpack.nsi
; 본 게임(PLUS ULTRA)이 켤 때 이 폴더를 찾아 GIF를 쓴다. 본 게임을 업데이트·재설치해도 팩은 그대로 남는다.
Unicode true
!ifndef VERSION
  !define VERSION "1.0.0"
!endif
!include "MUI2.nsh"

Name "PLUS ULTRA GIF 팩"
OutFile "dist\PLUS-ULTRA-GIF-Pack-${VERSION}.exe"
InstallDir "$APPDATA\PLUS ULTRA\gifpack"
RequestExecutionLevel user
SetCompress off
BrandingText "PLUS ULTRA GIF 팩 ${VERSION}"
ShowInstDetails nevershow

!define MUI_ICON "build\icon.ico"
!define MUI_UNICON "build\icon.ico"
!define MUI_WELCOMEPAGE_TITLE "PLUS ULTRA GIF 팩 ${VERSION}"
!define MUI_WELCOMEPAGE_TEXT "발견물 693곳의 원본 GIF(약 1GB)를 깝니다.$\r$\n$\r$\n깔면 게임이 발견 장면을 원본 GIF로 보여 줍니다. 본 게임(PLUS ULTRA)을 먼저 설치해 두세요.$\r$\n$\r$\n게임을 업데이트해도 팩은 그대로 남습니다. 지우면 예전처럼 장면 판으로 돌아갑니다."
!define MUI_FINISHPAGE_TEXT "GIF 팩을 깔았습니다. 게임을 다시 켜면 적용됩니다."
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "Korean"

!define UNINST "Software\Microsoft\Windows\CurrentVersion\Uninstall\PLUSULTRA_GIFPACK"

Section "GIF 팩"
  SetOutPath "$INSTDIR"
  RMDir /r "$INSTDIR\images"
  File /r "gifpack\*.*"
  WriteUninstaller "$INSTDIR\uninstall.exe"
  WriteRegStr HKCU "${UNINST}" "DisplayName" "PLUS ULTRA GIF 팩"
  WriteRegStr HKCU "${UNINST}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "${UNINST}" "Publisher" "limeinstein"
  WriteRegStr HKCU "${UNINST}" "UninstallString" '"$INSTDIR\uninstall.exe"'
  WriteRegStr HKCU "${UNINST}" "InstallLocation" "$INSTDIR"
  WriteRegDWORD HKCU "${UNINST}" "NoModify" 1
  WriteRegDWORD HKCU "${UNINST}" "NoRepair" 1
  WriteRegDWORD HKCU "${UNINST}" "EstimatedSize" 1000000
SectionEnd

Section "Uninstall"
  RMDir /r "$INSTDIR\images"
  Delete "$INSTDIR\pack.json"
  Delete "$INSTDIR\uninstall.exe"
  RMDir "$INSTDIR"
  DeleteRegKey HKCU "${UNINST}"
SectionEnd
