cd /d "%~dp0"
python syntaxes/parser.py
npx tsc -p ./
