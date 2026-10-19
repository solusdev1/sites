@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Veo3 - Servidor QA
set "PY="
where python >nul 2>nul && set "PY=python"
if not defined PY (
  where py >nul 2>nul && set "PY=py -3"
)
if not defined PY (
  echo ERRO: Python nao encontrado. Instale o Python 3 e marque "Add to PATH".
  pause
  exit /b 1
)
echo Iniciando servidor QA (Ctrl+C para parar)...
%PY% -m veo_pipeline servir %*
set "RC=%errorlevel%"
if not "%RC%"=="0" (
  echo.
  echo O servidor terminou com erro, codigo %RC%. Porta ocupada ou dependencia faltando?
  pause
)
exit /b %RC%
