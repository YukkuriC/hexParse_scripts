cd /d "%~dp0"
call hexparse_highlight\build.bat
mklink /J "%USERPROFILE%\.vscode\extensions\hexParse_highlight" "hexparse_highlight"