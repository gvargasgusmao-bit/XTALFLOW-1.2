@echo off
title Lançador da Bancada Virtual de Cristalografia
color 0A

echo ==========================================
echo   INICIANDO SISTEMA DE CRISTALOGRAFIA
echo ==========================================
echo.
echo [1/3] Iniciando Servidor Python (Backend)...
start "Backend API" /min cmd /k "cd backend && venv\Scripts\activate && uvicorn main:app --reload"

echo [2/3] Iniciando Interface React (Frontend)...
start "Frontend Interface" /min cmd /k "cd web && npm run dev"

echo [3/3] Aguardando conexoes (5 segundos)...
timeout /t 5 >nul

echo.
echo [SUCESSO] Abrindo navegador...
start http://localhost:5173

echo.
echo O sistema esta rodando! Nao feche as janelas pretas minimizadas.
echo Pode minimizar esta janela tambem.
pause