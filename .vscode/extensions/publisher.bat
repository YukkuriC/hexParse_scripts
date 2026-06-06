cd /d "%~dp0"
call hexparse_highlight\prebuild.bat
call hexparse_highlight\build.bat
cd hexparse_highlight
vsce package
vsce publish *.vsix
