@echo off
echo Installing Python dependencies...
pip install -r requirements.txt
echo.
echo Starting ILDO Report Automation Server...
python server.py
pause
