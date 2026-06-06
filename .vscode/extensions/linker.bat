cd /d "%~dp0hexparse_highlight"
call prebuild.bat
call build.bat
cd ..
mklink /J "%USERPROFILE%\.vscode\extensions\hexParse_highlight" "hexParse_highlight"