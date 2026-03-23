@echo off
chcp 65001 >nul
title Inspeção Pro - Servidor Local

echo ============================================
echo     Inspeção Pro - Iniciando Servidor
echo ============================================
echo.

cd /d "%~dp0"

echo Verificando Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Node.js nao encontrado!
    echo Instale o Node.js primeiro.
    pause
    exit /b 1
)

echo Node.js encontrado!
node -v
echo.

echo Verificando dependencias...
if not exist "node_modules" (
    echo Instalando dependencias...
    call npm install
    echo.
)

echo ============================================
echo   Servidor iniciando em http://localhost:3000
echo   Pressione Ctrl+C para encerrar
echo ============================================
echo.

:: Abre o navegador automaticamente após 2 segundos
start "" "http://localhost:3000"

:: Inicia o servidor
call npx live-server --port=3000 --no-browser

pause
