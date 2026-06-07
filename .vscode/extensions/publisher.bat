cd /d "%~dp0"
call hexparse_highlight\prebuild.bat
call hexparse_highlight\build.bat
cd hexparse_highlight
call npx standard-version
vsce package
@REM fuck you microsoft I just want an API key for ur dumbass extension
@REM why u torture me with this shitty azure ad site
start https://marketplace.visualstudio.com/manage/publishers/yukkuric
