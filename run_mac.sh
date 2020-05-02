@echo off
set LOGFILE=logFile.log
call :LOG > %LOGFILE%
exit /B

:LOG
cd app
node server.js